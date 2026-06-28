import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listFiscalYears, createFiscalYear } from '../controllers/configController';

const router = Router();

router.use(authenticateToken);

router.get('/fiscal-years', listFiscalYears);
router.post('/fiscal-years', createFiscalYear);

export default router;
