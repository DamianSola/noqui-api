import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { AuditLogsController } from '../controllers/auditLogs.controller';

const router = Router();

router.get('/', authenticateToken, AuditLogsController.list);

export default router;
