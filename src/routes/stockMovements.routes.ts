import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { StockMovementsController } from '../controllers/stockMovements.controller';

const router = Router();

router.get('/', authenticateToken, StockMovementsController.list);

export default router;
