import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import { authenticateUserService, createUserService } from './auth.service';
import { UserRole } from './auth.types';

export const authenticateUserController = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  if (!email) throw Boom.badRequest('Email is required');
  if (!password) throw Boom.badRequest('Password is required');

  const data = await authenticateUserService({ email, password });
  return res.json(data);
};

export const createUserController = async (req: Request, res: Response) => {
  const { name, email, password, role, store_name } = req.body;

  if (!name) throw Boom.badRequest('Name is required');
  if (!email) throw Boom.badRequest('Email is required');
  if (!password) throw Boom.badRequest('Password is required');
  if (!Object.values(UserRole).includes(role)) {
    throw Boom.badRequest(
      `Role must be one of: ${Object.values(UserRole).join(', ')}`
    );
  }
  if (role === UserRole.STORE && !store_name) {
    throw Boom.badRequest('store_name is required for store role');
  }

  const data = await createUserService({ name, email, password, role, store_name });
  return res.status(201).json(data);
};
