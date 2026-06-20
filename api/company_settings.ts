import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function getCollection<T = any>(table: string): Promise<T[]> {
  const data = await redis.get<T[]>(table);
  return data || [];
}

const SETTINGS_KEY = 'singleton_settings_id';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const items = await getCollection('company_application_settings');
      const settings = items.find((i: any) => i.id === SETTINGS_KEY);
      if (!settings) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(settings);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const items = await getCollection<any>('company_application_settings');
      const existingIndex = items.findIndex((i: any) => i.id === SETTINGS_KEY);

      const payload = {
        id: SETTINGS_KEY,
        updated_at: new Date().toISOString(),
        ...req.body,
      };

      if (existingIndex >= 0) {
        items[existingIndex] = { ...items[existingIndex], ...payload };
      } else {
        items.push(payload);
      }

      await redis.set('company_application_settings', items);

      return res.status(200).json(payload);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
