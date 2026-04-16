import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { OrdersController } from '../controllers/orders.controller';

const router = Router();

router.get('/', authenticateToken, OrdersController.list);
router.post('/', authenticateToken, OrdersController.create);
router.get('/:id', authenticateToken, OrdersController.getById);
router.patch('/:id/status', authenticateToken, OrdersController.updateStatus);

export default router;
