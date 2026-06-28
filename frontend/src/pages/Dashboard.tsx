import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, CheckCircle, CalendarDays, ArrowRight, Wallet, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { FullPageLoader } from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

interface EmployeeListResponse {
  total: number;
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
    className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 card-hover ${
      variant === 'primary'
        ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 hover:border-primary-300'
        : 'bg-white border-surface-200 hover:border-surface-300'
    }`}
  >
    <div className={`p-3 rounded-xl ${
      variant === 'primary'
        ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-glow'
        : 'bg-surface-100'
    }`}>
      <Icon
        size={22}
        className={variant === 'primary' ? 'text-white' : 'text-surface-600'}
      />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-surface-900">{label}</p>
      <p className="text-sm text-surface-500 mt-0.5">{description}</p>
    </div>
    <ArrowRight size={18} className="text-surface-300 group-hover:text-primary-500 transition-colors" />
  </Link>
);

export const Dashboard = () => {
  const { data: totalEmployees, isLoading: loadingTotal } = useQuery<EmployeeListResponse>({
    queryKey: ['employees', 'total'],
    queryFn: () => api.get('/employees?status=ALL&limit=1').then(r => r.data),
  });

  const { data: activeEmployees, isLoading: loadingActive } = useQuery<EmployeeListResponse>({
    queryKey: ['employees', 'active'],
    queryFn: () => api.get('/employees?status=ACTIVE&limit=1').then(r => r.data),
  });

  const { data: payrollPeriods, isLoading: loadingPeriods } = useQuery<{ count: number }>({
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
      value: totalEmployees?.total ?? 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      link: '/employees',
    },
    {
      label: 'Active Employees',
      value: activeEmployees?.total ?? 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      link: '/employees?status=ACTIVE',
    },
    {
      label: 'Payroll Periods',
      value: payrollPeriods?.count ?? 0,
      icon: CalendarDays,
      gradient: 'from-purple-500 to-purple-600',
      link: '/payroll/history',
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={24} className="text-primary-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900">Dashboard</h1>
        </div>
        <p className="text-surface-500 mt-1 ml-10">Overview of your salary sheet data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="animate-slide-up block"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center gap-4 p-6">
                <div className={`p-3.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-soft`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-surface-900">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-surface-500 mt-0.5">{stat.label}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-surface-900">Quick Actions</h2>
        <p className="text-sm text-surface-500 mt-0.5">Common tasks and shortcuts</p>
      </div>
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
