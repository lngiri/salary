// /api/employees/:id/structures
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getStructures,
  createStructure,
  updateStructure,
  deleteStructure,
} from '../controllers/salaryStructureController';

const router = Router();

router.use(authenticateToken);

router.get('/employees/:id/structures', getStructures);
router.post('/employees/:id/structures', createStructure);
router.put('/structures/:id', updateStructure);
router.delete('/structures/:id', deleteStructure);

export default router;