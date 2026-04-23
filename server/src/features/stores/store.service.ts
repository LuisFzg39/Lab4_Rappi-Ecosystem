import {
  CreateProductDTO,
  Product,
  Store,
  StoreWithProducts,
} from './store.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/database';

export const getStoresService = async (): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, is_open, user_id');

  if (error) throw Boom.internal(error.message);
  return data;
};

export const getStoreByIdService = async (
  storeId: string,
  userId?: string
): Promise<Store> => {
  let query = supabase
    .from('stores')
    .select('id, name, is_open, user_id')
    .eq('id', storeId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw Boom.internal(error.message);
  if (!data) throw Boom.notFound('Store not found');

  return data;
};

export const getProductsByStoreIdService = async (
  storeId: string
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, store_id')
    .eq('store_id', storeId);

  if (error) throw Boom.internal(error.message);
  return data;
};

export const getStoreWithProductsByIdService = async (
  storeId: string
): Promise<StoreWithProducts> => {
  const store = await getStoreByIdService(storeId);
  const products = await getProductsByStoreIdService(storeId);
  return { ...store, products };
};

export const getStoreByUserIdService = async (
  userId: string
): Promise<Store> => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, is_open, user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw Boom.internal(error.message);
  if (!data) throw Boom.notFound('Store not found');

  return data;
};

export const updateStoreIsOpenService = async (
  storeId: string,
  is_open: boolean,
  userId: string
): Promise<Store> => {
  const store = await getStoreByIdService(storeId);
  if (store.user_id !== userId) {
    throw Boom.forbidden('You do not have permission to update this store');
  }

  const { data, error } = await supabase
    .from('stores')
    .update({ is_open })
    .eq('id', storeId)
    .select('id, name, is_open, user_id')
    .single();

  if (error) throw Boom.internal(error.message);
  return data;
};

export const deleteProductService = async (
  productId: string,
  userId: string
): Promise<void> => {
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, store_id')
    .eq('id', productId)
    .maybeSingle();

  if (pErr) throw Boom.internal(pErr.message);
  if (!product) throw Boom.notFound('Product not found');

  await getStoreByIdService(product.store_id, userId);

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw Boom.internal(error.message);
};

export const createProductService = async (
  product: CreateProductDTO
): Promise<Product> => {
  const { name, price, store_id, user_id } = product;

  const store = await getStoreByIdService(store_id);

  if (store.user_id !== user_id) {
    throw Boom.forbidden(
      'You do not have permission to add products to this store'
    );
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ name, price, store_id })
    .select('id, name, price, store_id')
    .single();

  if (error) throw Boom.internal(error.message);
  return data;
};
