import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { CalendarController } from '../controllers/calendar.controller';

const router = Router();

router.get('/', authenticateToken, CalendarController.list);
router.post('/', authenticateToken, CalendarController.create);
router.put('/:id', authenticateToken, CalendarController.update);
router.delete('/:id', authenticateToken, CalendarController.remove);

export default router;
