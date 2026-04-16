import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { SuppliersController } from '../controllers/suppliers.controller';

const router = Router();

router.get('/', authenticateToken, SuppliersController.list);
router.post('/', authenticateToken, SuppliersController.create);
router.get('/:id', authenticateToken, SuppliersController.getById);
router.put('/:id', authenticateToken, SuppliersController.update);
router.delete('/:id', authenticateToken, SuppliersController.remove);

export default router;
