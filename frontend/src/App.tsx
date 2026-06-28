import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

const AuthEventHandler = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [navigate]);
  return null;
};

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Employees = lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const EmployeeAdd = lazy(() => import('./pages/EmployeeAdd').then(m => ({ default: m.EmployeeAdd })));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail').then(m => ({ default: m.EmployeeDetail })));
const EmployeeEdit = lazy(() => import('./pages/EmployeeEdit').then(m => ({ default: m.EmployeeEdit })));
const PayrollRun = lazy(() => import('./pages/PayrollRun').then(m => ({ default: m.PayrollRun })));
const PayrollHistory = lazy(() => import('./pages/PayrollHistory').then(m => ({ default: m.PayrollHistory })));
const PayrollDetail = lazy(() => import('./pages/PayrollDetail').then(m => ({ default: m.PayrollDetail })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Payslip = lazy(() => import('./pages/Payslip').then(m => ({ default: m.Payslip })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingSpinner size={32} className="text-primary-600" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthEventHandler />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><Dashboard /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="employees" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><Employees /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="employees/add" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><EmployeeAdd /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="employees/:id" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><EmployeeDetail /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="employees/:id/edit" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><EmployeeEdit /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="payroll/run" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><PayrollRun /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="payroll/history" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><PayrollHistory /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="payroll/:periodId" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><PayrollDetail /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="payslip/:employeeId/:periodId" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><Payslip /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><Reports /></ErrorBoundary>
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary><Settings /></ErrorBoundary>
              </Suspense>
            } />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
