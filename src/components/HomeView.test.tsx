import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import { HomeView } from './HomeView';

const ALERTA = {
  id_alerta: 1, titulo: 'Brote de sarampión', resumen: 'Casos confirmados en Cercado',
  nivel: 'alto', activa: true, fecha_generacion: new Date().toISOString(),
};
const DOSIS = {
  fecha_vencimiento_proxima: '2026-12-05T12:00:00',
  pacientes: { nombre_completo: 'Ana Rojas' },
  cat_vacunas_oficiales: { nombre_enfermedad: 'BCG', dosis_numero: '1ra dosis' },
};

const tablas = (over: Record<string, any> = {}) => ({
  usuarios: { data: [{ id_usuario: 'tutor-1', id_establecimiento: 'est-1' }], count: 7 },
  pacientes: { count: 12 },
  alertas_epidemiologicas_ia: { data: [ALERTA], count: 2 },
  dosis_aplicadas: { data: [DOSIS] },
  ...over,
});

const stat = (titulo: string) => screen.getByText(titulo).nextElementSibling!.textContent;

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

describe('HomeView', () => {
  it('muestra los contadores del dashboard', async () => {
    setupSupabase(tablas());
    render(<HomeView />);
    await screen.findByText('Resumen general');

    expect(stat('Padres de familia registrados')).toBe('7');
    expect(stat('Niños(as) 0-5 años')).toBe('12');
    expect(stat('Alertas Activas')).toBe('2');
  });

  it('filtra los niños por los tutores del establecimiento', async () => {
    setupSupabase(tablas());
    render(<HomeView />);
    await screen.findByText('Resumen general');
    expect(supa.builders.pacientes.in).toHaveBeenCalledWith('id_tutor_registro', ['tutor-1']);
  });

  it('sin establecimiento cuenta todos los niños (sin filtro de tutores)', async () => {
    setupSupabase(tablas({ usuarios: { data: [{}], count: 7 } }));
    render(<HomeView />);
    await screen.findByText('Resumen general');
    expect(supa.builders.pacientes.in).not.toHaveBeenCalled();
    expect(stat('Niños(as) 0-5 años')).toBe('12');
  });

  it('sin sesión muestra el tablero en ceros', async () => {
    setupSupabase(tablas(), null);
    render(<HomeView />);
    await screen.findByText('Resumen general');
    expect(stat('Padres de familia registrados')).toBe('0');
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('lista las próximas dosis pendientes con fecha dd/mm', async () => {
    setupSupabase(tablas());
    render(<HomeView />);
    expect(await screen.findByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText('BCG — 1ra dosis')).toBeInTheDocument();
    expect(screen.getByText('05/12')).toBeInTheDocument();
  });

  it('muestra "Desconocido" si la dosis no trae paciente', async () => {
    setupSupabase(tablas({ dosis_aplicadas: { data: [{ ...DOSIS, pacientes: null }] } }));
    render(<HomeView />);
    expect(await screen.findByText('Desconocido')).toBeInTheDocument();
  });

  it('muestra mensaje si no hay dosis pendientes', async () => {
    setupSupabase(tablas({ dosis_aplicadas: { data: [] } }));
    render(<HomeView />);
    expect(await screen.findByText('No hay dosis pendientes en este centro.')).toBeInTheDocument();
  });

  it('muestra la alerta IA más reciente', async () => {
    setupSupabase(tablas());
    render(<HomeView />);
    expect(await screen.findByText(/Brote de sarampión/)).toBeInTheDocument();
    expect(screen.getByText('Casos confirmados en Cercado')).toBeInTheDocument();
    expect(screen.getByText('alto')).toBeInTheDocument();
  });

  it('sin alertas muestra el mensaje vacío y oculta el botón de detalle', async () => {
    setupSupabase(tablas({ alertas_epidemiologicas_ia: { data: [], count: 0 } }));
    render(<HomeView />);
    expect(await screen.findByText(/No hay alertas epidemiológicas activas/)).toBeInTheDocument();
    expect(screen.queryByText('Ver detalle de riesgo')).not.toBeInTheDocument();
  });

  it('abre el detalle de riesgo y "Ver todas" navega a alertas', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<HomeView onNavigate={onNavigate} />);
    await user.click(await screen.findByText('Ver detalle de riesgo'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Ver todas las alertas'));
    expect(onNavigate).toHaveBeenCalledWith('alertas');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Ir a Vacunación" navega a la pestaña de vacunación', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<HomeView onNavigate={onNavigate} />);
    await user.click(await screen.findByText('Ir a Vacunación'));
    expect(onNavigate).toHaveBeenCalledWith('vacunacion');
  });

  it('no se rompe si no se pasa onNavigate', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<HomeView />);
    await user.click(await screen.findByText('Ir a Vacunación'));
    expect(screen.getByText('Resumen general')).toBeInTheDocument();
  });

  it('si hay un error igual deja de cargar y registra el error', async () => {
    setupSupabase(tablas());
    supa.auth.getSession.mockRejectedValueOnce(new Error('sin red'));
    render(<HomeView />);
    expect(await screen.findByText('Resumen general')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
