import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const defaultUsers = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@pressing.com',
    role: 'admin',
    password: 'admin123',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Operateur',
    email: 'op@pressing.com',
    role: 'operator',
    password: 'op123',
    created_at: new Date().toISOString(),
  },
];

const defaultArticles = [
  { id: '1', name: 'Pantalon - Jean', price: 15, category: 'Pantalon', created_at: new Date().toISOString() },
  { id: '2', name: 'Chemise - Manches longues', price: 12, category: 'Chemise', created_at: new Date().toISOString() },
  { id: '3', name: 'T-Shirt - Manches courtes', price: 8, category: 'TShirt', created_at: new Date().toISOString() },
  { id: '4', name: 'Costume - 2 pieces', price: 35, category: 'Costume', created_at: new Date().toISOString() },
  { id: '5', name: 'Robe - Simple', price: 18, category: 'Robe', created_at: new Date().toISOString() },
];

const defaultClients = [
  { id: '1', name: 'Client Test', phone: '00 00 00 00 00', email: 'client@test.com', created_at: new Date().toISOString() },
];

const defaultSettings = [
  {
    id: 'singleton_settings_id',
    name: 'Mon Pressing Super Pro',
    address_line_1: '1 Rue du Progres',
    address_line_2: '00000 MaVille',
    phone: '00 00 00 00 00',
    email: 'contact@monpressing.pro',
    receipt_footer_message: 'Merci et a bientot !',
    updated_at: new Date().toISOString(),
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await redis.set('users', defaultUsers);
    await redis.set('articles', defaultArticles);
    await redis.set('clients', defaultClients);
    await redis.set('orders', []);
    await redis.set('operation_logs', []);
    await redis.set('company_application_settings', defaultSettings);

    return res.status(200).json({
      message: 'Seed completed!',
      users: [
        { email: 'admin@pressing.com', password: 'admin123', role: 'admin' },
        { email: 'op@pressing.com', password: 'op123', role: 'operator' },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
