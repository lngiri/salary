import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Employee, EmployeeSalaryStructure, SalaryHead } from '../types';
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FullPageLoader } from '../components/LoadingSpinner';
import { LegalInfoIcon } from '../components/LegalInfoIcon';

interface SalaryStructuresResponse {
  structures: (EmployeeSalaryStructure & { salaryHead?: SalaryHead })[];
}

interface DeactivationResult {
  message: string;
  finalSettlement: {
    totalEarnings: number;
    totalDeductions: number;
    netPayable: number;
  };
}

export const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationData, setTerminationData] = useState({ lastWorkingDate: '', reason: '' });
  const [deactivationResult, setDeactivationResult] = useState<DeactivationResult | null>(null);
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [newStructure, setNewStructure] = useState({ salaryHeadId: '', monthlyAmount: '' });

  const { data: employee, isLoading: loadingEmployee } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: structuresData, isLoading: loadingStructures } = useQuery<SalaryStructuresResponse>({
    queryKey: ['employee-structures', id],
    queryFn: () => api.get(`/employees/${id}/structures`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: salaryHeads } = useQuery<{ salaryHeads: SalaryHead[] }>({
    queryKey: ['salary-heads'],
    queryFn: () => api.get('/salary-heads').then((r) => r.data),
  });

  const deactivateMutation = useMutation({
    mutationFn: (data: { lastWorkingDate: string; reason: string }) =>
      api.put(`/employees/${id}/deactivate`, data).then((r) => r.data),
    onSuccess: (data: DeactivationResult) => {
      setDeactivationResult(data);
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });

  const addStructureMutation = useMutation({
    mutationFn: (data: { salaryHeadId: number; monthlyAmount: number; effectiveFrom: string }) =>
      api.post(`/employees/${id}/structures`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-structures', id] });
      setShowAddStructure(false);
      setNewStructure({ salaryHeadId: '', monthlyAmount: '' });
    },
  });

  const handleTerminate = () => {
    deactivateMutation.mutate(terminationData);
  };

  const handleAddStructure = (e: React.FormEvent) => {
    e.preventDefault();
    addStructureMutation.mutate({
      salaryHeadId: parseInt(newStructure.salaryHeadId),
      monthlyAmount: parseFloat(newStructure.monthlyAmount),
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
  };

  if (loadingEmployee || loadingStructures) {
    return <FullPageLoader message="Loading employee details..." />;
  }

  if (!employee) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Employee not found</p>
        <Link to="/employees" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Employees
        </Link>
      </div>
    );
  }

  const activeStructures = structuresData?.structures?.filter((s) => s.isActive) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/employees" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={18} className="mr-1" />
          Back to Employees
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
            <p className="text-gray-500 mt-1">{employee.designation} - {employee.department}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {employee.status?.toUpperCase() || 'N/A'}
          </span>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{employee.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PAN</p>
              <p className="font-medium text-gray-900">{employee.employeeId || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-900">{employee.dateOfBirth?.split('T')[0] || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="font-medium text-gray-900">{employee.joinDate?.split('T')[0] || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{employee.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank</p>
              <p className="font-medium text-gray-900">{employee.bankName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account No</p>
              <p className="font-medium text-gray-900">{employee.bankAccountNo || '-'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Salary Structures */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Salary Structure</h2>
          {employee.status === 'active' && (
            <Button size="sm" onClick={() => setShowAddStructure(true)}>
              <Plus size={16} />
              Add Component
            </Button>
          )}
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Component</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monthly Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeStructures.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No salary structure components added
                  </td>
                </tr>
              ) : (
                activeStructures.map((structure) => (
                  <tr key={structure.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {structure.salaryHead?.name || `Head #${structure.salaryHeadId}`}
                      <LegalInfoIcon legalReference={structure.salaryHead?.legalReference} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          structure.salaryHead?.type === 'EARNING'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {structure.salaryHead?.type?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      NPR {structure.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Terminate Button */}
      {employee.status === 'active' && (
        <Button variant="danger" onClick={() => setShowTerminateModal(true)}>
          <AlertTriangle size={18} />
          Terminate Employment
        </Button>
      )}

      {/* Add Structure Modal */}
      <Modal isOpen={showAddStructure} onClose={() => setShowAddStructure(false)} title="Add Salary Component">
        <form onSubmit={handleAddStructure} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Head</label>
            <select
              value={newStructure.salaryHeadId}
              onChange={(e) => setNewStructure({ ...newStructure, salaryHeadId: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a salary head</option>
              {salaryHeads?.salaryHeads?.map((head) => (
                <option key={head.id} value={head.id}>
                  {head.name} ({head.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount (NPR)</label>
            <input
              type="number"
              step="0.01"
              value={newStructure.monthlyAmount}
              onChange={(e) => setNewStructure({ ...newStructure, monthlyAmount: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddStructure(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addStructureMutation.isPending}>
              Add Component
            </Button>
          </div>
        </form>
      </Modal>

      {/* Termination Modal */}
      <Modal
        isOpen={showTerminateModal}
        onClose={() => {
          setShowTerminateModal(false);
          setTerminationData({ lastWorkingDate: '', reason: '' });
          setDeactivationResult(null);
        }}
        title="Terminate Employment"
        size="lg"
      >
        {deactivationResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">{deactivationResult.message}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Final Settlement</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Earnings</p>
                  <p className="font-medium">NPR {deactivationResult.finalSettlement.totalEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Deductions</p>
                  <p className="font-medium">NPR {deactivationResult.finalSettlement.totalDeductions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Net Payable</p>
                  <p className="font-medium text-green-600">NPR {deactivationResult.finalSettlement.netPayable.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTerminate();
            }}
            className="space-y-4"
          >
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                This action will deactivate the employee and calculate their final settlement.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Date</label>
              <input
                type="date"
                value={terminationData.lastWorkingDate}
                onChange={(e) => setTerminationData({ ...terminationData, lastWorkingDate: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Termination</label>
              <textarea
                value={terminationData.reason}
                onChange={(e) => setTerminationData({ ...terminationData, reason: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {deactivateMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Failed to terminate employment. Please try again.
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowTerminateModal(false);
                  setTerminationData({ lastWorkingDate: '', reason: '' });
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" type="submit" isLoading={deactivateMutation.isPending}>
                <Trash2 size={16} />
                Terminate
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};