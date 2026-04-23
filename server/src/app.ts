import express from 'express';
import cors from 'cors';
import { errorsMiddleware } from './middlewares/errorsMiddleware';
import { router as authRouter } from './features/auth/auth.router';
import { router as storeRouter } from './features/stores/store.router';
import { router as orderRouter } from './features/orders/order.router';

export const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json([
    { method: 'POST', endpoint: '/api/auth/register' },
    { method: 'POST', endpoint: '/api/auth/login' },
    { method: 'GET', endpoint: '/api/stores' },
    { method: 'GET', endpoint: '/api/stores/mine' },
    { method: 'GET', endpoint: '/api/stores/:id' },
    { method: 'PATCH', endpoint: '/api/stores/:id' },
    { method: 'POST', endpoint: '/api/stores/:id/products' },
    { method: 'DELETE', endpoint: '/api/stores/:id/products/:productId' },
    { method: 'POST', endpoint: '/api/orders' },
    { method: 'GET', endpoint: '/api/orders/mine' },
    { method: 'GET', endpoint: '/api/orders/store' },
    { method: 'GET', endpoint: '/api/orders/available' },
    { method: 'GET', endpoint: '/api/orders/delivering' },
    { method: 'GET', endpoint: '/api/orders/:id' },
    { method: 'PATCH', endpoint: '/api/orders/:id/accept' },
    { method: 'PATCH', endpoint: '/api/orders/:id/position' },
    { method: 'PATCH', endpoint: '/api/orders/:id/status' },
  ]);
});

app.use('/api/stores', storeRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', orderRouter);

app.use(errorsMiddleware);

export default app;
