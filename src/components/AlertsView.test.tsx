import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);
vi.mock('./AlertsHeatMap', () => ({
  default: ({ alertas }: { alertas: unknown[] }) => <div data-testid="mapa">mapa:{alertas.length}</div>,
}));

import { setupSupabase, supa } from '../test/supabaseMock';
import AlertsView, { nivelDe, tiempoRelativo, AlertDetailModal } from './AlertsView';

describe('nivelDe', () => {
  it.each([
    [{ nivel: 'Alto' }, 'alto'],
    [{ nivel: 'CRÍTICO' }, 'alto'],
    [{ nivel_riesgo: 'grave' }, 'alto'],
    [{ nivel: 'rojo' }, 'alto'],
    [{ nivel: 'Medio' }, 'medio'],
    [{ nivel: 'moderado' }, 'medio'],
    [{ nivel: 'amarillo' }, 'medio'],
    [{ nivel: 'bajo' }, 'bajo'],
    [{ nivel: 'verde' }, 'bajo'],
    [{}, 'bajo'],
  ])('%j → %s', (alerta, esperado) => {
    expect(nivelDe(alerta)).toBe(esperado);
  });
});

describe('tiempoRelativo', () => {
  const AHORA = new Date('2026-06-15T12:00:00Z');
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(AHORA); });
  afterEach(() => { vi.useRealTimers(); });
  const hace = (ms: number) => new Date(AHORA.getTime() - ms).toISOString();
  const MIN = 60_000, H = 60 * MIN, D = 24 * H;

  it('sin fecha', () => expect(tiempoRelativo()).toBe('Sin fecha'));
  it('menos de un minuto', () => expect(tiempoRelativo(hace(20_000))).toBe('Hace un momento'));
  it('minutos', () => expect(tiempoRelativo(hace(5 * MIN))).toBe('Hace 5 min'));
  it('horas', () => expect(tiempoRelativo(hace(3 * H))).toBe('Hace 3 h'));
  it('un día (singular)', () => expect(tiempoRelativo(hace(1 * D))).toBe('Hace 1 día'));
  it('días (plural)', () => expect(tiempoRelativo(hace(5 * D))).toBe('Hace 5 días'));
  it('más de 30 días usa fecha local', () => {
    const f = hace(45 * D);
    expect(tiempoRelativo(f)).toBe(new Date(f).toLocaleDateString('es-BO'));
  });
});

const ahora = Date.now();
const ISO = (min: number) => new Date(ahora - min * 60_000).toISOString();
const ALERTAS = [
  { id_alerta: 1, titulo: 'Sarampión en Cercado', resumen: 'Brote confirmado', nivel: 'alto', activa: true, municipio: 'Cercado', fecha_generacion: ISO(10) },
  { id_alerta: 2, titulo: 'Dengue en Trinidad', resumen: 'Casos en aumento', nivel: 'medio', activa: true, departamento: 'Beni', fecha_generacion: ISO(120) },
  { id_alerta: 3, titulo: 'Tos ferina antigua', resumen: 'Ya controlada', nivel: 'bajo', activa: false, fecha_generacion: ISO(60 * 24 * 10) },
];

const stat = (label: string) => screen.getByText(label).nextElementSibling!.textContent;

describe('AlertsView', () => {
  beforeEach(() => { setupSupabase({ alertas_epidemiologicas_ia: { data: ALERTAS } }); });

  it('consulta la tabla de alertas ordenada por fecha', async () => {
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    expect(supa.from).toHaveBeenCalledWith('alertas_epidemiologicas_ia');
    expect(supa.builders.alertas_epidemiologicas_ia.order).toHaveBeenCalledWith('fecha_generacion', { ascending: false });
  });

  it('calcula los contadores de alertas activas por nivel', async () => {
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    expect(stat('Activas')).toBe('2');
    expect(stat('Riesgo alto')).toBe('1');
    expect(stat('Riesgo medio')).toBe('1');
    expect(stat('Riesgo bajo')).toBe('0');
  });

  it('pasa solo las activas al mapa', async () => {
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    expect(screen.getByTestId('mapa')).toHaveTextContent('mapa:2');
  });

  it('por defecto lista solo las activas', async () => {
    render(<AlertsView />);
    expect(await screen.findByText('Sarampión en Cercado')).toBeInTheDocument();
    expect(screen.getByText('Dengue en Trinidad')).toBeInTheDocument();
    expect(screen.queryByText('Tos ferina antigua')).not.toBeInTheDocument();
  });

  it('el historial muestra las no activas', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    await user.click(screen.getByRole('button', { name: 'historial' }));
    expect(screen.getByText('Tos ferina antigua')).toBeInTheDocument();
    expect(screen.queryByText('Sarampión en Cercado')).not.toBeInTheDocument();
  });

  it('filtra por nivel', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    await user.click(screen.getByRole('button', { name: 'alto' }));
    expect(screen.getByText('Sarampión en Cercado')).toBeInTheDocument();
    expect(screen.queryByText('Dengue en Trinidad')).not.toBeInTheDocument();
  });

  it('busca por título, resumen o zona', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    const caja = screen.getByPlaceholderText('Buscar alerta o zona');

    await user.type(caja, 'beni');
    expect(screen.getByText('Dengue en Trinidad')).toBeInTheDocument();
    expect(screen.queryByText('Sarampión en Cercado')).not.toBeInTheDocument();

    await user.clear(caja);
    await user.type(caja, 'confirmado');
    expect(screen.getByText('Sarampión en Cercado')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando nada coincide', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    await user.type(screen.getByPlaceholderText('Buscar alerta o zona'), 'zzzz');
    expect(screen.getByText('No hay alertas epidemiológicas activas en este momento.')).toBeInTheDocument();
  });

  it('muestra el error si la consulta falla', async () => {
    setupSupabase({ alertas_epidemiologicas_ia: { error: { message: 'permiso denegado' } } });
    render(<AlertsView />);
    expect(await screen.findByText(/No se pudieron cargar las alertas: permiso denegado/)).toBeInTheDocument();
  });

  it('abre el detalle al hacer clic y lo cierra', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await user.click(await screen.findByText('Sarampión en Cercado'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('RIESGO ALTO')).toBeInTheDocument();
    expect(within(dialog).getByText('Brote confirmado')).toBeInTheDocument();

    await user.click(within(dialog).getAllByRole('button', { name: 'Cerrar' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el botón Actualizar vuelve a consultar', async () => {
    const user = userEvent.setup();
    render(<AlertsView />);
    await screen.findByText('Sarampión en Cercado');
    const antes = supa.from.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Actualizar/ }));
    expect(supa.from.mock.calls.length).toBe(antes + 1);
  });
});

describe('AlertDetailModal', () => {
  const alerta = { id_alerta: 9, titulo: 'T', resumen: '', nivel: 'medio', fuente: 'MinSalud', casos: 12, objeto: { a: 1 }, vacio: '', nulo: null };

  it('usa textos por defecto cuando faltan título/resumen', () => {
    render(<AlertDetailModal alerta={{}} onClose={vi.fn()} />);
    expect(screen.getByText('Alerta epidemiológica')).toBeInTheDocument();
    expect(screen.getByText('Sin descripción disponible.')).toBeInTheDocument();
  });

  it('lista solo los campos extra simples (sin ids, objetos ni vacíos)', () => {
    render(<AlertDetailModal alerta={alerta} onClose={vi.fn()} />);
    expect(screen.getByText('fuente')).toBeInTheDocument();
    expect(screen.getByText('MinSalud')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    ['id alerta', 'objeto', 'vacio', 'nulo'].forEach((k) => expect(screen.queryByText(k)).not.toBeInTheDocument());
  });

  it('cierra con Escape', async () => {
    const onClose = vi.fn();
    render(<AlertDetailModal alerta={alerta} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('solo muestra "Ver todas" si se pasa onVerTodas', async () => {
    const onVerTodas = vi.fn();
    const { rerender } = render(<AlertDetailModal alerta={alerta} onClose={vi.fn()} />);
    expect(screen.queryByText('Ver todas las alertas')).not.toBeInTheDocument();

    rerender(<AlertDetailModal alerta={alerta} onClose={vi.fn()} onVerTodas={onVerTodas} />);
    await userEvent.click(screen.getByText('Ver todas las alertas'));
    expect(onVerTodas).toHaveBeenCalled();
  });
});
