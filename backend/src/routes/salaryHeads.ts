import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listSalaryHeads, updateSalaryHead } from '../controllers/salaryHeadController';

const router = Router();

router.use(authenticateToken);

router.get('/api/salary-heads', listSalaryHeads);
router.put('/api/salary-heads/:id', updateSalaryHead);

export default router;
