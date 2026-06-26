import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ArrowLeft, Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';
import { LegalInfoIcon } from '../components/LegalInfoIcon';

interface SalaryHeadInfo {
  id: number;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  legalReference?: string | null;
}

interface PayrollTx {
  id: number;
  salaryHead: SalaryHeadInfo;
  amount: number;
}

interface EmployeeSummary {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    pan: string;
    designation: string;
  };
  transactions: PayrollTx[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}

interface PayrollPeriodDetail {
  id: number;
  periodStart: string;
  periodEnd: string;
  locked: boolean;
  fiscalYear: { id: number; name: string };
  employees: EmployeeSummary[];
}

export const PayrollDetail = () => {
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const [expandedEmployees, setExpandedEmployees] = useState<Record<number, boolean>>({});

  const { data: period, isLoading, error } = useQuery<PayrollPeriodDetail>({
    queryKey: ['payroll-period', periodId],
    queryFn: () => api.get(`/payroll/periods/${periodId}`).then((r) => r.data),
    enabled: !!periodId,
  });

  const toggleEmployee = (employeeId: number) => {
    setExpandedEmployees((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const viewPayslip = (employeeId: number) => {
    navigate(`/payslip/${employeeId}/${periodId}`);
  };

  if (isLoading) {
    return <FullPageLoader message="Loading payroll details..." />;
  }

  if (error || !period) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load payroll period</p>
        <Link to="/payroll/history" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Payroll History
        </Link>
      </div>
    );
  }

  const totalNetPayroll = period.employees?.reduce((sum, e) => sum + e.netPay, 0) || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/payroll/history" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={18} className="mr-1" />
          Back to Payroll History
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Period Details</h1>
            <p className="text-gray-500 mt-1">
              {new Date(period.periodStart).toLocaleDateString()} -{' '}
              {new Date(period.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              period.locked
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {period.locked ? 'LOCKED' : 'DRAFT'}
          </span>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Period Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Period Start</p>
              <p className="font-medium text-gray-900">{new Date(period.periodStart).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period End</p>
              <p className="font-medium text-gray-900">{new Date(period.periodEnd).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fiscal Year</p>
              <p className="font-medium text-gray-900">
                {period.fiscalYear?.name || `FY #${period.fiscalYear.id}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Net Payroll</p>
              <p className="font-medium text-gray-900">NPR {totalNetPayroll.toLocaleString()}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Employee Salaries</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!period.employees || period.employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No employees found for this period
                  </td>
                </tr>
              ) : (
                period.employees.map((summary) => (
                  <React.Fragment key={summary.employee.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleEmployee(summary.employee.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          {expandedEmployees[summary.employee.id] ? (
                            <ChevronDown size={18} className="text-gray-500" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {summary.employee.firstName} {summary.employee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{summary.employee.pan || '-'}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {summary.employee.designation || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                        NPR {summary.totalEarnings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600">
                        NPR {summary.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        NPR {summary.netPay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPayslip(summary.employee.id)}
                        >
                          <Download size={14} />
                          Payslip
                        </Button>
                      </td>
                    </tr>
                    {expandedEmployees[summary.employee.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Component
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Type
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {summary.transactions.map((tx) => (
                                <tr key={tx.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {tx.salaryHead.name}
                                    <LegalInfoIcon legalReference={tx.salaryHead.legalReference} />
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        tx.salaryHead.type === 'EARNING'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {tx.salaryHead.type.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                                    NPR {tx.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <FileText size={18} />
          Payslips
        </h3>
        <p className="text-sm text-blue-800">
          Click the Payslip button next to each employee to view their individual payslip. Use the arrow on the left to expand and see every salary component with legal references.
        </p>
      </div>
    </div>
  );
};
