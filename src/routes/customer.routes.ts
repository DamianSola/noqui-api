// routes/customer.routes.ts
import { Router } from 'express';
import { CustomerController } from '../controllers/customers.controller';
import {authenticateToken} from '../middlewares/auth.middleware';   

const router = Router();

// Si querés proteger todo con JWT:
// router.use(authenticateToken);

// GET /api/customers?businessId=xxx&page=1&limit=10&search=juan
router.get('/', CustomerController.getAllCustomers);

// GET /api/owner/:ownerId?page=1&limit=10&search=juan
router.get('/owner/:ownerId', CustomerController.getCustomersByOwner);

// GET /api/customers/:id
router.get('/:id', CustomerController.getCustomerById);

// POST /api/customers
router.post('/', CustomerController.createCustomer);

// PUT /api/customers/:id
router.put('/:id', CustomerController.updateCustomer);

// DELETE /api/customers/:id
router.delete('/:id', CustomerController.deleteCustomer);

export default router;
