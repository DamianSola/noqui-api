import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ReportsController } from '../controllers/reports.controller';

const router = Router();

router.get('/', authenticateToken, ReportsController.list);
router.post('/', authenticateToken, ReportsController.create);
router.get('/:id', authenticateToken, ReportsController.getById);

export default router;
