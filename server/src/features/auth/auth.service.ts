import {
  AuthenticateUserDTO,
  CreateUserDTO,
  User,
  UserRole,
  UserWithPassword,
  UserWithToken,
} from './auth.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';

const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('email', email)
    .maybeSingle();

  if (error) throw Boom.internal(error.message);
  return data;
};

const getUserWithPasswordByEmail = async (
  email: string
): Promise<UserWithPassword | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, password')
    .eq('email', email)
    .maybeSingle();

  if (error) throw Boom.internal(error.message);
  return data;
};

const createUser = async (dto: CreateUserDTO): Promise<User> => {
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert({ name: dto.name, email: dto.email, password: hashedPassword, role: dto.role })
    .select('id, name, email, role')
    .single();

  if (error) throw Boom.internal(error.message);
  return data;
};

const createStoreForUser = async (userId: string, store_name: string) => {
  const { error } = await supabase
    .from('stores')
    .insert({ name: store_name, is_open: false, user_id: userId });

  if (error) throw Boom.internal(error.message);
};

const generateToken = (user: User): string => {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const createUserService = async (
  dto: CreateUserDTO
): Promise<UserWithToken> => {
  const existing = await getUserByEmail(dto.email);

  if (existing) {
    throw Boom.conflict('Email already registered');
  }

  const user = await createUser(dto);

  if (dto.role === UserRole.STORE && dto.store_name) {
    await createStoreForUser(user.id, dto.store_name);
  }

  const token = generateToken(user);

  return { user, token };
};

export const authenticateUserService = async (
  credentials: AuthenticateUserDTO
): Promise<UserWithToken> => {
  const user = await getUserWithPasswordByEmail(credentials.email);

  if (!user) {
    throw Boom.unauthorized('Invalid credentials');
  }

  const valid = await bcrypt.compare(credentials.password, user.password);

  if (!valid) {
    throw Boom.unauthorized('Invalid credentials');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = user;
  const token = generateToken(userWithoutPassword);

  return { user: userWithoutPassword, token };
};
