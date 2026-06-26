import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FiscalYear } from '../types';
import { Calendar, DollarSign, Users, CheckCircle } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';

interface PayrollRunResult {
  periodId: number;
  fiscalYearId: number;
  periodStart: string;
  periodEnd: string;
  totalEmployees: number;
  totalGrossPayroll: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetPayroll: number;
}

export const PayrollRun = () => {
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [runResult, setRunResult] = useState<PayrollRunResult | null>(null);

  const { data: fiscalYears, isLoading: loadingFiscalYears } = useQuery<{ fiscalYears: FiscalYear[] }>({
    queryKey: ['fiscal-years'],
    queryFn: () => api.get('/config/fiscal-years').then((r) => r.data),
  });

  const runPayrollMutation = useMutation({
    mutationFn: (data: { fiscalYearId: number; periodStart: string; periodEnd: string }) =>
      api.post('/payroll/run', data).then((r) => r.data),
    onSuccess: (data: PayrollRunResult) => {
      setRunResult(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPayrollMutation.mutate({
      fiscalYearId: parseInt(fiscalYearId),
      periodStart,
      periodEnd,
    });
  };

  const handleReset = () => {
    setFiscalYearId('');
    setPeriodStart('');
    setPeriodEnd('');
    setRunResult(null);
  };

  if (loadingFiscalYears) {
    return <FullPageLoader message="Loading fiscal years..." />;
  }

  if (runResult) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processed Successfully</h1>
          <p className="text-gray-500 mt-1">The payroll for the selected period has been calculated</p>
        </div>

        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                  <Users className="text-blue-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{runResult.totalEmployees}</p>
                <p className="text-sm text-gray-500">Employees</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">NPR {runResult.totalGrossPayroll.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Gross Payroll</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
                  <DollarSign className="text-red-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">NPR {runResult.totalDeductions.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Deductions</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-2">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">NPR {runResult.totalNetPayroll.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Net Payroll</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardBody>
            <h3 className="font-medium text-gray-900 mb-4">Period Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Period Start</p>
                <p className="font-medium">{new Date(runResult.periodStart).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Period End</p>
                <p className="font-medium">{new Date(runResult.periodEnd).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Earnings</p>
                <p className="font-medium text-green-600">NPR {runResult.totalEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Period ID</p>
                <p className="font-medium">#{runResult.periodId}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={handleReset}>
            Run Another Payroll
          </Button>
          <a href={`/payroll/${runResult.periodId}`}>
            <Button>View Payroll Details</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Run Payroll</h1>
        <p className="text-gray-500 mt-1">Process salary for a new payroll period</p>
      </div>

      <Card>
        <CardBody className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year <span className="text-red-500">*</span>
              </label>
              <select
                value={fiscalYearId}
                onChange={(e) => setFiscalYearId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select fiscal year</option>
                {fiscalYears?.fiscalYears?.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.year} ({new Date(fy.startDate).toLocaleDateString()} - {new Date(fy.endDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {runPayrollMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Failed to run payroll. Please check the period dates and try again.
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" isLoading={runPayrollMutation.isPending} className="flex-1">
                <Calendar size={18} />
                Process Payroll
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Before Running Payroll</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Ensure all active employees have their salary structures configured</li>
          <li>Verify the period dates are correct</li>
          <li>Check that fiscal year is active</li>
        </ul>
      </div>
    </div>
  );
};