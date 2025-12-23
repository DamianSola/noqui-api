import {BusinessController} from '../controllers/business.controller';
import {Router} from 'express';
import {authenticateToken} from '../middlewares/auth.middleware';   


const router = Router();

// Protected routes
router.get('/', BusinessController.getAllBusiness);
router.post('/', BusinessController.createBusiness);
router.get('/:id', BusinessController.getBusinessById);
router.get('/owner/:ownerId', BusinessController.getBusinessByOwner);
router.put('/:id', BusinessController.updateBusiness);
router.delete('/:id', authenticateToken, BusinessController.deleteBusiness);
router.post('/:id/guests', authenticateToken, BusinessController.addGuestToBusiness);
router.delete('/:id/guests', authenticateToken, BusinessController.removeGuestFromBusiness);

export const companyRouter = router;