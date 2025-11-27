import {CompanyController} from '../controllers/companies.controller';
import {Router} from 'express';
import {authenticateToken} from '../middlewares/auth.middleware';   


const router = Router();

// Protected routes
router.get('/', authenticateToken, CompanyController.getAllCompanies);
router.post('/', authenticateToken, CompanyController.createCompany);
router.get('/:id', authenticateToken, CompanyController.getCompanyById);
router.put('/:id', authenticateToken, CompanyController.updateCompany);
router.delete('/:id', authenticateToken, CompanyController.deleteCompany);