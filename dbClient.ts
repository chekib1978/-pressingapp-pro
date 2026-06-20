const API_BASE = import.meta.env.VITE_API_URL || '';

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
}

class QueryBuilder<T = any> {
  private table: string;
  private method: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectColumns: string = '*';
  private filters: Array<{ type: string; field: string; value: any }> = [];
  private sortField?: string;
  private sortAsc: boolean = true;
  private limitCount?: number;
  private singleResult: boolean = false;
  private insertData?: any;
  private updateData?: any;
  private upsertData?: any;
  private upsertConflict?: string;
  private returnSelect: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): QueryBuilder<T> {
    this.method = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(data: any): QueryBuilder<T> {
    this.method = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any): QueryBuilder<T> {
    this.method = 'update';
    this.updateData = data;
    return this;
  }

  delete(): QueryBuilder<T> {
    this.method = 'delete';
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }): QueryBuilder<T> {
    this.method = 'upsert';
    this.upsertData = data;
    this.upsertConflict = options?.onConflict;
    return this;
  }

  eq(field: string, value: any): QueryBuilder<T> {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }): QueryBuilder<T> {
    this.sortField = field;
    this.sortAsc = opts?.ascending !== false;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  single(): QueryBuilder<T> {
    this.singleResult = true;
    return this;
  }

  private buildUrl(): string {
    const params = new URLSearchParams();

    if (this.method === 'select') {
      if (this.sortField) {
        params.set('_sort', this.sortField);
        params.set('_order', this.sortAsc ? 'asc' : 'desc');
      }
      if (this.limitCount) {
        params.set('_limit', String(this.limitCount));
      }
    }

    if (this.method === 'select' || this.method === 'delete') {
      const idFilter = this.filters.find(f => f.field === 'id' && f.type === 'eq');
      if (idFilter) {
        const qs = params.toString();
        return `${API_BASE}/api/${this.table}/${idFilter.value}${qs ? '?' + qs : ''}`;
      }
    }

    const qs = params.toString();
    return `${API_BASE}/api/${this.table}${qs ? '?' + qs : ''}`;
  }

  private async executeRequest(url: string, options?: RequestInit): Promise<any> {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      if (res.status === 204) {
        return { data: null, error: null };
      }

      const body = await res.json();

      if (!res.ok) {
        return {
          data: null,
          error: {
            message: body.error || body.message || `HTTP ${res.status}`,
            code: body.code || String(res.status),
            details: body.details,
            hint: body.hint,
          },
        };
      }

      return { data: body, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          message: err.message || 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  async then<TResult = QueryResult<T>>(
    resolve?: (value: QueryResult<T>) => TResult | Promise<TResult>
  ): Promise<TResult | QueryResult<T>> {
    let result: QueryResult<T>;

    try {
      switch (this.method) {
        case 'select': {
          const url = this.buildUrl();
          const res = await this.executeRequest(url);

          if (res.error) {
            result = res;
            break;
          }

          let data = Array.isArray(res.data) ? res.data : [res.data];

          for (const filter of this.filters) {
            if (filter.field !== 'id' || filter.type !== 'eq') {
              if (filter.type === 'eq') {
                data = data.filter((item: any) => item[filter.field] === filter.value);
              }
            }
          }

          if (this.singleResult) {
            result = { data: data[0] || null, error: data.length === 0 ? { message: 'No rows found', code: 'PGRST116' } : null };
          } else {
            result = { data: data as unknown as T, error: null };
          }
          break;
        }

        case 'insert': {
          const url = `${API_BASE}/api/${this.table}`;
          const res = await this.executeRequest(url, {
            method: 'POST',
            body: JSON.stringify(this.insertData),
          });

          if (this.returnSelect) {
            result = { data: res.data as T, error: res.error };
          } else {
            result = { data: res.data as T, error: res.error };
          }
          break;
        }

        case 'update': {
          const idFilter = this.filters.find(f => f.field === 'id' && f.type === 'eq');
          if (!idFilter) {
            result = { data: null, error: { message: 'Update requires an id filter (.eq("id", id))', code: 'NO_ID' } };
            break;
          }
          const url = `${API_BASE}/api/${this.table}/${idFilter.value}`;
          const res = await this.executeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(this.updateData),
          });
          result = { data: res.data as T, error: res.error };
          break;
        }

        case 'delete': {
          const idFilter = this.filters.find(f => f.field === 'id' && f.type === 'eq');
          if (!idFilter) {
            result = { data: null, error: { message: 'Delete requires an id filter (.eq("id", id))', code: 'NO_ID' } };
            break;
          }
          const url = `${API_BASE}/api/${this.table}/${idFilter.value}`;
          const res = await this.executeRequest(url, { method: 'DELETE' });
          result = { data: null, error: res.error };
          break;
        }

        case 'upsert': {
          const url = `${API_BASE}/api/${this.table}`;
          const itemsRes = await this.executeRequest(url);
          if (itemsRes.error) {
            result = { data: null, error: itemsRes.error };
            break;
          }

          const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
          const existing = items.find((item: any) => item.id === this.upsertData.id);

          if (existing) {
            const putUrl = `${API_BASE}/api/${this.table}/${this.upsertData.id}`;
            const putRes = await this.executeRequest(putUrl, {
              method: 'PUT',
              body: JSON.stringify(this.upsertData),
            });
            result = { data: putRes.data, error: putRes.error };
          } else {
            const postRes = await this.executeRequest(url, {
              method: 'POST',
              body: JSON.stringify(this.upsertData),
            });
            result = { data: postRes.data, error: postRes.error };
          }
          break;
        }

        default:
          result = { data: null, error: { message: `Unknown method: ${this.method}`, code: 'UNKNOWN' } };
      }
    } catch (err: any) {
      result = { data: null, error: { message: err.message, code: 'UNKNOWN' } };
    }

    return resolve ? resolve(result) : result;
  }
}

export const db = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  },
};

export default db;
