export enum UserRole {
  CONSUMER = 'consumer',
  STORE = 'store',
  DELIVERY = 'delivery',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface UserWithToken {
  user: User;
  token: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  store_name?: string;
}

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}
