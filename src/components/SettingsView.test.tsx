import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import SettingsView from './SettingsView';

const SUPER = { id_usuario: 'u-1', nombre_completo: 'Sara Super', correo_electronico: 'sara@biosafe.bo', rol: 'SuperAdmin' };
const ADMIN = { id_usuario: 'u-1', nombre_completo: 'Ana Admin', correo_electronico: 'ana@biosafe.bo', rol: 'AdminEstablecimiento', id_establecimiento: 'est-1' };
const MEDICO = { id_usuario: 'u-1', nombre_completo: 'Mario Medico', correo_electronico: 'mario@biosafe.bo', rol: 'Medico', id_establecimiento: 'est-1' };

const EST = [
  { id_establecimiento: 'e1', nombre_establecimiento: 'Hospital Viedma', ciudad_municipio: 'Cochabamba', tipo: 'Centro de Salud' },
  { id_establecimiento: 'e2', nombre_establecimiento: 'Farmacia Central', ciudad_municipio: 'Sacaba', tipo: 'Farmacia' },
];
const STAFF = [
  { id_usuario: 'u-2', nombre_completo: 'Luis Enfermero', correo_electronico: 'luis@biosafe.bo', rol: 'Enfermero' },
];

const comoSuper = (est: any[] = EST) => ({
  usuarios: { data: SUPER },
  establecimientos: (ctx: any) => (ctx.has('insert') ? { data: [{ id_establecimiento: 'e-new' }] } : { data: est }),
});
const comoAdmin = (personal: any[] = STAFF) => ({
  usuarios: (ctx: any) => {
    if (ctx.has('single')) return { data: ADMIN };
    if (ctx.has('insert') || ctx.has('delete')) return {};
    return { data: personal };
  },
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

describe('SettingsView – común', () => {
  it('muestra el perfil del usuario (campos deshabilitados)', async () => {
    setupSupabase({ usuarios: { data: MEDICO } });
    render(<SettingsView />);
    const nombre = await screen.findByDisplayValue('Mario Medico');
    expect(nombre).toBeDisabled();
    expect(screen.getByDisplayValue('mario@biosafe.bo')).toBeDisabled();
  });

  it('muestra notificaciones y seguridad', async () => {
    setupSupabase({ usuarios: { data: MEDICO } });
    render(<SettingsView />);
    expect(await screen.findByText('Notificaciones IA')).toBeInTheDocument();
    expect(screen.getByText('Alertas de Brotes')).toBeInTheDocument();
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
  });

  it('un rol sin permisos de administración no ve gestión de red ni personal', async () => {
    setupSupabase({ usuarios: { data: MEDICO } });
    render(<SettingsView />);
    await screen.findByText('Mi Perfil');
    expect(screen.queryByText(/Red BioSafe/)).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión de Personal')).not.toBeInTheDocument();
  });

  it('sin sesión muestra la pantalla sin datos de perfil', async () => {
    setupSupabase({}, null);
    render(<SettingsView />);
    await screen.findByText('Mi Perfil');
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('registra el error si la carga falla', async () => {
    setupSupabase({});
    supa.auth.getSession.mockRejectedValueOnce(new Error('sin red'));
    render(<SettingsView />);
    await screen.findByText('Mi Perfil');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('SettingsView – SuperAdmin (establecimientos)', () => {
  it('lista los establecimientos', async () => {
    setupSupabase(comoSuper());
    render(<SettingsView />);
    expect(await screen.findByText('Red BioSafe (Establecimientos)')).toBeInTheDocument();
    expect(screen.getByText('Hospital Viedma')).toBeInTheDocument();
    expect(screen.getByText('Sacaba')).toBeInTheDocument();
    expect(screen.getByText('Farmacia')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay establecimientos', async () => {
    setupSupabase(comoSuper([]));
    render(<SettingsView />);
    expect(await screen.findByText('No hay establecimientos registrados.')).toBeInTheDocument();
  });

  it('abre y cierra el formulario de alta', async () => {
    const user = userEvent.setup();
    setupSupabase(comoSuper());
    render(<SettingsView />);
    await user.click(await screen.findByRole('button', { name: /Nuevo/ }));
    expect(screen.getByText('Alta de Nuevo Establecimiento')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Alta de Nuevo Establecimiento')).not.toBeInTheDocument();
  });

  const llenarAlta = async (user: ReturnType<typeof userEvent.setup>, conPassword = true) => {
    await user.click(await screen.findByRole('button', { name: /Nuevo/ }));
    await user.type(screen.getByPlaceholderText('Nombre del centro'), 'Centro Norte');
    await user.type(screen.getByPlaceholderText('Ciudad / Municipio'), 'Quillacollo');
    await user.type(screen.getByPlaceholderText('Nombre del encargado'), 'Jorge Encargado');
    await user.type(screen.getByPlaceholderText('Correo administrativo'), 'jorge@norte.bo');
    if (conPassword) await user.type(screen.getByPlaceholderText('Contraseña temporal'), 'Clave#1');
  };

  it('crea el establecimiento y su administrador', async () => {
    const user = userEvent.setup();
    setupSupabase(comoSuper());
    render(<SettingsView />);
    await llenarAlta(user);
    await user.click(screen.getByRole('button', { name: 'Crear Centro y Admin' }));

    await waitFor(() => expect(supa.builders.usuarios.insert).toHaveBeenCalled());
    expect(supa.builders.establecimientos.insert).toHaveBeenCalledWith([
      { nombre_establecimiento: 'Centro Norte', ciudad_municipio: 'Quillacollo', tipo: 'Centro de Salud' },
    ]);
    expect(supa.auth.admin.createUser).toHaveBeenCalledWith({ email: 'jorge@norte.bo', password: 'Clave#1', email_confirm: true });
    expect(supa.builders.usuarios.insert.mock.calls[0][0][0]).toMatchObject({
      id_usuario: 'new-user', id_establecimiento: 'e-new', rol: 'AdminEstablecimiento',
      nombre_completo: 'Jorge Encargado', correo_electronico: 'jorge@norte.bo',
    });
    await waitFor(() => expect(screen.queryByText('Alta de Nuevo Establecimiento')).not.toBeInTheDocument());
  });

  it('usa la contraseña por defecto si no se escribe ninguna', async () => {
    const user = userEvent.setup();
    setupSupabase(comoSuper());
    render(<SettingsView />);
    await llenarAlta(user, false);
    await user.click(screen.getByRole('button', { name: 'Crear Centro y Admin' }));
    await waitFor(() => expect(supa.auth.admin.createUser).toHaveBeenCalled());
    expect(supa.auth.admin.createUser.mock.calls[0][0].password).toBe('123456');
  });

  it('no hace nada si faltan campos obligatorios', async () => {
    const user = userEvent.setup();
    setupSupabase(comoSuper());
    render(<SettingsView />);
    await user.click(await screen.findByRole('button', { name: /Nuevo/ }));
    await user.click(screen.getByRole('button', { name: 'Crear Centro y Admin' }));
    expect(supa.builders.establecimientos.insert).not.toHaveBeenCalled();
    expect(supa.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('avisa del error si falla la creación de la cuenta', async () => {
    const user = userEvent.setup();
    setupSupabase(comoSuper());
    supa.auth.admin.createUser.mockResolvedValueOnce({ data: null, error: { message: 'Correo en uso' } });
    render(<SettingsView />);
    await llenarAlta(user);
    await user.click(screen.getByRole('button', { name: 'Crear Centro y Admin' }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Error: Correo en uso'));
    expect(supa.builders.usuarios.insert).not.toHaveBeenCalled();
  });

  it('elimina un establecimiento tras confirmar', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setupSupabase(comoSuper());
    render(<SettingsView />);
    const fila = (await screen.findByText('Hospital Viedma')).closest('tr')!;
    await user.click(within(fila).getByRole('button'));

    await waitFor(() => expect(screen.queryByText('Hospital Viedma')).not.toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Hospital Viedma'));
    expect(supa.builders.establecimientos.delete).toHaveBeenCalled();
    expect(supa.builders.establecimientos.eq).toHaveBeenCalledWith('id_establecimiento', 'e1');
    expect(screen.getByText('Farmacia Central')).toBeInTheDocument();
  });

  it('no elimina si el usuario cancela la confirmación', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setupSupabase(comoSuper());
    render(<SettingsView />);
    const fila = (await screen.findByText('Hospital Viedma')).closest('tr')!;
    await user.click(within(fila).getByRole('button'));

    expect(screen.getByText('Hospital Viedma')).toBeInTheDocument();
    expect(supa.builders.establecimientos.delete).not.toHaveBeenCalled();
  });

  it('avisa si falla la eliminación y conserva la fila', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setupSupabase({
      usuarios: { data: SUPER },
      establecimientos: (ctx: any) => (ctx.has('delete') ? { error: { message: 'FK violada' } } : { data: EST }),
    });
    render(<SettingsView />);
    const fila = (await screen.findByText('Hospital Viedma')).closest('tr')!;
    await user.click(within(fila).getByRole('button'));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Error al eliminar: FK violada'));
    expect(screen.getByText('Hospital Viedma')).toBeInTheDocument();
  });
});

describe('SettingsView – AdminEstablecimiento (personal)', () => {
  it('lista el personal del establecimiento sin incluir al propio usuario', async () => {
    setupSupabase(comoAdmin());
    render(<SettingsView />);
    expect(await screen.findByText('Gestión de Personal')).toBeInTheDocument();
    expect(screen.getByText('Luis Enfermero')).toBeInTheDocument();
    expect(supa.builders.usuarios.eq).toHaveBeenCalledWith('id_establecimiento', 'est-1');
    expect(supa.builders.usuarios.neq).toHaveBeenCalledWith('id_usuario', 'user-1');
    expect(screen.queryByText(/Red BioSafe/)).not.toBeInTheDocument();
  });

  it('muestra mensaje si aún no hay personal', async () => {
    setupSupabase(comoAdmin([]));
    render(<SettingsView />);
    expect(await screen.findByText('Aún no hay personal registrado en este centro.')).toBeInTheDocument();
  });

  it('crea una cuenta de personal asociada al establecimiento', async () => {
    const user = userEvent.setup();
    setupSupabase(comoAdmin());
    render(<SettingsView />);
    await user.click(await screen.findByRole('button', { name: /Agregar/ }));
    await user.type(screen.getByPlaceholderText('Nombre completo'), 'Paula Farma');
    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'paula@biosafe.bo');
    await user.selectOptions(screen.getByRole('combobox'), 'Farmaceutico');
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    await waitFor(() => expect(supa.builders.usuarios.insert).toHaveBeenCalled());
    expect(supa.auth.admin.createUser).toHaveBeenCalledWith({ email: 'paula@biosafe.bo', password: '123456', email_confirm: true });
    expect(supa.builders.usuarios.insert.mock.calls[0][0][0]).toMatchObject({
      id_usuario: 'new-user', id_establecimiento: 'est-1', nombre_completo: 'Paula Farma',
      correo_electronico: 'paula@biosafe.bo', rol: 'Farmaceutico',
    });
    await waitFor(() => expect(screen.queryByText('Crear acceso para personal médico')).not.toBeInTheDocument());
  });

  it('exige nombre y correo para crear personal', async () => {
    const user = userEvent.setup();
    setupSupabase(comoAdmin());
    render(<SettingsView />);
    await user.click(await screen.findByRole('button', { name: /Agregar/ }));
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));
    expect(supa.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('elimina personal (auth + tabla) tras confirmar', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setupSupabase(comoAdmin());
    render(<SettingsView />);
    const fila = (await screen.findByText('Luis Enfermero')).closest('tr')!;
    await user.click(within(fila).getByRole('button'));

    await waitFor(() => expect(screen.queryByText('Luis Enfermero')).not.toBeInTheDocument());
    expect(supa.auth.admin.deleteUser).toHaveBeenCalledWith('u-2');
    expect(supa.builders.usuarios.delete).toHaveBeenCalled();
    expect(supa.builders.usuarios.eq).toHaveBeenCalledWith('id_usuario', 'u-2');
  });

  it('no elimina si se cancela', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setupSupabase(comoAdmin());
    render(<SettingsView />);
    const fila = (await screen.findByText('Luis Enfermero')).closest('tr')!;
    await user.click(within(fila).getByRole('button'));
    expect(supa.auth.admin.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText('Luis Enfermero')).toBeInTheDocument();
  });
});
