import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCollection, insertItem, generateId } from '../_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const items = await getCollection('users');
      const sort = req.query._sort as string;
      const order = req.query._order as string;

      if (sort) {
        items.sort((a: any, b: any) => {
          if (order === 'desc') return b[sort] > a[sort] ? 1 : -1;
          return a[sort] > b[sort] ? 1 : -1;
        });
      }

      const safeItems = items.map(({ password, ...rest }: any) => rest);
      return res.status(200).json(safeItems);
    }

    if (req.method === 'POST') {
      const existingUsers = await getCollection<any>('users');
      if (existingUsers.find((u: any) => u.email === req.body.email)) {
        return res.status(409).json({ error: `L'email "${req.body.email}" est déjà utilisé.` });
      }

      const newItem = {
        id: generateId(),
        created_at: new Date().toISOString(),
        ...req.body,
      };
      await insertItem('users', newItem);
      const { password: _, ...safe } = newItem;
      return res.status(201).json(safe);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
