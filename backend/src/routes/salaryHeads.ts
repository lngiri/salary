import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listSalaryHeads, createSalaryHead, updateSalaryHead } from '../controllers/salaryHeadController';

const router = Router();

router.use(authenticateToken);

router.get('/salary-heads', listSalaryHeads);
router.post('/salary-heads', createSalaryHead);
router.put('/salary-heads/:id', updateSalaryHead);

export default router;
