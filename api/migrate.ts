import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUPABASE_URL = 'https://ozlomllrfwigrqmfgitr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bG9tbGxyZndpZ3JxbWZnaXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTc4MjIsImV4cCI6MjA2NTY3MzgyMn0.bwKqFIQY2ZGTgzgrrSCm2R-j66hlMot6a-vQrdyqgu8';

async function fetchSupabase(table: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tables = ['users', 'articles', 'clients', 'orders', 'operation_logs', 'company_application_settings'];
    const results: Record<string, number> = {};

    for (const table of tables) {
      const data = await fetchSupabase(table);
      await redis.set(table, data);
      results[table] = data.length;
    }

    return res.status(200).json({
      message: 'Migration Supabase → Redis terminée !',
      details: results,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
