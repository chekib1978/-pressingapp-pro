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

const defaultOrders: any[] = [];
const defaultLogs: any[] = [];

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

async function seed() {
  console.log('Seeding Upstash Redis...');

  await redis.set('users', defaultUsers);
  console.log('  users: OK');

  await redis.set('articles', defaultArticles);
  console.log('  articles: OK');

  await redis.set('clients', defaultClients);
  console.log('  clients: OK');

  await redis.set('orders', defaultOrders);
  console.log('  orders: OK');

  await redis.set('operation_logs', defaultLogs);
  console.log('  operation_logs: OK');

  await redis.set('company_application_settings', defaultSettings);
  console.log('  company_application_settings: OK');

  console.log('Seed complete!');
}

seed().catch(console.error);
