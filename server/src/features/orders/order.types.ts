export enum OrderStatus {
  CREATED = 'Creado',
  IN_DELIVERY = 'En entrega',
  DELIVERED = 'Entregado',
}

export interface Order {
  id: string;
  consumer_id: string;
  store_id: string;
  delivery_id: string | null;
  status: string;
  created_at: string;
  destination_lat?: number;
  destination_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface OrderWithItems extends Order {
  items: OrderItemDetail[];
  store_name?: string;
  consumer_name?: string;
}

export interface OrderItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDTO {
  consumer_id: string;
  store_id: string;
  items: { product_id: string; quantity: number }[];
  destination_lat: number;
  destination_lng: number;
}

export interface UpdatePositionDTO {
  lat: number;
  lng: number;
}
