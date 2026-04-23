import express from 'express';
import cors from 'cors';
import { errorsMiddleware } from './middlewares/errorsMiddleware';
import { router as authRouter } from './features/auth/auth.router';
import { router as storeRouter } from './features/stores/store.router';
import { router as orderRouter } from './features/orders/order.router';

export const app = express();
app.use(express.json());
app.use(cors());

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
