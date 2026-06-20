import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

const COLLECTIONS = ['users', 'articles', 'clients', 'orders', 'operation_logs'] as const;

export async function getCollection<T>(table: string): Promise<T[]> {
  const data = await redis.get<T[]>(table);
  return data || [];
}

export async function setCollection<T>(table: string, data: T[]): Promise<void> {
  await redis.set(table, data);
}

export async function findById<T extends { id: string }>(table: string, id: string): Promise<T | null> {
  const items = await getCollection<T>(table);
  return items.find(item => item.id === id) || null;
}

export async function insertItem<T extends { id: string }>(table: string, item: T): Promise<T> {
  const items = await getCollection<T>(table);
  items.unshift(item);
  await setCollection(table, items);
  return item;
}

export async function updateItem<T extends { id: string }>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
  const items = await getCollection<T>(table);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await setCollection(table, items);
  return items[index];
}

export async function deleteItem<T extends { id: string }>(table: string, id: string): Promise<boolean> {
  const items = await getCollection<T>(table);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  await setCollection(table, filtered);
  return true;
}

export function generateId(): string {
  return crypto.randomUUID();
}
