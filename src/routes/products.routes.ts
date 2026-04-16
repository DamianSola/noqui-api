import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ProductsController } from '../controllers/products.controller';

const router = Router();

router.get('/', authenticateToken, ProductsController.list);
router.post('/', authenticateToken, ProductsController.create);
router.get('/:id', authenticateToken, ProductsController.getById);
router.put('/:id', authenticateToken, ProductsController.update);
router.delete('/:id', authenticateToken, ProductsController.remove);

export default router;
