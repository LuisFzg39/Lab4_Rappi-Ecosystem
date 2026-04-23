import { Router } from 'express';
import {
  createOrderController,
  getMyOrdersController,
  getStoreOrdersController,
  getAvailableOrdersController,
  getDeliveryOrdersController,
  getOrderByIdController,
  acceptOrderController,
  updatePositionController,
  updateOrderStatusController,
} from './order.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

export const router = Router();

router.use(authMiddleware);

router.post('/', createOrderController);
router.get('/mine', getMyOrdersController);
router.get('/store', getStoreOrdersController);
router.get('/available', getAvailableOrdersController);
router.get('/delivering', getDeliveryOrdersController);
router.get('/:id', getOrderByIdController);
router.patch('/:id/accept', acceptOrderController);
router.patch('/:id/position', updatePositionController);
router.patch('/:id/status', updateOrderStatusController);
