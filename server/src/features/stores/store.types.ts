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

export interface CreateProductDTO {
  name: string;
  price: number;
  store_id: string;
  user_id: string;
}
