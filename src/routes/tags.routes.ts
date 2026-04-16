import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { TagsController } from '../controllers/tags.controller';

const router = Router();

router.get('/', authenticateToken, TagsController.list);
router.post('/', authenticateToken, TagsController.create);
router.post('/:tagId/products', authenticateToken, TagsController.attachProduct);
router.delete('/:tagId/products/:productId', authenticateToken, TagsController.detachProduct);

export default router;
