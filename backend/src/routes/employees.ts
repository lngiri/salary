// Employee routes - mounted at /api/employees in src/index.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getSalaryHistory,
} from '../controllers/employeeController';

const router = Router();

router.use(authenticateToken);

router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.put('/:id/deactivate', deactivateEmployee);
router.get('/:id/salary-history', getSalaryHistory);

export default router;