import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { NotificationsController } from '../controllers/notifications.controller';

const router = Router();

router.get('/', authenticateToken, NotificationsController.myList);
router.post('/', authenticateToken, NotificationsController.createForUser);
router.patch('/:id/read', authenticateToken, NotificationsController.markRead);

export default router;
