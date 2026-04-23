import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { initDb } from '../config/initDb';

beforeEach(async () => {
  await initDb();
});

async function login(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
}

async function getMyStoreId(token: string): Promise<string> {
  const res = await request(app)
    .get('/api/stores/mine')
    .set('Authorization', `Bearer ${token}`);
  return res.body.id;
}

describe('Auth', () => {
  it('should register a new consumer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('consumer');
    expect(res.body.token).toBeDefined();
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@email.com',
      password: '123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

describe('Stores', () => {
  it('should list stores', async () => {
    const token = await login('customer@email.com', '123456');
    const res = await request(app)
      .get('/api/stores')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a product', async () => {
    const token = await login('store@email.com', '123456');
    const storeId = await getMyStoreId(token);
    const res = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Product', price: 15000 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Product');
  });
});

describe('Orders', () => {
  it('should create an order', async () => {
    const storeToken = await login('store@email.com', '123456');
    const storeId = await getMyStoreId(storeToken);

    await request(app)
      .patch(`/api/stores/${storeId}`)
      .set('Authorization', `Bearer ${storeToken}`)
      .send({ is_open: true });

    const storeRes = await request(app)
      .get(`/api/stores/${storeId}`)
      .set('Authorization', `Bearer ${storeToken}`);
    const productId = storeRes.body.products[0].id;

    const consumerToken = await login('customer@email.com', '123456');
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        store_id: storeId,
        items: [{ product_id: productId, quantity: 2 }],
        destination_lat: 3.4516,
        destination_lng: -76.532,
      });
    expect(res.status).toBe(201);
    expect(res.body.items.length).toBe(1);
  });
});
