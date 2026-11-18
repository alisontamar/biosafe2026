import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);
vi.mock('./HomeView', () => ({
  HomeView: ({ onNavigate }: { onNavigate?: (t: string) => void }) => (
    <div>VISTA-INICIO<button onClick={() => onNavigate?.('pacientes')}>ir-pacientes</button></div>
  ),
}));
vi.mock('./PatientsView', () => ({ default: () => <div>VISTA-PACIENTES</div> }));
vi.mock('./VaccinationView', () => ({ default: () => <div>VISTA-VACUNACION</div> }));
vi.mock('./AlertsView', () => ({ default: () => <div>VISTA-ALERTAS</div> }));
vi.mock('./AlertBell', () => ({
  default: ({ onVerTodas }: { onVerTodas: () => void }) => <button onClick={onVerTodas}>CAMPANA</button>,
}));
vi.mock('./ReportsView', () => ({ ReportsView: () => <div>VISTA-REPORTES</div> }));
vi.mock('./SettingsView', () => ({ default: () => <div>VISTA-CONFIG</div> }));
vi.mock('./IndicatorsView', () => ({ IndicatorsView: () => <div>VISTA-INDICADORES</div> }));

import { setupSupabase, supa } from '../test/supabaseMock';
import AdminDashboard from './AdminDashboard';

const perfil = (rol: string, extra: Record<string, unknown> = {}) => ({
  data: { nombre_completo: 'María Pérez', rol, establecimientos: { nombre_establecimiento: 'Hospital Viedma' }, ...extra },
});

const itemsMenu = () => within(screen.getByRole('navigation')).queryAllByRole('button').map((b) => b.textContent);

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); window.location.hash = ''; });

describe('AdminDashboard', () => {
  it('redirige al inicio público si no hay sesión', async () => {
    window.location.hash = '#admin';
    setupSupabase({}, null);
    render(<AdminDashboard />);
    await waitFor(() => expect(window.location.hash).toBe(''));
  });

  it('muestra un spinner mientras carga y luego el perfil', async () => {
    setupSupabase({ usuarios: perfil('SuperAdmin') });
    render(<AdminDashboard />);
    expect(screen.queryByText('BioSafe')).not.toBeInTheDocument();

    expect(await screen.findByText('María Pérez')).toBeInTheDocument();
    expect(screen.getByText('SuperAdmin')).toBeInTheDocument();
    expect(screen.getByText('Hospital Viedma')).toBeInTheDocument();
    expect(screen.getByText('MP')).toBeInTheDocument(); // iniciales
    expect(supa.builders.usuarios.eq).toHaveBeenCalledWith('id_usuario', 'user-1');
  });

  it('acepta establecimientos como arreglo', async () => {
    setupSupabase({ usuarios: perfil('Medico', { establecimientos: [{ nombre_establecimiento: 'Centro Norte' }] }) });
    render(<AdminDashboard />);
    expect(await screen.findByText('Centro Norte')).toBeInTheDocument();
  });

  it('usa "Sistema Central" si el usuario no tiene establecimiento', async () => {
    setupSupabase({ usuarios: perfil('SuperAdmin', { establecimientos: null }) });
    render(<AdminDashboard />);
    expect(await screen.findByText('Sistema Central')).toBeInTheDocument();
  });

  it('sigue funcionando (sin perfil) si la consulta falla', async () => {
    setupSupabase({ usuarios: { error: new Error('boom') } });
    render(<AdminDashboard />);
    expect(await screen.findByText('VISTA-INICIO')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
    expect(itemsMenu()).toEqual([]);
  });

  describe('menú según el rol', () => {
    it.each([
      ['SuperAdmin', ['Inicio', 'Pacientes', 'Vacunación', 'Alertas', 'Reportes', 'Indicadores', 'Configuración']],
      ['AdminEstablecimiento', ['Inicio', 'Pacientes', 'Vacunación', 'Alertas', 'Reportes', 'Indicadores', 'Configuración']],
      ['Medico', ['Inicio', 'Pacientes', 'Vacunación', 'Alertas']],
      ['Enfermero', ['Inicio', 'Pacientes', 'Vacunación', 'Alertas']],
      ['Farmaceutico', ['Inicio', 'Vacunación']],
      ['Tutor_PersonaNormal', ['Inicio']],
    ])('%s', async (rol, esperado) => {
      setupSupabase({ usuarios: perfil(rol) });
      render(<AdminDashboard />);
      await screen.findByText('María Pérez');
      expect(itemsMenu()).toEqual(esperado);
    });
  });

  it('navega entre vistas con el menú lateral', async () => {
    const user = userEvent.setup();
    setupSupabase({ usuarios: perfil('SuperAdmin') });
    render(<AdminDashboard />);
    await screen.findByText('VISTA-INICIO');

    const nav = within(screen.getByRole('navigation'));
    const casos: [string, string][] = [
      ['Pacientes', 'VISTA-PACIENTES'], ['Vacunación', 'VISTA-VACUNACION'], ['Alertas', 'VISTA-ALERTAS'],
      ['Reportes', 'VISTA-REPORTES'], ['Indicadores', 'VISTA-INDICADORES'], ['Configuración', 'VISTA-CONFIG'],
      ['Inicio', 'VISTA-INICIO'],
    ];
    for (const [boton, vista] of casos) {
      await user.click(nav.getByRole('button', { name: boton }));
      expect(screen.getByText(vista)).toBeInTheDocument();
    }
  });

  it('HomeView puede navegar a otra pestaña vía onNavigate', async () => {
    const user = userEvent.setup();
    setupSupabase({ usuarios: perfil('SuperAdmin') });
    render(<AdminDashboard />);
    await user.click(await screen.findByText('ir-pacientes'));
    expect(screen.getByText('VISTA-PACIENTES')).toBeInTheDocument();
  });

  it('la campana de alertas lleva a la vista de alertas', async () => {
    const user = userEvent.setup();
    setupSupabase({ usuarios: perfil('Medico') });
    render(<AdminDashboard />);
    await user.click(await screen.findByText('CAMPANA'));
    expect(screen.getByText('VISTA-ALERTAS')).toBeInTheDocument();
  });

  it('no muestra la campana a roles sin acceso a alertas', async () => {
    setupSupabase({ usuarios: perfil('Farmaceutico') });
    render(<AdminDashboard />);
    await screen.findByText('María Pérez');
    expect(screen.queryByText('CAMPANA')).not.toBeInTheDocument();
  });

  it('abre y cierra el drawer móvil', async () => {
    const user = userEvent.setup();
    setupSupabase({ usuarios: perfil('SuperAdmin') });
    const { container } = render(<AdminDashboard />);
    await screen.findByText('María Pérez');
    const aside = container.querySelector('aside')!;
    expect(aside).toHaveClass('-translate-x-full');

    await user.click(screen.getByLabelText('Abrir menú'));
    expect(aside).toHaveClass('translate-x-0');

    await user.click(screen.getByLabelText('Cerrar menú'));
    expect(aside).toHaveClass('-translate-x-full');
  });

  it('cerrar sesión llama a signOut, limpia el hash y recarga', async () => {
    const user = userEvent.setup();
    setupSupabase({ usuarios: perfil('SuperAdmin') });
    render(<AdminDashboard />);
    await screen.findByText('María Pérez');

    const original = window.location;
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { hash: '#admin', reload } });
    try {
      await user.click(screen.getByRole('button', { name: /Cerrar Sesión/ }));
      await waitFor(() => expect(reload).toHaveBeenCalled());
      expect(supa.auth.signOut).toHaveBeenCalled();
      expect(window.location.hash).toBe('');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});
