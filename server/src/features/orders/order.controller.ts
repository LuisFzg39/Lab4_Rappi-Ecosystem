import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  acceptOrderService,
  createOrderService,
  getAvailableOrdersService,
  getDeliveryOrdersService,
  getOrderByIdService,
  getOrdersByConsumerService,
  getOrdersByStoreService,
  updateDeliveryPositionService,
  updateOrderStatusService,
} from './order.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';

export const createOrderController = async (req: Request, res: Response) => {
  const { id: consumerId } = getUserFromRequest(req);
  const { store_id, items, destination_lat, destination_lng } = req.body;

  if (!store_id) throw Boom.badRequest('store_id is required');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw Boom.badRequest('items must be a non-empty array');
  }
  if (typeof destination_lat !== 'number' || typeof destination_lng !== 'number') {
    throw Boom.badRequest('destination_lat and destination_lng are required numbers');
  }

  const order = await createOrderService({
    consumer_id: consumerId,
    store_id,
    items,
    destination_lat,
    destination_lng,
  });

  return res.status(201).json(order);
};

export const getMyOrdersController = async (req: Request, res: Response) => {
  const { id: consumerId } = getUserFromRequest(req);
  const orders = await getOrdersByConsumerService(consumerId);
  return res.json(orders);
};

export const getStoreOrdersController = async (req: Request, res: Response) => {
  const { id: userId } = getUserFromRequest(req);
  const orders = await getOrdersByStoreService(userId);
  return res.json(orders);
};

export const getAvailableOrdersController = async (
  _req: Request,
  res: Response
) => {
  const orders = await getAvailableOrdersService();
  return res.json(orders);
};

export const getDeliveryOrdersController = async (
  req: Request,
  res: Response
) => {
  const { id: deliveryId } = getUserFromRequest(req);
  const orders = await getDeliveryOrdersService(deliveryId);
  return res.json(orders);
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await getOrderByIdService(String(id));
  return res.json(order);
};

export const acceptOrderController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: deliveryId } = getUserFromRequest(req);
  const order = await acceptOrderService(String(id), deliveryId);
  return res.json(order);
};

export const updatePositionController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { lat, lng } = req.body;
  const { id: deliveryId } = getUserFromRequest(req);

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw Boom.badRequest('lat and lng must be numbers');
  }

  const order = await updateDeliveryPositionService(String(id), deliveryId, { lat, lng });
  return res.json(order);
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { status } = req.body;
  const { id: deliveryId } = getUserFromRequest(req);

  if (!status) throw Boom.badRequest('status is required');

  const order = await updateOrderStatusService(String(id), status, deliveryId);
  return res.json(order);
};
