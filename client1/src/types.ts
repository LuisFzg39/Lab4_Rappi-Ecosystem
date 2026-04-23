export type UserRole = 'consumer' | 'store' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserWithToken {
  user: User;
  token: string;
}

export interface Store {
  id: string;
  name: string;
  is_open: boolean;
  user_id: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  store_id: string;
}

export interface StoreWithProducts extends Store {
  products: Product[];
}

export interface OrderItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  consumer_id: string;
  store_id: string;
  delivery_id: string | null;
  status: string;
  created_at: string;
  store_name?: string;
  consumer_name?: string;
  destination_lat?: number;
  destination_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  items: OrderItemDetail[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  store_id: string;
  store_name: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}
