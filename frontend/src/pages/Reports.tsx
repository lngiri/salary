import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FiscalYear, PayrollPeriod } from '../types';
import { FileText, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';

export const Reports = () => {
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const { data: fiscalYears, isLoading: loadingFiscalYears } = useQuery<{ fiscalYears: FiscalYear[] }>({
    queryKey: ['fiscal-years'],
    queryFn: () => api.get('/config/fiscal-years').then((r) => r.data),
  });

  const { data: periodsRes, isLoading: loadingPeriods } = useQuery<{ data: PayrollPeriod[]; total: number }>({
    queryKey: ['payroll-periods', 'all'],
    queryFn: () => api.get('/payroll/periods?limit=100').then((r) => r.data),
  });

  const periodsList = periodsRes?.data || [];

  const downloadETDS = () => {
    if (!selectedFiscalYearId) return;
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    window.open(`${baseURL}/payroll/etds-export?fiscalYearId=${selectedFiscalYearId}`, '_blank');
  };

  const downloadSSF = () => {
    if (!selectedPeriodId) return;
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    window.open(`${baseURL}/payroll/ssf-report?periodId=${selectedPeriodId}`, '_blank');
  };

  if (loadingFiscalYears || loadingPeriods) {
    return <FullPageLoader message="Loading report options..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Download E-TDS and SSF reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* E-TDS Report */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">E-TDS Report</h2>
                <p className="text-sm text-gray-500">Annual tax deduction statement</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiscal Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedFiscalYearId}
                  onChange={(e) => setSelectedFiscalYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select fiscal year</option>
                  {fiscalYears?.fiscalYears?.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={downloadETDS}
                disabled={!selectedFiscalYearId}
                className="w-full"
              >
                <Download size={18} />
                Download E-TDS CSV
              </Button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                The E-TDS report contains details of all tax deductions (TDS) made from employee
                salaries during the selected fiscal year, formatted as per income tax regulations.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* SSF Report */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileSpreadsheet className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SSF Report</h2>
                <p className="text-sm text-gray-500">Social Security Fund contributions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payroll Period <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">Select payroll period</option>
                  {periodsList.map((period) => (
                    <option key={period.id} value={period.id}>
                      {new Date(period.periodStart).toLocaleDateString()} -{' '}
                      {new Date(period.periodEnd).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={downloadSSF}
                disabled={!selectedPeriodId}
                variant="secondary"
                className="w-full"
              >
                <Download size={18} />
                Download SSF CSV
              </Button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                The SSF report contains employee and employer contributions to the Social Security
                Fund for the selected payroll period, as required by Nepal's SSF regulations.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody className="p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Report Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">E-TDS Report</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Contains employee PAN, name, and tax details</li>
                <li>• Shows gross salary, deductions, and taxable income</li>
                <li>• Required for annual income tax filing</li>
                <li>• Format: CSV (comma-separated values)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">SSF Report</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Contains employee SSF account numbers</li>
                <li>• Shows employee and employer contribution amounts</li>
                <li>• Required for monthly SSF filing</li>
                <li>• Format: CSV (comma-separated values)</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};