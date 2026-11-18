import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createClient = vi.hoisted(() => vi.fn((url: string, key: string, opts?: unknown) => ({ url, key, opts })));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

beforeEach(() => {
  vi.resetModules();
  createClient.mockClear();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://proyecto.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'clave-publica');
  vi.stubEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', 'clave-servicio');
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('cliente de Supabase', () => {
  it('crea dos clientes: uno público y uno administrador', async () => {
    await import('./supabase');
    expect(createClient).toHaveBeenCalledTimes(2);
  });

  it('el cliente público usa la clave publicable', async () => {
    const { supabase } = await import('./supabase');
    expect(supabase).toMatchObject({ url: 'https://proyecto.supabase.co', key: 'clave-publica' });
  });

  it('el cliente admin usa la clave de servicio y no persiste sesión', async () => {
    const { supabaseAdmin } = await import('./supabase');
    expect(supabaseAdmin).toMatchObject({
      url: 'https://proyecto.supabase.co',
      key: 'clave-servicio',
      opts: { auth: { autoRefreshToken: false, persistSession: false } },
    });
  });
});
