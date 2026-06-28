import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/payroll/run', label: 'Payroll', icon: Wallet },
  { to: '/payroll/history', label: 'Payroll History', icon: Clock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-soft border border-surface-200 hover:bg-surface-50 transition-colors"
      >
        {sidebarOpen ? <X size={20} className="text-surface-600" /> : <Menu size={20} className="text-surface-600" />}
      </button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-surface-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft">
                <Wallet size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900 leading-tight">Salary Sheet</h1>
                <p className="text-xs text-surface-400 font-medium tracking-wide">Nepal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              Menu
            </p>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      className={`transition-colors ${
                        isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
                      }`}
                    />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="text-primary-400" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-surface-200">
            <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-surface-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-surface-800 truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-surface-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-surface-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <LogOut size={18} className="group-hover:text-red-500" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
