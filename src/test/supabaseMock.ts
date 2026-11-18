import { vi } from 'vitest';

type Result = { data?: any; error?: any; count?: number | null };
/** Contexto que recibe un resultado dinámico: qué métodos se encadenaron en la consulta. */
export interface Ctx { calls: string[]; has: (m: string) => boolean }
type ResultFn = (ctx: Ctx) => Result;

/**
 * Query builder falso: cualquier método encadenable devuelve el mismo objeto,
 * y al hacer `await` (o `.then`) resuelve con el resultado configurado.
 * `.single()` / `.maybeSingle()` devuelven la primera fila si data es array.
 */
export function makeBuilder(result: Result | ResultFn, spies: Record<string, any> = {}) {
  const calls: string[] = [];
  const ctx: Ctx = { calls, has: (m) => calls.includes(m) };
  const resolve = () => {
    const r = typeof result === 'function' ? result(ctx) : result;
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  };
  const builder: any = {};
  const chain = [
    'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt',
    'lte', 'like', 'ilike', 'or', 'and', 'not', 'order', 'limit', 'range', 'match', 'filter',
    'contains', 'textSearch',
  ];
  const spy = (m: string) => (spies[m] ??= vi.fn());
  chain.forEach((m) => { spy(m); builder[m] = (...args: any[]) => { calls.push(m); spies[m](...args); return builder; }; });
  const single = (...args: any[]) => {
    calls.push('single');
    spy('single')(...args);
    const r = resolve();
    return Promise.resolve({ ...r, data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data });
  };
  builder.single = single;
  builder.maybeSingle = single;
  builder.then = (ok: any, ko: any) => Promise.resolve(resolve()).then(ok, ko);
  return builder;
}

/** Crea un "cliente" Supabase falso. `tables` mapea nombre de tabla -> resultado. */
export function makeSupabase(tables: Record<string, Result | ResultFn> = {}, session: any = {
  user: { id: 'user-1', email: 'test@biosafe.bo' },
}) {
  // Espías compartidos por tabla: sobreviven a las re-consultas (p. ej. recargas tras un insert).
  const builders: Record<string, any> = {};
  const client: any = {
    from: vi.fn((t: string) => {
      builders[t] ??= {};
      return makeBuilder(tables[t] ?? { data: [] }, builders[t]);
    }),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session } })),
      signInWithPassword: vi.fn(async () => ({ data: { user: session?.user }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      admin: {
        createUser: vi.fn(async () => ({ data: { user: { id: 'new-user' } }, error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
    functions: { invoke: vi.fn(async () => ({ data: {}, error: null })) },
    channel: vi.fn(() => {
      const ch: any = {};
      ch.on = vi.fn(() => ch);
      ch.subscribe = vi.fn(() => ch);
      return ch;
    }),
    removeChannel: vi.fn(),
    builders,
  };
  return client;
}

/**
 * Objeto compartido que usan los tests como `supabase` / `supabaseAdmin`.
 * En cada test:  vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);
 * y en beforeEach:  setupSupabase({ usuarios: { data: [...] } });
 */
export const supa: any = {};
export const moduleMock = { supabase: supa, supabaseAdmin: supa };
export function setupSupabase(tables: Record<string, Result | ResultFn> = {}, session?: any) {
  const fresh = session === undefined ? makeSupabase(tables) : makeSupabase(tables, session);
  Object.assign(supa, fresh);
  return supa;
}
