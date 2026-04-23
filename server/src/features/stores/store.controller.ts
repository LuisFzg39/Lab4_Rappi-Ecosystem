import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import {
  createProductService,
  deleteProductService,
  getStoreByUserIdService,
  getStoreWithProductsByIdService,
  getStoresService,
  updateStoreIsOpenService,
} from './store.service';
import { getUserFromRequest } from '../../middlewares/authMiddleware';

export const getStoresController = async (_req: Request, res: Response) => {
  const stores = await getStoresService();
  return res.json(stores);
};

export const getStoreByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = await getStoreWithProductsByIdService(String(id));
  return res.json(store);
};

export const getMyStoreController = async (req: Request, res: Response) => {
  const { id: userId } = getUserFromRequest(req);
  const store = await getStoreByUserIdService(userId);
  return res.json(store);
};

export const updateStoreController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_open } = req.body;
  const { id: userId } = getUserFromRequest(req);

  if (typeof is_open !== 'boolean') {
    throw Boom.badRequest('is_open must be a boolean');
  }

  const store = await updateStoreIsOpenService(String(id), is_open, userId);
  return res.json(store);
};

export const deleteProductController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { id: userId } = getUserFromRequest(req);
  await deleteProductService(String(productId), userId);
  return res.status(204).send();
};

export const createProductController = async (req: Request, res: Response) => {
  const { name, price } = req.body;
  const { id: storeId } = req.params;
  const { id: userId } = getUserFromRequest(req);

  if (!name) {
    throw Boom.badRequest('Product name is required');
  }

  if (isNaN(price)) {
    throw Boom.badRequest('Product price is required');
  }

  const product = await createProductService({
    name,
    price,
    store_id: String(storeId),
    user_id: userId,
  });
  return res.json(product);
};
