import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ExpensesController } from '../controllers/expenses.controller';

const router = Router();

router.get('/', authenticateToken, ExpensesController.list);
router.post('/', authenticateToken, ExpensesController.create);
router.get('/:id', authenticateToken, ExpensesController.getById);
router.put('/:id', authenticateToken, ExpensesController.update);
router.delete('/:id', authenticateToken, ExpensesController.remove);

export default router;
