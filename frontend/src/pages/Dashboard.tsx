import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, CheckCircle, CalendarDays, ArrowRight, Wallet, BarChart3, Settings } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { FullPageLoader } from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

interface CountResponse {
  count: number;
}

interface QuickLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  variant?: 'default' | 'primary';
}

const QuickLink = ({ to, icon: Icon, label, description, variant = 'default' }: QuickLinkProps) => (
  <Link
    to={to}
    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:shadow-md ${
      variant === 'primary'
        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className={`p-3 rounded-lg ${variant === 'primary' ? 'bg-blue-100' : 'bg-gray-100'}`}>
      <Icon className={variant === 'primary' ? 'text-blue-600' : 'text-gray-600'} size={24} />
    </div>
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <ArrowRight className="ml-auto text-gray-400" size={20} />
  </Link>
);

export const Dashboard = () => {
  const { data: totalEmployees, isLoading: loadingTotal } = useQuery<CountResponse>({
    queryKey: ['employees', 'total'],
    queryFn: () => api.get('/employees?status=ALL&limit=1').then(r => r.data),
  });

  const { data: activeEmployees, isLoading: loadingActive } = useQuery<CountResponse>({
    queryKey: ['employees', 'active'],
    queryFn: () => api.get('/employees?status=ACTIVE&limit=1').then(r => r.data),
  });

  const { data: payrollPeriods, isLoading: loadingPeriods } = useQuery<CountResponse>({
    queryKey: ['payroll-periods', 'count'],
    queryFn: () => api.get('/payroll/periods?limit=1').then(r => r.data),
  });

  const isLoading = loadingTotal || loadingActive || loadingPeriods;

  if (isLoading) {
    return <FullPageLoader message="Loading dashboard..." />;
  }

  const stats = [
    {
      label: 'Total Employees',
      value: totalEmployees?.count ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Active Employees',
      value: activeEmployees?.count ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Payroll Periods Run',
      value: payrollPeriods?.count ?? 0,
      icon: CalendarDays,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your salary sheet data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickLink
          to="/employees"
          icon={Users}
          label="Manage Employees"
          description="View, add, or edit employee records"
        />
        <QuickLink
          to="/payroll/run"
          icon={Wallet}
          label="Run Payroll"
          description="Process salary for a new period"
          variant="primary"
        />
        <QuickLink
          to="/reports"
          icon={BarChart3}
          label="View Reports"
          description="Download E-TDS and SSF reports"
        />
        <QuickLink
          to="/settings"
          icon={Settings}
          label="Settings"
          description="Configure fiscal years and salary heads"
        />
      </div>
    </div>
  );
};