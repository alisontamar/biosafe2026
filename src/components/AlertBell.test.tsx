import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);
vi.mock('./AlertsHeatMap', () => ({ default: () => null }));

import { setupSupabase, supa } from '../test/supabaseMock';
import AlertBell from './AlertBell';

const KEY = 'biosafe_alertas_vistas';
const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const A = { id_alerta: 1, titulo: 'Sarampión', resumen: 'Brote en Cercado', nivel: 'alto', activa: true, fecha_generacion: hace(5) };
const B = { id_alerta: 2, titulo: 'Dengue', resumen: 'Casos en Beni', nivel: 'medio', activa: true, fecha_generacion: hace(30) };

let datos: any[];

beforeEach(() => {
  localStorage.clear();
  datos = [A, B];
  setupSupabase({ alertas_epidemiologicas_ia: () => ({ data: datos }) });
});

describe('AlertBell', () => {
  it('muestra el contador de alertas nuevas en el aria-label', async () => {
    render(<AlertBell onVerTodas={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Notificaciones, 2 nuevas' })).toBeInTheDocument();
  });

  it('muestra "9+" cuando hay más de 9 nuevas', async () => {
    datos = Array.from({ length: 12 }, (_, i) => ({ ...A, id_alerta: i + 1, titulo: `A${i}` }));
    render(<AlertBell onVerTodas={vi.fn()} />);
    expect(await screen.findByText('9+')).toBeInTheDocument();
  });

  it('no cuenta como nuevas las alertas anteriores a la última vista', async () => {
    localStorage.setItem(KEY, String(Date.now() + 1000));
    render(<AlertBell onVerTodas={vi.fn()} />);
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
  });

  it('el panel empieza cerrado y se abre con el botón', async () => {
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={vi.fn()} />);
    await screen.findByRole('button', { name: /2 nuevas/ });
    expect(screen.queryByText('Ver todas las alertas')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Notificaciones/ }));
    expect(screen.getByText('Sarampión')).toBeInTheDocument();
    expect(screen.getByText('Dengue')).toBeInTheDocument();
    expect(screen.getAllByText('NUEVA')).toHaveLength(2);
  });

  it('muestra mensaje cuando no hay alertas', async () => {
    datos = [];
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={vi.fn()} />);
    await act(async () => {});
    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByText('No hay alertas activas.')).toBeInTheDocument();
  });

  it('"Marcar como leídas" limpia el contador y guarda en localStorage', async () => {
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: /2 nuevas/ }));
    await user.click(screen.getByText('Marcar como leídas'));

    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
    expect(Number(localStorage.getItem(KEY))).toBeGreaterThan(0);
  });

  it('"Ver todas las alertas" cierra el panel y llama a onVerTodas', async () => {
    const onVerTodas = vi.fn();
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={onVerTodas} />);
    await user.click(await screen.findByRole('button', { name: /2 nuevas/ }));
    await user.click(screen.getByText('Ver todas las alertas'));

    expect(onVerTodas).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Ver todas las alertas')).not.toBeInTheDocument();
  });

  it('al elegir una alerta abre su detalle', async () => {
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: /2 nuevas/ }));
    await user.click(screen.getByText('Sarampión'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Brote en Cercado')).toBeInTheDocument();
  });

  it('se cierra al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(<AlertBell onVerTodas={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: /2 nuevas/ }));
    expect(screen.getByText('Ver todas las alertas')).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByText('Ver todas las alertas')).not.toBeInTheDocument();
  });

  it('muestra un toast cuando llega una alerta nueva por Realtime', async () => {
    render(<AlertBell onVerTodas={vi.fn()} />);
    await screen.findByRole('button', { name: /2 nuevas/ });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const C = { id_alerta: 3, titulo: 'Rubéola', resumen: 'Caso nuevo', nivel: 'bajo', activa: true, fecha_generacion: hace(0) };
    datos = [C, A, B];
    const canal = supa.channel.mock.results[0].value;
    const onInsert = canal.on.mock.calls[0][2];
    await act(async () => { await onInsert(); });

    const toast = screen.getByRole('status');
    expect(within(toast).getByText('Rubéola')).toBeInTheDocument();
    await userEvent.click(within(toast).getByLabelText('Cerrar'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('se suscribe al canal y lo elimina al desmontar', async () => {
    const { unmount } = render(<AlertBell onVerTodas={vi.fn()} />);
    await act(async () => {});
    expect(supa.channel).toHaveBeenCalledWith('alertas-nuevas');
    unmount();
    expect(supa.removeChannel).toHaveBeenCalled();
  });
});
