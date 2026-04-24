import Boom from '@hapi/boom';
import { supabase } from '../../config/database';
import {
  CreateOrderDTO,
  OrderStatus,
  OrderWithItems,
  UpdatePositionDTO,
} from './order.types';

const buildOrderWithItems = async (orderId: string): Promise<OrderWithItems> => {
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .select('id, consumer_id, store_id, delivery_id, status, created_at')
    .eq('id', orderId)
    .single();

  if (oErr || !order) throw Boom.notFound('Order not found');

  // Obtener coordenadas geográficas vía PostGIS RPC
  const { data: geo } = await supabase.rpc('get_order_geo', { p_order_id: orderId });
  const geoData = geo && geo.length > 0 ? geo[0] : null;

  const { data: store } = await supabase
    .from('stores')
    .select('name')
    .eq('id', order.store_id)
    .single();

  const { data: consumer } = await supabase
    .from('users')
    .select('name')
    .eq('id', order.consumer_id)
    .single();

  const { data: items, error: iErr } = await supabase
    .from('order_items')
    .select('id, product_id, quantity, price, products(name)')
    .eq('order_id', orderId);

  if (iErr) throw Boom.internal(iErr.message);

  return {
    ...order,
    destination_lat: geoData?.destination_lat ?? undefined,
    destination_lng: geoData?.destination_lng ?? undefined,
    delivery_lat: geoData?.delivery_lat ?? undefined,
    delivery_lng: geoData?.delivery_lng ?? undefined,
    store_name: store?.name,
    consumer_name: consumer?.name,
    items: (items || []).map((i: Record<string, unknown>) => ({
      id: i.id as string,
      product_id: i.product_id as string,
      product_name: (i.products as { name: string })?.name || '',
      quantity: i.quantity as number,
      price: i.price as number,
    })),
  };
};

const buildOrdersList = async (
  filter: { column: string; value: string } | null,
  statusFilter?: { column: string; value: string }
): Promise<OrderWithItems[]> => {
  let query = supabase
    .from('orders')
    .select('id, consumer_id, store_id, delivery_id, status, created_at')
    .order('created_at', { ascending: false });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  if (statusFilter) {
    query = query.eq(statusFilter.column, statusFilter.value);
  }

  const { data: orders, error } = await query;
  if (error) throw Boom.internal(error.message);

  const results: OrderWithItems[] = [];
  for (const o of orders || []) {
    results.push(await buildOrderWithItems(o.id));
  }
  return results;
};

export const createOrderService = async (
  dto: CreateOrderDTO
): Promise<OrderWithItems> => {
  const { data: store, error: sErr } = await supabase
    .from('stores')
    .select('id, is_open')
    .eq('id', dto.store_id)
    .maybeSingle();

  if (sErr) throw Boom.internal(sErr.message);
  if (!store) throw Boom.notFound('Store not found');
  if (!store.is_open) throw Boom.badRequest('Store is currently closed');

  // Insertar pedido con destino geográfico vía PostGIS RPC
  const { data: newOrderId, error: oErr } = await supabase.rpc('insert_order_with_geo', {
    p_consumer_id: dto.consumer_id,
    p_store_id: dto.store_id,
    p_status: OrderStatus.CREATED,
    p_destination_lng: dto.destination_lng,
    p_destination_lat: dto.destination_lat,
  });

  const order = { id: newOrderId };

  if (oErr) throw Boom.internal(oErr.message);

  for (const item of dto.items) {
    const { data: product } = await supabase
      .from('products')
      .select('id, price')
      .eq('id', item.product_id)
      .eq('store_id', dto.store_id)
      .maybeSingle();

    if (!product) throw Boom.badRequest(`Product ${item.product_id} not found in this store`);

    const { error: iiErr } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });

    if (iiErr) throw Boom.internal(iiErr.message);
  }

  return buildOrderWithItems(order.id);
};

export const getOrderByIdService = async (orderId: string): Promise<OrderWithItems> => {
  return buildOrderWithItems(orderId);
};

export const getOrdersByConsumerService = async (consumerId: string): Promise<OrderWithItems[]> => {
  return buildOrdersList({ column: 'consumer_id', value: consumerId });
};

export const getOrdersByStoreService = async (userId: string): Promise<OrderWithItems[]> => {
  const { data: store, error } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw Boom.internal(error.message);
  if (!store) throw Boom.notFound('Store not found');

  return buildOrdersList({ column: 'store_id', value: store.id });
};

export const getAvailableOrdersService = async (): Promise<OrderWithItems[]> => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', OrderStatus.CREATED)
    .is('delivery_id', null)
    .order('created_at', { ascending: true });

  if (error) throw Boom.internal(error.message);

  const results: OrderWithItems[] = [];
  for (const o of orders || []) {
    results.push(await buildOrderWithItems(o.id));
  }
  return results;
};

export const getDeliveryOrdersService = async (deliveryId: string): Promise<OrderWithItems[]> => {
  return buildOrdersList({ column: 'delivery_id', value: deliveryId });
};

export const acceptOrderService = async (
  orderId: string,
  deliveryId: string
): Promise<OrderWithItems> => {
  const order = await buildOrderWithItems(orderId);

  if (order.status !== OrderStatus.CREATED) {
    throw Boom.badRequest('Order is not available for acceptance');
  }
  if (order.delivery_id) {
    throw Boom.badRequest('Order already has a delivery assigned');
  }

  const { error } = await supabase
    .from('orders')
    .update({ delivery_id: deliveryId, status: OrderStatus.IN_DELIVERY })
    .eq('id', orderId);

  if (error) throw Boom.internal(error.message);

  const updatedOrder = await buildOrderWithItems(orderId);
  console.log(`[Server] Order ${orderId} accepted by ${deliveryId}, status: ${updatedOrder.status}`);
  return updatedOrder;
};

export const updateDeliveryPositionService = async (
  orderId: string,
  deliveryId: string,
  position: UpdatePositionDTO
): Promise<OrderWithItems> => {
  const order = await buildOrderWithItems(orderId);

  if (order.delivery_id !== deliveryId) {
    throw Boom.forbidden('You are not assigned to this order');
  }

  if (order.status !== OrderStatus.IN_DELIVERY) {
    throw Boom.badRequest('Order is not in delivery');
  }

  // Actualizar posición del repartidor vía PostGIS RPC
  const { error } = await supabase.rpc('update_delivery_position', {
    p_order_id: orderId,
    p_lng: position.lng,
    p_lat: position.lat,
  });

  if (error) throw Boom.internal(error.message);

  // Verificar llegada usando ST_Distance de PostGIS
  const ARRIVAL_THRESHOLD_METERS = 15;
  const { data: arrival, error: arrErr } = await supabase.rpc('check_delivery_arrival', {
    p_order_id: orderId,
  });

  if (arrErr) throw Boom.internal(arrErr.message);

  const arrivalData = arrival && arrival.length > 0 ? arrival[0] : null;
  const distance = arrivalData?.distance_meters ?? Infinity;
  const isArrived = distance <= ARRIVAL_THRESHOLD_METERS;

  console.log(`[Server] Position update for order ${orderId}: (${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}) - distance to dest: ${distance.toFixed(1)}m`);

  if (isArrived) {
    const { error: statusErr } = await supabase
      .from('orders')
      .update({ status: OrderStatus.DELIVERED })
      .eq('id', orderId);

    if (statusErr) throw Boom.internal(statusErr.message);

    console.log(`[Server] Order ${orderId} marked as DELIVERED (distance: ${distance.toFixed(1)}m)`);
    return buildOrderWithItems(orderId);
  }

  return buildOrderWithItems(orderId);
};

export const updateOrderStatusService = async (
  orderId: string,
  status: string,
  deliveryId: string
): Promise<OrderWithItems> => {
  const validStatuses = [OrderStatus.IN_DELIVERY, OrderStatus.DELIVERED];
  if (!validStatuses.includes(status as OrderStatus)) {
    throw Boom.badRequest(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await buildOrderWithItems(orderId);
  if (order.delivery_id !== deliveryId) {
    throw Boom.forbidden('You are not assigned to this order');
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw Boom.internal(error.message);

  return buildOrderWithItems(orderId);
};
