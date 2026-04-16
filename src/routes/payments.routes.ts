import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { PaymentsController } from '../controllers/payments.controller';

const router = Router();

router.post('/', authenticateToken, PaymentsController.create);
router.get('/by-order/:orderId', authenticateToken, PaymentsController.getByOrderId);

export default router;
