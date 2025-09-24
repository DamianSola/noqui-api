import { Router } from 'express';
import { login, register, upDateUser, logout, deleteUser } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/:id', authMiddleware, upDateUser)
router.delete('/',authMiddleware, deleteUser)

export default router;