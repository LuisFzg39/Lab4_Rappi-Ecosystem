import { Request, Response, NextFunction } from 'express';
import Boom from '@hapi/boom';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { User } from '../features/auth/auth.types';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const getUserFromRequest = (req: AuthenticatedRequest): User => {
  if (req.user) {
    return req.user;
  }
  throw Boom.unauthorized('User not authenticated');
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    throw Boom.unauthorized('Authorization header is missing');
  }

  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    throw Boom.unauthorized('Token is missing');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as User;
    req.user = payload;
    next();
  } catch {
    throw Boom.unauthorized('Invalid or expired token');
  }
};
