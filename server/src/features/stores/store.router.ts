import { Router } from 'express';
import {
  getStoresController,
  getStoreByIdController,
  getMyStoreController,
  updateStoreController,
  createProductController,
  deleteProductController,
} from './store.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);
router.get('/', getStoresController);
router.get('/mine', getMyStoreController);
router.get('/:id', getStoreByIdController);
router.patch('/:id', updateStoreController);
router.post('/:id/products', createProductController);
router.delete('/:id/products/:productId', deleteProductController);
