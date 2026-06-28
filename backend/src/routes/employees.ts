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
import {
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../controllers/employeeContactController';
import {
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from '../controllers/employeeEducationController';
import {
  listWorkHistory,
  createWorkHistory,
  updateWorkHistory,
  deleteWorkHistory,
} from '../controllers/employeeWorkHistoryController';
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/employeeDocumentController';

const router = Router();

router.use(authenticateToken);

router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.put('/:id/deactivate', deactivateEmployee);
router.get('/:id/salary-history', getSalaryHistory);

router.get('/:employeeId/contacts', listEmergencyContacts);
router.post('/:employeeId/contacts', createEmergencyContact);
router.put('/contacts/:id', updateEmergencyContact);
router.delete('/contacts/:id', deleteEmergencyContact);

router.get('/:employeeId/education', listEducation);
router.post('/:employeeId/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

router.get('/:employeeId/work-history', listWorkHistory);
router.post('/:employeeId/work-history', createWorkHistory);
router.put('/work-history/:id', updateWorkHistory);
router.delete('/work-history/:id', deleteWorkHistory);

router.get('/:employeeId/documents', listDocuments);
router.post('/:employeeId/documents', createDocument);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);

export default router;