import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FiscalYear, SalaryHead } from '../types';
import { Plus, Calendar, DollarSign, AlertCircle, Pencil } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FullPageLoader } from '../components/LoadingSpinner';

export const Settings = () => {
  const queryClient = useQueryClient();
  const [showAddFiscalYear, setShowAddFiscalYear] = useState(false);
  const [showAddSalaryHead, setShowAddSalaryHead] = useState(false);
  const [editingHead, setEditingHead] = useState<SalaryHead | null>(null);
  const [fiscalYearForm, setFiscalYearForm] = useState({
    year: '',
    startDate: '',
    endDate: '',
    taxSlabs: '[]',
  });
  const [salaryHeadForm, setSalaryHeadForm] = useState({
    name: '',
    type: 'EARNING' as 'EARNING' | 'DEDUCTION',
    category: 'other' as string,
  });

  const { data: fiscalYearsData, isLoading: loadingFiscalYears } = useQuery<{ fiscalYears: FiscalYear[] }>({
    queryKey: ['fiscal-years'],
    queryFn: () => api.get('/config/fiscal-years').then((r) => r.data),
  });

  const { data: salaryHeadsData, isLoading: loadingSalaryHeads } = useQuery<{ salaryHeads: SalaryHead[] }>({
    queryKey: ['salary-heads'],
    queryFn: () => api.get('/salary-heads').then((r) => r.data),
  });

  const addFiscalYearMutation = useMutation({
    mutationFn: (data: typeof fiscalYearForm) =>
      api.post('/config/fiscal-years', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      setShowAddFiscalYear(false);
      setFiscalYearForm({ year: '', startDate: '', endDate: '', taxSlabs: '[]' });
    },
  });

  const addSalaryHeadMutation = useMutation({
    mutationFn: (data: typeof salaryHeadForm) =>
      api.post('/salary-heads', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-heads'] });
      setShowAddSalaryHead(false);
      setSalaryHeadForm({ name: '', type: 'EARNING', category: 'other' });
    },
  });

  const updateLegalReferenceMutation = useMutation({
    mutationFn: ({ id, legalReference }: { id: number; legalReference: string }) =>
      api.put(`/salary-heads/${id}`, { legalReference }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-heads'] });
      setEditingHead(null);
    },
  });

  const handleAddFiscalYear = (e: React.FormEvent) => {
    e.preventDefault();
    addFiscalYearMutation.mutate(fiscalYearForm);
  };

  const handleAddSalaryHead = (e: React.FormEvent) => {
    e.preventDefault();
    addSalaryHeadMutation.mutate(salaryHeadForm);
  };

  const handleUpdateLegalReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHead) return;
    updateLegalReferenceMutation.mutate({
      id: editingHead.id,
      legalReference: editingHead.legalReference || '',
    });
  };

  if (loadingFiscalYears || loadingSalaryHeads) {
    return <FullPageLoader message="Loading settings..." />;
  }

  const fiscalYears = fiscalYearsData?.fiscalYears || [];
  const salaryHeads = salaryHeadsData?.salaryHeads || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure fiscal years and salary components</p>
      </div>

      {/* Fiscal Years Section */}
      <Card className="mb-8">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Fiscal Years</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddFiscalYear(!showAddFiscalYear)}>
            <Plus size={16} />
            Add Fiscal Year
          </Button>
        </CardHeader>

        {showAddFiscalYear && (
          <CardBody className="border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddFiscalYear} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fiscalYearForm.year}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, year: e.target.value })}
                    placeholder="e.g., FY 2081-82"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fiscalYearForm.startDate}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fiscalYearForm.endDate}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Slabs (JSON)
                </label>
                <textarea
                  value={fiscalYearForm.taxSlabs}
                  onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, taxSlabs: e.target.value })}
                  placeholder='[{"min": 0, "max": 300000, "rate": 1}, ...]'
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              {addFiscalYearMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Failed to add fiscal year. Please check the format.
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" isLoading={addFiscalYearMutation.isPending}>
                  Save Fiscal Year
                </Button>
                <Button variant="outline" type="button" onClick={() => setShowAddFiscalYear(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fiscalYears.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No fiscal years configured
                  </td>
                </tr>
              ) : (
                fiscalYears.map((fy) => (
                  <tr key={fy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{fy.year}</td>
                    <td className="px-6 py-4 text-gray-700">{new Date(fy.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-700">{new Date(fy.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {fy.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salary Heads Section */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Salary Heads</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddSalaryHead(!showAddSalaryHead)}>
            <Plus size={16} />
            Add Salary Head
          </Button>
        </CardHeader>

        {showAddSalaryHead && (
          <CardBody className="border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddSalaryHead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={salaryHeadForm.name}
                    onChange={(e) => setSalaryHeadForm({ ...salaryHeadForm, name: e.target.value })}
                    placeholder="e.g., Basic Salary, House Rent"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={salaryHeadForm.type}
                    onChange={(e) => setSalaryHeadForm({ ...salaryHeadForm, type: e.target.value as 'EARNING' | 'DEDUCTION' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EARNING">Earning</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={salaryHeadForm.category}
                    onChange={(e) => setSalaryHeadForm({ ...salaryHeadForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance</option>
                    <option value="bonus">Bonus</option>
                    <option value="tax">Tax</option>
                    <option value="insurance">Insurance</option>
                    <option value="provident_fund">Provident Fund</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {addSalaryHeadMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Failed to add salary head.
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" isLoading={addSalaryHeadMutation.isPending}>
                  Save Salary Head
                </Button>
                <Button variant="outline" type="button" onClick={() => setShowAddSalaryHead(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Legal Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaryHeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No salary heads configured
                  </td>
                </tr>
              ) : (
                salaryHeads.map((head) => (
                  <tr key={head.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{head.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          head.type === 'EARNING' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {head.type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 capitalize">{head.category?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-gray-700 text-sm max-w-md truncate">
                      {head.legalReference || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingHead(head)}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Legal Reference Modal */}
      <Modal
        isOpen={!!editingHead}
        onClose={() => setEditingHead(null)}
        title={editingHead ? `Edit Legal Reference: ${editingHead.name}` : 'Edit Legal Reference'}
      >
        {editingHead && (
          <form onSubmit={handleUpdateLegalReference} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Reference (Nepali)
              </label>
              <textarea
                value={editingHead.legalReference || ''}
                onChange={(e) => setEditingHead({ ...editingHead, legalReference: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter legal reference text in Nepali..."
              />
            </div>
            {updateLegalReferenceMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Failed to update legal reference.
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" isLoading={updateLegalReferenceMutation.isPending}>
                Save
              </Button>
              <Button variant="outline" type="button" onClick={() => setEditingHead(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
