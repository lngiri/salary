import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { EmployeeAdd } from './pages/EmployeeAdd';
import { EmployeeDetail } from './pages/EmployeeDetail';
import { PayrollRun } from './pages/PayrollRun';
import { PayrollHistory } from './pages/PayrollHistory';
import { PayrollDetail } from './pages/PayrollDetail';
import { Reports } from './pages/Reports';
import { Payslip } from './pages/Payslip';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/add" element={<EmployeeAdd />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="payroll/run" element={<PayrollRun />} />
          <Route path="payroll/history" element={<PayrollHistory />} />
          <Route path="payroll/:periodId" element={<PayrollDetail />} />
          <Route path="payslip/:employeeId/:periodId" element={<Payslip />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;