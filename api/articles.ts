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

async function insertItem<T extends { id: string }>(table: string, item: T): Promise<T> {
  const items = await getCollection<T>(table);
  items.unshift(item);
  await redis.set(table, JSON.stringify(items));
  return item;
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

function generateId(): string {
  return crypto.randomUUID();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const items = await getCollection('articles');
      const sort = req.query._sort as string;
      const order = req.query._order as string;
      const limit = req.query._limit ? parseInt(req.query._limit as string) : undefined;

      if (sort) {
        items.sort((a: any, b: any) => {
          if (order === 'desc') return b[sort] > a[sort] ? 1 : -1;
          return a[sort] > b[sort] ? 1 : -1;
        });
      }

      return res.status(200).json(limit ? items.slice(0, limit) : items);
    }

    if (req.method === 'POST') {
      const newItem = {
        id: generateId(),
        created_at: new Date().toISOString(),
        ...req.body,
      };
      const created = await insertItem('articles', newItem);
      return res.status(201).json(created);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
