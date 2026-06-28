import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PayrollPeriod } from '../types';
import { Eye, Lock, Unlock, Calendar } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

export const PayrollHistory = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ data: PayrollPeriod[]; total: number }>({
    queryKey: ['payroll-periods'],
    queryFn: () => api.get('/payroll/periods?limit=100').then((r) => r.data),
  });

  const lockMutation = useMutation({
    mutationFn: (periodId: number) => api.put(`/payroll/periods/${periodId}/lock`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });

  if (isLoading) {
    return <FullPageLoader message="Loading payroll history..." />;
  }

  const periods = data?.data || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll History</h1>
        <p className="text-gray-500 mt-1">View and manage past payroll periods</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Period Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fiscal Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Locked
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                    Failed to load payroll periods
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No payroll periods found
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">
                      {new Date(period.periodStart).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {new Date(period.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {period.fiscalYear?.name || `FY #${period.fiscalYearId}`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          period.locked
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {period.locked ? 'LOCKED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {period.locked ? (
                        <span className="inline-flex items-center text-gray-500">
                          <Lock size={16} className="mr-1" />
                          Locked
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lockMutation.mutate(period.id)}
                          isLoading={lockMutation.isPending}
                        >
                          <Unlock size={14} />
                          Lock
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/payroll/${period.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye size={16} />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Calendar size={18} />
          About Payroll Periods
        </h3>
        <p className="text-sm text-gray-600">
          Payroll periods represent specific date ranges for which salary is processed. Once a period is locked
          (marked as paid), its data cannot be modified. Use the Lock button to finalize a period after
          all payroll calculations and approvals are complete.
        </p>
      </div>
    </div>
  );
};