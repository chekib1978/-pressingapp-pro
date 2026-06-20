import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCollection, updateItem, deleteItem } from '../_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });

  try {
    if (req.method === 'GET') {
      const items = await getCollection('users');
      const item = items.find((i: any) => i.id === id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      const { password: _, ...safe } = item as any;
      return res.status(200).json(safe);
    }

    if (req.method === 'PUT') {
      if (req.body.password === '') delete req.body.password;
      const updated = await updateItem('users', id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      const { password: _, ...safe } = updated as any;
      return res.status(200).json(safe);
    }

    if (req.method === 'DELETE') {
      const deleted = await deleteItem('users', id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
