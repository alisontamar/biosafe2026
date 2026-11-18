import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import PatientsView from './PatientsView';

// "Hoy" fijo para que las edades sean deterministas (solo se falsea Date).
const HOY = new Date(2026, 5, 15, 12, 0, 0);

const P1 = {
  id_paciente: 'p1', nombre_completo: 'Lucía Gómez', fecha_nacimiento: '2024-06-10', sexo: 'F',
  es_embarazada: true, usuarios: { correo_electronico: 'lucia@mail.com', nombre_completo: 'Tutor Uno' },
};
const P2 = {
  id_paciente: 'p2', nombre_completo: 'Pedro Álvarez', fecha_nacimiento: '2025-12-10', sexo: 'M',
  es_embarazada: false, usuarios: null,
};
const DOSIS = {
  id_paciente: 'p1',
  fecha_aplicacion: '2026-03-10T12:00:00',
  fecha_vencimiento_proxima: '2020-01-01T12:00:00',
  lote: 'L-77',
  origen_registro: 'App',
  cat_vacunas_oficiales: { nombre_enfermedad: 'BCG', dosis_numero: '1ra dosis' },
  usuarios: { nombre_completo: 'Dra. Pérez' },
};

const tablas = (rol = 'Medico', over: Record<string, any> = {}) => ({
  usuarios: (ctx: any) =>
    ctx.has('single') ? { data: { rol, id_establecimiento: 'est-1' } } : { data: [{ id_usuario: 'tutor-1' }] },
  dosis_aplicadas: { data: [DOSIS] },
  pacientes: { data: [P1, P2] },
  ...over,
});

const filas = () => screen.getAllByRole('row').slice(1); // sin encabezado

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(HOY);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('PatientsView – listado', () => {
  it('muestra los pacientes (tarjeta móvil + tabla)', async () => {
    setupSupabase(tablas());
    render(<PatientsView />);
    expect((await screen.findAllByText('Lucía Gómez')).length).toBe(2);
    expect(screen.getAllByText('Pedro Álvarez').length).toBe(2);
    expect(filas()).toHaveLength(2);
  });

  it('un rol no SuperAdmin ve solo pacientes de su establecimiento', async () => {
    setupSupabase(tablas('Medico'));
    render(<PatientsView />);
    await screen.findAllByText('Lucía Gómez');
    expect(screen.getByText('Mostrando pacientes de tu establecimiento')).toBeInTheDocument();
    expect(supa.builders.pacientes.in).toHaveBeenCalledWith('id_tutor_registro', ['tutor-1']);
  });

  it('SuperAdmin ve todos los pacientes sin filtrar', async () => {
    setupSupabase(tablas('SuperAdmin'));
    render(<PatientsView />);
    await screen.findAllByText('Lucía Gómez');
    expect(screen.queryByText('Mostrando pacientes de tu establecimiento')).not.toBeInTheDocument();
    expect(supa.builders.pacientes.in).not.toHaveBeenCalled();
  });

  it('si el establecimiento no tiene tutores, no hay pacientes', async () => {
    setupSupabase(tablas('Medico', {
      usuarios: (ctx: any) => (ctx.has('single') ? { data: { rol: 'Medico', id_establecimiento: 'est-1' } } : { data: [] }),
    }));
    render(<PatientsView />);
    expect((await screen.findAllByText('No se encontraron pacientes.')).length).toBeGreaterThan(0);
  });

  it('sin sesión no consulta pacientes', async () => {
    setupSupabase(tablas(), null);
    render(<PatientsView />);
    expect((await screen.findAllByText('No se encontraron pacientes.')).length).toBeGreaterThan(0);
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('registra el error si falla la consulta', async () => {
    setupSupabase(tablas('SuperAdmin', { pacientes: { error: new Error('boom') } }));
    render(<PatientsView />);
    expect((await screen.findAllByText('No se encontraron pacientes.')).length).toBeGreaterThan(0);
    expect(console.error).toHaveBeenCalled();
  });

  it('marca EN MORA a quien tiene dosis vencidas y AL DÍA al resto', async () => {
    setupSupabase(tablas());
    render(<PatientsView />);
    await screen.findAllByText('Lucía Gómez');
    const [fila1, fila2] = filas();
    expect(within(fila1).getByText('EN MORA')).toBeInTheDocument();
    expect(within(fila2).getByText('AL DÍA')).toBeInTheDocument();
  });

  it('calcula la edad correctamente', async () => {
    setupSupabase(tablas('SuperAdmin', {
      pacientes: {
        data: [
          { ...P1, id_paciente: 'a', nombre_completo: 'Dos', fecha_nacimiento: '2024-06-10' },
          { ...P1, id_paciente: 'b', nombre_completo: 'Uno', fecha_nacimiento: '2025-06-10' },
          { ...P1, id_paciente: 'c', nombre_completo: 'Meses', fecha_nacimiento: '2025-12-10' },
          { ...P1, id_paciente: 'd', nombre_completo: 'Futuro', fecha_nacimiento: '2026-08-01' },
          { ...P1, id_paciente: 'e', nombre_completo: 'SinFecha', fecha_nacimiento: '' },
        ],
      },
    }));
    render(<PatientsView />);
    await screen.findAllByText('Dos');
    const edad = (n: string) => within(screen.getAllByText(n)[1].closest('tr')!).getAllByRole('cell')[1].textContent;
    expect(edad('Dos')).toMatch(/^2 años/);
    expect(edad('Uno')).toMatch(/^1 año /);
    expect(edad('Meses')).toMatch(/^6 meses/);
    expect(edad('Futuro')).toMatch(/^Recién nacido/);
    expect(edad('SinFecha')).toMatch(/^Desconocida/);
  });

  it('muestra acceso vinculado / sin acceso y embarazada', async () => {
    setupSupabase(tablas());
    render(<PatientsView />);
    await screen.findAllByText('Lucía Gómez');
    const [fila1, fila2] = filas();
    expect(within(fila1).getByText('Vinculado')).toBeInTheDocument();
    expect(within(fila1).getByText('lucia@mail.com')).toBeInTheDocument();
    expect(within(fila1).getByText('Embarazada')).toBeInTheDocument();
    expect(within(fila2).getByText('Sin acceso')).toBeInTheDocument();
  });

  it('busca por nombre o correo sin distinguir mayúsculas', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    setupSupabase(tablas());
    render(<PatientsView />);
    await screen.findAllByText('Lucía Gómez');
    const caja = screen.getByPlaceholderText('Buscar por nombre o correo...');

    await user.type(caja, 'PEDRO');
    expect(filas()).toHaveLength(1);
    expect(screen.queryByText('Lucía Gómez')).not.toBeInTheDocument();

    await user.clear(caja);
    await user.type(caja, 'lucia@mail');
    expect(filas()).toHaveLength(1);
    expect(screen.getAllByText('Lucía Gómez').length).toBeGreaterThan(0);

    await user.clear(caja);
    await user.type(caja, 'zzz');
    expect(screen.getAllByText('No se encontraron pacientes.').length).toBeGreaterThan(0);
  });
});

describe('PatientsView – historial de vacunación', () => {
  const abrir = async (user: ReturnType<typeof userEvent.setup>) => {
    await screen.findAllByText('Lucía Gómez');
    await user.click(within(filas()[0]).getByTitle('Ver historial'));
  };

  it('muestra las dosis aplicadas del paciente', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<PatientsView />);
    await abrir(user);

    expect(await screen.findByText('Historial de vacunación')).toBeInTheDocument();
    expect(screen.getByText('BCG')).toBeInTheDocument();
    expect(screen.getByText('1ra dosis')).toBeInTheDocument();
    expect(screen.getByText('10/03/2026')).toBeInTheDocument();
    expect(screen.getByText('L-77')).toBeInTheDocument();
    expect(screen.getByText('Dra. Pérez')).toBeInTheDocument();
    expect(screen.getByText('Aplicado')).toBeInTheDocument();
    expect(screen.getByText(/Vencida:/)).toBeInTheDocument();
    expect(screen.getByText('dosis registradas en total')).toBeInTheDocument();
    expect(supa.builders.dosis_aplicadas.eq).toHaveBeenCalledWith('id_paciente', 'p1');
  });

  it('distingue dosis migradas de cartilla física', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas('Medico', { dosis_aplicadas: { data: [{ ...DOSIS, origen_registro: 'Migrado_Cartilla_Fisica' }] } }));
    render(<PatientsView />);
    await abrir(user);
    expect(await screen.findByText('Migrado')).toBeInTheDocument();
  });

  it('indica "Próx. dosis" cuando la fecha aún no vence', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas('Medico', { dosis_aplicadas: { data: [{ ...DOSIS, fecha_vencimiento_proxima: '2027-01-01T12:00:00' }] } }));
    render(<PatientsView />);
    await abrir(user);
    expect(await screen.findByText(/Próx\. dosis:/)).toBeInTheDocument();
    expect(screen.queryByText(/Vencida:/)).not.toBeInTheDocument();
  });

  it('muestra mensaje si no hay dosis registradas', async () => {
    const user = userEvent.setup();
    let n = 0;
    setupSupabase(tablas('Medico', { dosis_aplicadas: () => ({ data: n++ === 0 ? [DOSIS] : [] }) }));
    render(<PatientsView />);
    await abrir(user);
    expect(await screen.findByText('Sin dosis registradas')).toBeInTheDocument();
  });

  it('se cierra al hacer clic en el fondo', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    const { container } = render(<PatientsView />);
    await abrir(user);
    await screen.findByText('Historial de vacunación');

    await user.click(container.querySelector('.fixed.inset-0 > .absolute.inset-0') as HTMLElement);
    expect(screen.queryByText('Historial de vacunación')).not.toBeInTheDocument();
  });
});

describe('PatientsView – alta de paciente', () => {
  const abrirModal = async (user: ReturnType<typeof userEvent.setup>) => {
    await screen.findAllByText('Lucía Gómez');
    await user.click(screen.getByRole('button', { name: /Alta de Paciente/ }));
  };
  const llenar = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
    await user.type(screen.getByPlaceholderText('Nombre Completo'), 'Nuevo Niño');
    fireEvent.change(container.querySelector('input[type=date]')!, { target: { value: '2025-01-20' } });
    await user.type(screen.getByPlaceholderText('Correo electrónico del paciente'), 'tutor@mail.com');
  };

  it('abre y cancela el modal', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<PatientsView />);
    await abrirModal(user);
    expect(screen.getByText('Alta de Nuevo Paciente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Alta de Nuevo Paciente')).not.toBeInTheDocument();
  });

  it('solo ofrece "gestación" cuando el sexo es femenino', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    render(<PatientsView />);
    await abrirModal(user);
    expect(screen.queryByText('Paciente en estado de gestación')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox'), 'F');
    expect(screen.getByText('Paciente en estado de gestación')).toBeInTheDocument();
  });

  it('crea la cuenta de acceso, el usuario y el paciente', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    const { container } = render(<PatientsView />);
    await abrirModal(user);
    await llenar(user, container);
    await user.click(screen.getByRole('button', { name: /Crear Paciente y Cuenta/ }));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(supa.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'tutor@mail.com', password: 'BioSafe2026*', email_confirm: true,
    });
    const filaUsuario = supa.builders.usuarios.insert.mock.calls[0][0][0];
    expect(filaUsuario).toMatchObject({
      id_usuario: 'new-user', id_establecimiento: 'est-1', nombre_completo: 'Nuevo Niño',
      correo_electronico: 'tutor@mail.com', rol: 'Tutor_PersonaNormal', tiene_hijos: false,
    });
    const filaPaciente = supa.builders.pacientes.insert.mock.calls[0][0][0];
    expect(filaPaciente).toMatchObject({
      id_tutor_registro: 'new-user', nombre_completo: 'Nuevo Niño', fecha_nacimiento: '2025-01-20',
      sexo: 'M', es_embarazada: false,
    });
    expect(typeof filaPaciente.codigo_qr_token).toBe('string');
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('BioSafe2026*'));
    await waitFor(() => expect(screen.queryByText('Alta de Nuevo Paciente')).not.toBeInTheDocument());
  });

  it('guarda el estado de embarazo solo para pacientes femeninas', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    const { container } = render(<PatientsView />);
    await abrirModal(user);
    await llenar(user, container);
    await user.selectOptions(screen.getByRole('combobox'), 'F');
    await user.click(screen.getByLabelText('Paciente en estado de gestación'));
    await user.click(screen.getByRole('button', { name: /Crear Paciente y Cuenta/ }));

    await waitFor(() => expect(supa.builders.pacientes.insert).toHaveBeenCalled());
    expect(supa.builders.pacientes.insert.mock.calls[0][0][0]).toMatchObject({ sexo: 'F', es_embarazada: true });
  });

  it('avisa del error y mantiene el modal si falla la creación de la cuenta', async () => {
    const user = userEvent.setup();
    setupSupabase(tablas());
    supa.auth.admin.createUser.mockResolvedValueOnce({ data: null, error: { message: 'Correo duplicado' } });
    const { container } = render(<PatientsView />);
    await abrirModal(user);
    await llenar(user, container);
    await user.click(screen.getByRole('button', { name: /Crear Paciente y Cuenta/ }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Error: Correo duplicado'));
    expect(supa.builders.pacientes.insert).not.toHaveBeenCalled();
    expect(screen.getByText('Alta de Nuevo Paciente')).toBeInTheDocument();
  });
});
