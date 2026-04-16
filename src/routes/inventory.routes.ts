import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();

router.get('/', authenticateToken, InventoryController.list);
router.get('/:id', authenticateToken, InventoryController.getById);
router.patch('/:id', authenticateToken, InventoryController.patch);

export default router;
