import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { SupplyOrdersController } from '../controllers/supplyOrders.controller';

const router = Router();

router.get('/', authenticateToken, SupplyOrdersController.list);
router.post('/', authenticateToken, SupplyOrdersController.create);
router.get('/:id', authenticateToken, SupplyOrdersController.getById);
router.patch('/:id/status', authenticateToken, SupplyOrdersController.updateStatus);

export default router;
