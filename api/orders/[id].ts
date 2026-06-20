import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function getCollection<T = any>(table: string): Promise<T[]> {
  let data = await redis.get<T[]>(table);
  if (typeof data === 'string') {
    try { data = JSON.parse(data as string); } catch { data = []; }
  }
  return Array.isArray(data) ? data : [];
}

async function updateItem<T extends { id: string }>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
  const items = await getCollection<T>(table);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await redis.set(table, JSON.stringify(items));
  return items[index];
}

async function deleteItem<T extends { id: string }>(table: string, id: string): Promise<boolean> {
  const items = await getCollection<T>(table);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  await redis.set(table, JSON.stringify(filtered));
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });

  try {
    if (req.method === 'GET') {
      const items = await getCollection('orders');
      const item = items.find((i: any) => i.id === id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'PUT') {
      const updated = await updateItem('orders', id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await deleteItem('orders', id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
