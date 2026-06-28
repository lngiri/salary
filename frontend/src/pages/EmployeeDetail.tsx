import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Employee, EmployeeSalaryStructure, SalaryHead } from '../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  Banknote,
  Phone,
  GraduationCap,
  Briefcase,
  FileText,
  Edit3,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FullPageLoader } from '../components/LoadingSpinner';
import { LegalInfoIcon } from '../components/LegalInfoIcon';

interface DeactivationResult {
  message: string;
  finalSettlement: {
    totalEarnings: number;
    totalDeductions: number;
    netPayable: number;
  };
}

type TabId = 'personal' | 'salary' | 'contacts' | 'education' | 'work' | 'documents';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
  { id: 'salary', label: 'Salary', icon: <Banknote size={16} /> },
  { id: 'contacts', label: 'Emergency Contacts', icon: <Phone size={16} /> },
  { id: 'education', label: 'Education', icon: <GraduationCap size={16} /> },
  { id: 'work', label: 'Work History', icon: <Briefcase size={16} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
];

export const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('personal');
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

  const { data: structuresData, isLoading: loadingStructures } = useQuery<(EmployeeSalaryStructure & { salaryHead?: SalaryHead })[]>({
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

  const activeStructures = structuresData?.filter((s) => s.effectiveUntil === null) || [];

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/employees" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={18} className="mr-1" />
          Back to Employees
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              {employee.firstName?.[0]}{employee.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
              <p className="text-gray-500 mt-1">
                {employee.designation} - {employee.department}
                {employee.employeeCode && <span className="ml-2 text-gray-400">({employee.employeeCode})</span>}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {employee.status || 'N/A'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <Link to={`/employees/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit3 size={14} />
                Edit
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Employee Code</p>
                <p className="font-medium text-gray-900">{employee.employeeCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium text-gray-900">{employee.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium text-gray-900">{employee.lastName}</p>
              </div>
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
                <p className="font-medium text-gray-900">{employee.pan || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SSF ID</p>
                <p className="font-medium text-gray-900">{employee.ssfId || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">{employee.dateOfBirth?.split('T')[0] || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">{employee.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Marital Status</p>
                <p className="font-medium text-gray-900">{employee.maritalStatus || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nationality</p>
                <p className="font-medium text-gray-900">{employee.nationality || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Citizenship No</p>
                <p className="font-medium text-gray-900">{employee.citizenshipNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{employee.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium text-gray-900">{employee.designation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{employee.department || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employment Type</p>
                <p className="font-medium text-gray-900">{employee.employmentType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Joining</p>
                <p className="font-medium text-gray-900">{employee.dateOfJoining?.split('T')[0] || '-'}</p>
              </div>
              {employee.dateOfLeaving && (
                <div>
                  <p className="text-sm text-gray-500">Date of Leaving</p>
                  <p className="font-medium text-gray-900">{employee.dateOfLeaving.split('T')[0]}</p>
                </div>
              )}
              {employee.reasonForLeaving && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Reason for Leaving</p>
                  <p className="font-medium text-gray-900">{employee.reasonForLeaving}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium text-gray-900">{employee.bankName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account No</p>
                <p className="font-medium text-gray-900">{employee.bankAccountNo || '-'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Salary Structure</h2>
            {employee.status === 'ACTIVE' && (
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
                        Rs. {structure.monthlyAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {employee.status === 'ACTIVE' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Button variant="danger" size="sm" onClick={() => setShowTerminateModal(true)}>
                <AlertTriangle size={16} />
                Terminate Employment
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Emergency Contacts Tab */}
      {activeTab === 'contacts' && (
        <SubModelTab
          title="Emergency Contacts"
          data={employee.emergencyContacts}
          columns={[
            { header: 'Name', accessor: (c) => c.name },
            { header: 'Relationship', accessor: (c) => c.relationship },
            { header: 'Phone', accessor: (c) => c.phone },
            { header: 'Address', accessor: (c) => c.address || '-' },
          ]}
          renderForm={(item, onChange) => (
            <ContactForm data={item} onChange={onChange} />
          )}
          formInitialData={{ name: '', relationship: '', phone: '', address: '' }}
          onCreate={(data) =>
            api.post(`/employees/${id}/contacts`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onUpdate={(itemId, data) =>
            api.put(`/employees/contacts/${itemId}`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onDelete={(itemId) =>
            api.delete(`/employees/contacts/${itemId}`).then(() => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
            })
          }
          emptyMessage="No emergency contacts added"
        />
      )}

      {/* Education Tab */}
      {activeTab === 'education' && (
        <SubModelTab
          title="Education"
          data={employee.educationRecords}
          columns={[
            { header: 'Degree', accessor: (c) => c.degree },
            { header: 'Institution', accessor: (c) => c.institution },
            { header: 'Board', accessor: (c) => c.board || '-' },
            { header: 'Year Passed', accessor: (c) => c.yearPassed?.toString() || '-' },
            { header: 'Grade', accessor: (c) => c.grade || '-' },
          ]}
          renderForm={(item, onChange) => (
            <EducationForm data={item} onChange={onChange} />
          )}
          formInitialData={{ degree: '', institution: '', board: '', yearPassed: '', grade: '' }}
          onCreate={(data) =>
            api.post(`/employees/${id}/education`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onUpdate={(itemId, data) =>
            api.put(`/employees/education/${itemId}`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onDelete={(itemId) =>
            api.delete(`/employees/education/${itemId}`).then(() => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
            })
          }
          emptyMessage="No education records"
        />
      )}

      {/* Work History Tab */}
      {activeTab === 'work' && (
        <SubModelTab
          title="Work History"
          data={employee.workHistories}
          columns={[
            { header: 'Company', accessor: (c) => c.company },
            { header: 'Position', accessor: (c) => c.position },
            { header: 'Start Date', accessor: (c) => c.startDate.split('T')[0] },
            { header: 'End Date', accessor: (c) => (c.endDate ? c.endDate.split('T')[0] : 'Present') },
            { header: 'Reason for Leaving', accessor: (c) => c.reason || '-' },
          ]}
          renderForm={(item, onChange) => (
            <WorkForm data={item} onChange={onChange} />
          )}
          formInitialData={{ company: '', position: '', startDate: '', endDate: '', reason: '' }}
          onCreate={(data) =>
            api.post(`/employees/${id}/work-history`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onUpdate={(itemId, data) =>
            api.put(`/employees/work-history/${itemId}`, data).then((r) => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
              return r.data;
            })
          }
          onDelete={(itemId) =>
            api.delete(`/employees/work-history/${itemId}`).then(() => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] });
            })
          }
          emptyMessage="No work history records"
        />
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Uploaded At</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!employee.documents || employee.documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No documents uploaded
                    </td>
                  </tr>
                ) : (
                  employee.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{doc.fileName}</td>
                      <td className="px-6 py-4 text-gray-700">{doc.uploadedAt.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount (Rs.)</label>
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
                  <p className="font-medium">Rs. {deactivationResult.finalSettlement.totalEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Deductions</p>
                  <p className="font-medium">Rs. {deactivationResult.finalSettlement.totalDeductions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Net Payable</p>
                  <p className="font-medium text-green-600">Rs. {deactivationResult.finalSettlement.netPayable.toLocaleString()}</p>
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

/* ===================== Sub-model CRUD helper ===================== */

interface Column<T> {
  header: string;
  accessor: (item: T) => string;
}

interface SubModelTabProps<TItem extends { id: number }, TForm> {
  title: string;
  data?: TItem[];
  columns: Column<TItem>[];
  renderForm: (data: TForm, onChange: (data: TForm) => void) => React.ReactNode;
  formInitialData: TForm;
  onCreate: (data: TForm) => Promise<TItem>;
  onUpdate: (id: number, data: TForm) => Promise<TItem>;
  onDelete: (id: number) => Promise<void>;
  emptyMessage: string;
}

function SubModelTab<TItem extends { id: number }, TForm>({
  title,
  data,
  columns,
  renderForm,
  formInitialData,
  onCreate,
  onUpdate,
  onDelete,
  emptyMessage,
}: SubModelTabProps<TItem, TForm>) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [formData, setFormData] = useState<TForm>(formInitialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...formInitialData });
    setShowModal(true);
  };

  const openEdit = (item: TItem) => {
    setEditingItem(item);
    setFormData((item as unknown) as TForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, formData);
      } else {
        await onCreate(formData);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const items = data || [];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} />
          Add
        </Button>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                >
                  {col.header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.header} className="px-6 py-4 text-gray-700">
                      {col.accessor(item)}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        <Edit3 size={14} />
                      </Button>
                      {deleteConfirm === item.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            Confirm
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(item.id)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
      >
        <div className="space-y-4">
          {renderForm(formData, setFormData)}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} isLoading={isSubmitting}>
              {editingItem ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ===================== Sub-forms ===================== */

interface ContactFormData {
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

const ContactForm = ({
  data,
  onChange,
}: {
  data: ContactFormData;
  onChange: (d: ContactFormData) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
      <input
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
      <input
        value={data.relationship}
        onChange={(e) => onChange({ ...data, relationship: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
      <input
        value={data.phone}
        onChange={(e) => onChange({ ...data, phone: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
      <input
        value={data.address}
        onChange={(e) => onChange({ ...data, address: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
);

interface EducationFormData {
  degree: string;
  institution: string;
  board: string;
  yearPassed: string;
  grade: string;
}

const EducationForm = ({
  data,
  onChange,
}: {
  data: EducationFormData;
  onChange: (d: EducationFormData) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
      <input
        value={data.degree}
        onChange={(e) => onChange({ ...data, degree: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
      <input
        value={data.institution}
        onChange={(e) => onChange({ ...data, institution: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
      <input
        value={data.board}
        onChange={(e) => onChange({ ...data, board: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Year Passed</label>
      <input
        type="number"
        value={data.yearPassed}
        onChange={(e) => onChange({ ...data, yearPassed: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
      <input
        value={data.grade}
        onChange={(e) => onChange({ ...data, grade: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
);

interface WorkFormData {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const WorkForm = ({
  data,
  onChange,
}: {
  data: WorkFormData;
  onChange: (d: WorkFormData) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
      <input
        value={data.company}
        onChange={(e) => onChange({ ...data, company: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
      <input
        value={data.position}
        onChange={(e) => onChange({ ...data, position: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
      <input
        type="date"
        value={data.startDate}
        onChange={(e) => onChange({ ...data, startDate: e.target.value })}
        required
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
      <input
        type="date"
        value={data.endDate}
        onChange={(e) => onChange({ ...data, endDate: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
      <textarea
        value={data.reason}
        onChange={(e) => onChange({ ...data, reason: e.target.value })}
        rows={2}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
);
