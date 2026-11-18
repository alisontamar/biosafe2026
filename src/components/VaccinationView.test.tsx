import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => {
  const qr: any = { start: vi.fn(), stop: vi.fn(() => Promise.resolve()) };
  return { qr, onScan: null as null | ((t: string) => Promise<void>) };
});
vi.mock('html5-qrcode', () => ({ Html5Qrcode: vi.fn(function () { return h.qr; }) }));
vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { Html5Qrcode } from 'html5-qrcode';
import { setupSupabase, supa } from '../test/supabaseMock';
import VaccinationView from './VaccinationView';

const AHORA = new Date(2026, 5, 15, 12, 0, 0);

const CAT = [
  { id_vacuna: 'v1', nombre_enfermedad: 'BCG', dosis_numero: 'Dosis única', edad_meses_ideal: 0 },
  { id_vacuna: 'v2', nombre_enfermedad: 'Pentavalente', dosis_numero: 'Dosis 1', edad_meses_ideal: 2 },
  { id_vacuna: 'v3', nombre_enfermedad: 'Pentavalente', dosis_numero: 'Dosis 2', edad_meses_ideal: 4 },
];
const PAC = { id_paciente: 'p1', nombre_completo: 'Ana Pérez', fecha_nacimiento: '2025-03-10T12:00:00', sexo: 'F' };
const HIST = {
  id_registro: 'r1', fecha_aplicacion: '2026-05-02T12:00:00', lote: 'L1',
  cat_vacunas_oficiales: { nombre_enfermedad: 'BCG', dosis_numero: 'Dosis única' },
};

type Over = Record<string, any>;
const tablas = (over: Over = {}) => ({
  cat_vacunas_oficiales: { data: CAT },
  usuarios: { data: { rol: 'Medico' } },
  pacientes: { data: [PAC] },
  dosis_aplicadas: { data: [HIST] },
  ...over,
});
const iniciar = async (over: Over = {}, session?: any) => {
  setupSupabase(tablas(over), session);
  const utils = render(<VaccinationView />);
  await screen.findByText('Control de Vacunación');
  return utils;
};

beforeEach(() => {
  vi.clearAllMocks();
  h.qr.stop.mockImplementation(() => Promise.resolve());
  h.qr.start.mockImplementation(async (_c: unknown, _cfg: unknown, onOk: any) => { h.onScan = onOk; });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

// ───────────────────────────────────────────────────────────────────────────────
describe('VaccinationView – pestaña "Registrar dosis"', () => {
  it('agrupa las vacunas del catálogo por enfermedad', async () => {
    await iniciar();
    expect(await screen.findByText('Pentavalente')).toBeInTheDocument();
    expect(screen.getByText('BCG')).toBeInTheDocument();
    expect(screen.getByText('1 dosis en el esquema')).toBeInTheDocument();
    expect(screen.getByText('2 dosis en el esquema')).toBeInTheDocument();
    expect(screen.getByText('Dosis 1 · 2m')).toBeInTheDocument();
    expect(screen.getByText('Dosis 2 · 4m')).toBeInTheDocument();
  });

  it('con catálogo vacío ofrece ir a la pestaña del catálogo', async () => {
    const user = userEvent.setup();
    await iniciar({ cat_vacunas_oficiales: { data: [] } });
    expect(await screen.findByText('No hay vacunas en el catálogo.')).toBeInTheDocument();
    await user.click(screen.getByText('Ir al catálogo para agregar →'));
    expect(screen.getByText('Catálogo vacío.')).toBeInTheDocument();
  });

  it('"Nuevo registro" abre el escáner sin vacuna preseleccionada', async () => {
    const user = userEvent.setup();
    await iniciar();
    await user.click(screen.getByRole('button', { name: /Nuevo registro/ }));
    expect(screen.getByText('Escanear carnet QR')).toBeInTheDocument();
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('VaccinationView – catálogo y pendientes', () => {
  const irAlCatalogo = async (over: Over = {}) => {
    const user = userEvent.setup();
    const utils = await iniciar(over);
    await user.click(screen.getByRole('button', { name: 'Catálogo y pendientes' }));
    return { user, ...utils };
  };

  it('lista cada dosis y pide seleccionar una', async () => {
    await irAlCatalogo();
    expect(screen.getByText('Vacunas registradas')).toBeInTheDocument();
    expect(screen.getByText('desde 4 meses')).toBeInTheDocument();
    expect(screen.getByText(/Selecciona una dosis del catálogo/)).toBeInTheDocument();
  });

  it.each([
    ['Medico', true], ['AdminEstablecimiento', true], ['SuperAdmin', true],
    ['Enfermero', false], ['Farmaceutico', false],
  ])('rol %s %s puede agregar vacunas', async (rol, puede) => {
    await irAlCatalogo({ usuarios: { data: { rol } } });
    await waitFor(() => expect(supa.builders.usuarios.eq).toHaveBeenCalled());
    await act(async () => {});
    expect(!!screen.queryByRole('button', { name: /Agregar vacuna/ })).toBe(puede);
  });

  it('sin sesión no se ofrece agregar vacunas', async () => {
    const user = userEvent.setup();
    await iniciar({}, null);
    await user.click(screen.getByRole('button', { name: 'Catálogo y pendientes' }));
    expect(screen.queryByRole('button', { name: /Agregar vacuna/ })).not.toBeInTheDocument();
  });

  describe('panel de pacientes pendientes', () => {
    const PACIENTES = [
      { id_paciente: 'a', nombre_completo: 'Ana Pérez', fecha_nacimiento: '2026-02-10T12:00:00', sexo: 'M' },  // 4 meses
      { id_paciente: 'b', nombre_completo: 'Beto Ríos', fecha_nacimiento: '2026-04-10T12:00:00', sexo: 'M' },  // 2 meses, ya vacunado
      { id_paciente: 'c', nombre_completo: 'Carla Soto', fecha_nacimiento: '2025-10-05T12:00:00', sexo: 'F' }, // 8 meses
      { id_paciente: 'd', nombre_completo: 'Dani Luna', fecha_nacimiento: '2020-01-05T12:00:00', sexo: 'M' },  // 77 meses
    ];
    const datos = () => ({
      pacientes: { data: PACIENTES },
      dosis_aplicadas: { data: [{ id_paciente: 'b' }] },
    });
    const abrirPanel = async () => {
      const ctx = await irAlCatalogo(datos());
      await ctx.user.click(screen.getByText('Dosis 1').closest('button')!);
      return ctx;
    };
    const buscar = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Buscar' }));
    const nombres = () => screen.queryAllByText(/^(Ana|Beto|Carla|Dani) /).map((e) => e.textContent);

    it('al elegir una dosis propone el rango de edad: mínimo + 48 meses', async () => {
      await abrirPanel();
      const [desde, hasta] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(desde.value).toBe('2');
      expect(hasta.value).toBe('50');
      expect(screen.getByText('Ajusta el rango y presiona Buscar')).toBeInTheDocument();
    });

    it('busca pacientes en el rango que no tienen la dosis, del más viejo al más joven', async () => {
      const { user } = await abrirPanel();
      await buscar(user);

      await screen.findByText('Carla Soto');
      expect(nombres()).toEqual(['Carla Soto', 'Ana Pérez']); // Beto ya la tiene; Dani fuera de rango
      expect(supa.builders.dosis_aplicadas.eq).toHaveBeenCalledWith('id_vacuna', 'v2');
      expect(screen.getByText('8 meses · Femenino')).toBeInTheDocument();
      expect(screen.getByText('4 meses · Masculino')).toBeInTheDocument();
      expect(screen.getAllByText('Pendiente')).toHaveLength(2);
      expect(screen.getByText(/pacientes sin esta dosis en el rango seleccionado/).textContent)
        .toBe('2 pacientes sin esta dosis en el rango seleccionado');
    });

    it('usa singular cuando hay un solo paciente', async () => {
      const { user } = await abrirPanel();
      fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '5' } });
      await buscar(user);
      await screen.findByText('Carla Soto');
      expect(screen.getByText(/paciente sin esta dosis/).textContent).toBe('1 paciente sin esta dosis en el rango seleccionado');
    });

    it('con el rango vacío no limita por edad', async () => {
      const { user } = await abrirPanel();
      const [desde, hasta] = screen.getAllByRole('spinbutton');
      await user.clear(desde);
      await user.clear(hasta);
      await buscar(user);
      await screen.findByText('Dani Luna');
      expect(nombres()).toEqual(['Dani Luna', 'Carla Soto', 'Ana Pérez']);
    });

    it('marca "Vencido" a quien supera la edad máxima actual', async () => {
      const { user } = await abrirPanel();
      await buscar(user);
      await screen.findByText('Carla Soto');
      fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '5' } });

      const carla = screen.getByText('Carla Soto').closest('div')!.parentElement!;
      const ana = screen.getByText('Ana Pérez').closest('div')!.parentElement!;
      expect(within(carla).getByText('Vencido')).toBeInTheDocument();
      expect(within(ana).getByText('Pendiente')).toBeInTheDocument();
    });

    it('muestra "¡Al día!" si todos tienen la dosis', async () => {
      const { user } = await abrirPanel();
      fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '100' } });
      fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '120' } });
      await buscar(user);
      expect(await screen.findByText('¡Al día!')).toBeInTheDocument();
    });

    it('al cambiar de dosis reinicia el panel y el rango', async () => {
      const { user } = await abrirPanel();
      await buscar(user);
      await screen.findByText('Carla Soto');

      await user.click(screen.getByText('Dosis 2').closest('button')!);
      expect(screen.queryByText('Carla Soto')).not.toBeInTheDocument();
      expect(screen.getByText('Ajusta el rango y presiona Buscar')).toBeInTheDocument();
      expect((screen.getAllByRole('spinbutton')[0] as HTMLInputElement).value).toBe('4');
      expect((screen.getAllByRole('spinbutton')[1] as HTMLInputElement).value).toBe('52');
    });

    it('se puede cerrar el panel', async () => {
      const { user, container } = await abrirPanel();
      await user.click(container.querySelector('button[class*="text-white/60"]') as HTMLElement);
      expect(screen.getByText(/Selecciona una dosis del catálogo/)).toBeInTheDocument();
    });
  });

  describe('agregar vacuna al catálogo', () => {
    const abrir = async (over: Over = {}) => {
      const ctx = await irAlCatalogo(over);
      await waitFor(() => expect(screen.getByRole('button', { name: /Agregar vacuna/ })).toBeInTheDocument());
      await ctx.user.click(screen.getByRole('button', { name: /Agregar vacuna/ }));
      return ctx;
    };
    const guardar = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Agregar al catálogo' }));
    const llenar = async (user: ReturnType<typeof userEvent.setup>, min = '6') => {
      await user.type(screen.getByPlaceholderText(/Ej: Pentavalente/), '  Polio ');
      await user.type(screen.getByPlaceholderText(/Ej: Dosis 1/), ' Refuerzo ');
      await user.type(screen.getByPlaceholderText('Desde'), min);
    };

    it('exige los campos obligatorios', async () => {
      const { user } = await abrir();
      await guardar(user);
      expect(screen.getByText('Completa los campos obligatorios.')).toBeInTheDocument();
      expect(supa.builders.cat_vacunas_oficiales.insert).not.toHaveBeenCalled();
    });

    it('rechaza edades negativas', async () => {
      const { user } = await abrir();
      await llenar(user, '-3');
      await guardar(user);
      expect(screen.getByText('La edad mínima debe ser un número válido.')).toBeInTheDocument();
      expect(supa.builders.cat_vacunas_oficiales.insert).not.toHaveBeenCalled();
    });

    it('guarda la vacuna (sin espacios sobrantes), cierra y recarga el catálogo', async () => {
      const { user } = await abrir({
        cat_vacunas_oficiales: (ctx: any) => (ctx.has('insert') ? {} : { data: CAT }),
      });
      await llenar(user);
      const antes = supa.from.mock.calls.filter((c: any[]) => c[0] === 'cat_vacunas_oficiales').length;
      await guardar(user);

      await waitFor(() => expect(screen.queryByText('Referencia rápida:')).not.toBeInTheDocument());
      expect(supa.builders.cat_vacunas_oficiales.insert).toHaveBeenCalledWith({
        nombre_enfermedad: 'Polio', dosis_numero: 'Refuerzo', edad_meses_ideal: 6,
      });
      expect(supa.from.mock.calls.filter((c: any[]) => c[0] === 'cat_vacunas_oficiales').length).toBeGreaterThan(antes + 1);
    });

    it('muestra error y mantiene el modal si falla el guardado', async () => {
      const { user } = await abrir({
        cat_vacunas_oficiales: (ctx: any) => (ctx.has('insert') ? { error: { message: 'dup' } } : { data: CAT }),
      });
      await llenar(user);
      await guardar(user);
      expect(await screen.findByText('Error al guardar. Intenta de nuevo.')).toBeInTheDocument();
      expect(screen.getByText('Referencia rápida:')).toBeInTheDocument();
    });

    it('se cancela con el botón o con clic en el fondo', async () => {
      const { user } = await abrir();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByText('Referencia rápida:')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Agregar vacuna/ }));
      fireEvent.click(document.querySelector('.fixed.inset-0') as HTMLElement);
      expect(screen.queryByText('Referencia rápida:')).not.toBeInTheDocument();
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('VaccinationView – registro de dosis con QR', () => {
  const abrirEscaner = async (over: Over = {}, session?: any) => {
    const user = userEvent.setup();
    const utils = await iniciar(over, session);
    await user.click(await screen.findByText('Pentavalente').then(() => screen.getAllByRole('button', { name: /Registrar aplicación/ })[1]));
    return { user, ...utils };
  };
  const escanear = async (texto: string) => {
    await act(async () => { await h.onScan!(texto); });
  };
  const activar = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Activar cámara' }));
  const QR_OK = JSON.stringify({ id_paciente: 'p1', token: 'tok' });
  const hastaPaciente = async (over: Over = {}, session?: any) => {
    const ctx = await abrirEscaner(over, session);
    await activar(ctx.user);
    await escanear(QR_OK);
    await screen.findByText('Registrar vacuna', { selector: 'h2' });
    return ctx;
  };

  describe('escaneo', () => {
    it('empieza con la cámara inactiva', async () => {
      await abrirEscaner();
      expect(screen.getByText('Escanear carnet QR')).toBeInTheDocument();
      expect(screen.getByText('Cámara inactiva')).toBeInTheDocument();
    });

    it('activa la cámara trasera y permite cancelar', async () => {
      const { user } = await abrirEscaner();
      await activar(user);

      expect(Html5Qrcode).toHaveBeenCalledWith('qr-reader-modal');
      expect(h.qr.start.mock.calls[0][0]).toEqual({ facingMode: 'environment' });
      await user.click(screen.getByRole('button', { name: 'Cancelar escaneo' }));
      expect(h.qr.stop).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Activar cámara' })).toBeInTheDocument();
    });

    it('avisa si no se puede acceder a la cámara', async () => {
      h.qr.start.mockRejectedValue(new Error('NotAllowed'));
      const { user } = await abrirEscaner();
      await activar(user);
      expect(await screen.findByText('No se pudo acceder a la cámara. Verifica los permisos del navegador.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Activar cámara' })).toBeInTheDocument();
    });

    it('detiene la cámara al cerrar el modal', async () => {
      const { user, unmount } = await abrirEscaner();
      await activar(user);
      unmount();
      expect(h.qr.stop).toHaveBeenCalled();
    });

    it.each([
      ['texto que no es JSON', 'hola'],
      ['JSON sin token', JSON.stringify({ id_paciente: 'p1' })],
      ['JSON sin id_paciente', JSON.stringify({ token: 'x' })],
    ])('rechaza un QR inválido: %s', async (_caso, contenido) => {
      const { user } = await abrirEscaner();
      await activar(user);
      await escanear(contenido);
      expect(screen.getByText(`Formato de QR no reconocido. Contenido: ${contenido}`)).toBeInTheDocument();
      expect(supa.builders.pacientes).toBeUndefined();
    });

    it('recorta a 60 caracteres el contenido mostrado de un QR inválido', async () => {
      const { user } = await abrirEscaner();
      await activar(user);
      await escanear('z'.repeat(100));
      expect(screen.getByText(`Formato de QR no reconocido. Contenido: ${'z'.repeat(60)}`)).toBeInTheDocument();
    });

    it('avisa si el paciente no existe', async () => {
      const { user } = await abrirEscaner({ pacientes: { data: null } });
      await activar(user);
      await escanear(QR_OK);
      expect(screen.getByText(/Paciente no encontrado/)).toBeInTheDocument();
    });

    it('muestra el error de base de datos con su código', async () => {
      const { user } = await abrirEscaner({ pacientes: { error: { message: 'denegado', code: '42501' } } });
      await activar(user);
      await escanear(QR_OK);
      expect(screen.getByText('Error de base de datos: denegado (código: 42501)')).toBeInTheDocument();
    });

    it('avisa de un error de conexión', async () => {
      const { user } = await abrirEscaner();
      await activar(user);
      supa.from.mockImplementationOnce(() => { throw new Error('offline'); });
      await escanear(QR_OK);
      expect(screen.getByText('Error de conexión al validar el QR.')).toBeInTheDocument();
    });
  });

  describe('paciente identificado', () => {
    it('valida el QR contra id y token, detiene la cámara y muestra al paciente', async () => {
      await hastaPaciente();
      expect(h.qr.stop).toHaveBeenCalled();
      expect(supa.builders.pacientes.eq).toHaveBeenCalledWith('id_paciente', 'p1');
      expect(supa.builders.pacientes.eq).toHaveBeenCalledWith('codigo_qr_token', 'tok');
      expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
      expect(screen.getByText('AP')).toBeInTheDocument();
      expect(screen.getByText('15 meses · Femenino')).toBeInTheDocument();
    });

    it.each([
      ['2022-06-10T12:00:00', 'M', '4 años · Masculino'],
      ['2022-01-10T12:00:00', 'F', '4 años 5m · Femenino'],
    ])('formatea la edad de %s', async (nacimiento, sexo, esperado) => {
      await hastaPaciente({ pacientes: { data: [{ ...PAC, fecha_nacimiento: nacimiento, sexo }] } });
      expect(screen.getByText(esperado)).toBeInTheDocument();
    });

    it('lista el historial de vacunas', async () => {
      await hastaPaciente();
      expect(screen.getByText('BCG — Dosis única')).toBeInTheDocument();
      expect(screen.getByText('02/05/2026')).toBeInTheDocument();
    });

    it('indica cuando no hay vacunas registradas', async () => {
      await hastaPaciente({ dosis_aplicadas: { data: [] } });
      expect(screen.getByText('Sin vacunas registradas')).toBeInTheDocument();
    });

    it('el botón de confirmar está deshabilitado hasta elegir vacuna (sin preselección)', async () => {
      const user = userEvent.setup();
      await iniciar();
      await user.click(screen.getByRole('button', { name: /Nuevo registro/ }));
      await user.click(screen.getByRole('button', { name: 'Activar cámara' }));
      await escanear(QR_OK);
      await screen.findByText('Registrar vacuna', { selector: 'h2' });

      expect(screen.getByRole('button', { name: 'Confirmar registro' })).toBeDisabled();
      await user.selectOptions(screen.getByRole('combobox'), 'v3');
      expect(screen.getByRole('button', { name: 'Confirmar registro' })).toBeEnabled();
    });

    it('preselecciona la vacuna del grupo elegido', async () => {
      await hastaPaciente();
      expect(screen.getByRole('combobox')).toHaveValue('v2');
      expect(screen.getByRole('option', { name: 'Pentavalente · Dosis 1 (2m)' })).toBeInTheDocument();
    });

    it('cancelar cierra el modal', async () => {
      const { user } = await hastaPaciente();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByText('Registrar vacuna', { selector: 'h2' })).not.toBeInTheDocument();
    });
  });

  describe('guardar la dosis', () => {
    const datos = (over: Over = {}) => ({
      dosis_aplicadas: (ctx: any) => (ctx.has('insert') ? {} : { data: [HIST] }),
      ...over,
    });

    it('inserta la dosis con lote recortado y usuario atendedor, y luego se cierra solo', async () => {
      const { user } = await hastaPaciente(datos());
      await user.type(screen.getByPlaceholderText('Ej: LOT-2026-A4'), '  LOT-9 ');
      await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));

      expect(await screen.findByText('La vacuna fue guardada en el expediente del paciente.')).toBeInTheDocument();
      expect(supa.builders.dosis_aplicadas.insert).toHaveBeenCalledWith({
        id_paciente: 'p1',
        id_vacuna: 'v2',
        id_usuario_atendedor: 'user-1',
        fecha_aplicacion: AHORA.toISOString(),
        lote: 'LOT-9',
        origen_registro: 'Validado_En_Establecimiento',
      });
      await waitFor(() => expect(screen.queryByText('Dosis registrada')).not.toBeInTheDocument(), { timeout: 3500 });
    }, 8000);

    it('sin lote guarda null', async () => {
      const { user } = await hastaPaciente(datos());
      await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
      await screen.findByText('La vacuna fue guardada en el expediente del paciente.');
      expect(supa.builders.dosis_aplicadas.insert.mock.calls[0][0].lote).toBeNull();
    });

    it('sin sesión guarda el atendedor como null', async () => {
      const { user } = await hastaPaciente(datos(), null);
      await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
      await screen.findByText('La vacuna fue guardada en el expediente del paciente.');
      expect(supa.builders.dosis_aplicadas.insert.mock.calls[0][0].id_usuario_atendedor).toBeNull();
    });

    it('muestra error y permite reintentar si falla el guardado', async () => {
      const { user } = await hastaPaciente(datos({
        dosis_aplicadas: (ctx: any) => (ctx.has('insert') ? { error: { message: 'rls' } } : { data: [HIST] }),
      }));
      await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));

      expect(await screen.findByText('Error al guardar el registro. Intenta de nuevo.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirmar registro' })).toBeEnabled();
    });
  });

  it('el botón X y el clic en el fondo cierran el escáner', async () => {
    const { user } = await abrirEscaner();
    await user.click(document.querySelector('.fixed.inset-0 button') as HTMLElement);
    expect(screen.queryByText('Escanear carnet QR')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Registrar aplicación/ })[0]);
    fireEvent.click(document.querySelector('.fixed.inset-0') as HTMLElement);
    expect(screen.queryByText('Escanear carnet QR')).not.toBeInTheDocument();
  });
});
