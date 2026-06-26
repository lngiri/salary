// POST /api/payroll/run - Run payroll for a period
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  runPayroll,
  listPayrollPeriods,
  getPayrollPeriod,
  getPayslip,
  exportEtDsCsv,
  exportSsfReport,
  lockPayrollPeriod,
} from '../controllers/payrollController';

const router = Router();

router.use(authenticateToken);

// POST /api/payroll/run - Run payroll for a period
router.post('/run', runPayroll);

// GET /api/payroll/periods - List all payroll periods (with fiscal year, transaction/employee counts)
router.get('/periods', listPayrollPeriods);

// GET /api/payroll/periods/:id - Get payroll period with transactions grouped by employee
router.get('/periods/:id', getPayrollPeriod);

// PUT /api/payroll/periods/:id/lock - Lock/unlock a payroll period
router.put('/periods/:id/lock', lockPayrollPeriod);

// GET /api/payroll/payslip/:employeeId/:periodId - Get payslip for employee and period
router.get('/payslip/:employeeId/:periodId', getPayslip);

// GET /api/payroll/etds-export - Export E-TDS CSV (fiscalYearId required, quarter optional)
router.get('/etds-export', exportEtDsCsv);

// GET /api/payroll/ssf-report - Export SSF contribution report CSV (periodId required)
router.get('/ssf-report', exportSsfReport);

export default router;