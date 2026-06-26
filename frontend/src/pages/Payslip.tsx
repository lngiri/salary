import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';
import { LegalInfoIcon } from '../components/LegalInfoIcon';

interface PayslipLine {
  name: string;
  amount: number;
  legalReference?: string | null;
}

interface PayslipData {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    pan: string;
    designation: string;
  };
  period: {
    id: number;
    periodStart: string;
    periodEnd: string;
  };
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  totals: {
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
}

export const Payslip = () => {
  const { employeeId, periodId } = useParams<{ employeeId: string; periodId: string }>();

  const { data: payslip, isLoading, error } = useQuery<PayslipData>({
    queryKey: ['payslip', employeeId, periodId],
    queryFn: () => api.get(`/payroll/payslip/${employeeId}/${periodId}`).then((r) => r.data),
    enabled: !!employeeId && !!periodId,
  });

  if (isLoading) {
    return <FullPageLoader message="Loading payslip..." />;
  }

  if (error || !payslip) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load payslip</p>
        <Link to={`/payroll/${periodId}`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Payroll Period
        </Link>
      </div>
    );
  }

  const { employee, period, earnings, deductions, totals } = payslip;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to={`/payroll/${periodId}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Payroll Period
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Individual Payslip</h1>
          <p className="text-gray-500 mt-1">
            {new Date(period.periodStart).toLocaleDateString()} -{' '}
            {new Date(period.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText size={16} />
          Print
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {employee.firstName} {employee.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Designation</p>
              <p className="font-medium text-gray-900">{employee.designation || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PAN</p>
              <p className="font-medium text-gray-900">{employee.pan || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period</p>
              <p className="font-medium text-gray-900">#{period.id}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Earnings</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Component</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">No earnings</td>
                  </tr>
                ) : (
                  earnings.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name}
                        <LegalInfoIcon legalReference={item.legalReference} />
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        NPR {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">Total Earnings</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">
                    NPR {totals.totalEarnings.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Deductions</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Component</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deductions.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">No deductions</td>
                  </tr>
                ) : (
                  deductions.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name}
                        <LegalInfoIcon legalReference={item.legalReference} />
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        NPR {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">Total Deductions</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-red-600">
                    NPR {totals.totalDeductions.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Net Pay</h2>
            <p className="text-2xl font-bold text-blue-600">NPR {totals.netPay.toLocaleString()}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
