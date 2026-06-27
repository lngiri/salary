import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listSalaryHeads, updateSalaryHead } from '../controllers/salaryHeadController';

const router = Router();

router.use(authenticateToken);

router.get('/salary-heads', listSalaryHeads);
router.put('/salary-heads/:id', updateSalaryHead);

export default router;
