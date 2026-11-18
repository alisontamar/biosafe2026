import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => {
  const target: any = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    save: vi.fn(),
  };
  // Cualquier otro método de jsPDF (text, rect, setFont…) es un espía.
  const doc: any = new Proxy(target, {
    get(t, k: string) { if (!(k in t)) t[k] = vi.fn(); return t[k]; },
  });
  return { doc, autoTable: vi.fn() };
});
vi.mock('jspdf', () => ({ default: vi.fn(function () { return h.doc; }) }));
vi.mock('jspdf-autotable', () => ({ default: h.autoTable }));
vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import { ReportsView } from './ReportsView';

const AHORA = new Date('2026-06-15T12:00:00Z');
const ANIO = new Date().getFullYear();

const vac = (nombre: string, dosis: string) => ({ nombre_enfermedad: nombre, dosis_numero: dosis });
const perfil = { data: { nombre_completo: 'Dra. Ana', establecimientos: { nombre_establecimiento: 'Hospital Viedma' } } };

const tablas = (over: Record<string, any> = {}) => ({ usuarios: perfil, pacientes: { count: 10 }, dosis_aplicadas: { data: [] }, ...over });
const botones = () => screen.getAllByRole('button', { name: /Generar PDF|Generando/ });
const ultimaTabla = () => h.autoTable.mock.calls[h.autoTable.mock.calls.length - 1][1];
const textosPdf = () => h.doc.text.mock.calls.map((c: any[]) => c[0]);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setupSupabase(tablas());
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('ReportsView – pantalla', () => {
  it('muestra el título y las tres tarjetas de reporte', () => {
    render(<ReportsView />);
    expect(screen.getByRole('heading', { name: 'Reportes y Descargas' })).toBeInTheDocument();
    ['Consolidado Mensual', 'Cobertura por Vacuna', 'Pacientes en Mora'].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
    expect(botones()).toHaveLength(3);
  });

  it('el selector de período trae 12 meses y 3 años, con el mes actual preseleccionado', () => {
    render(<ReportsView />);
    const [mes, anio] = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(mes.options).toHaveLength(12);
    expect(mes.value).toBe('5'); // Junio (fecha simulada)
    expect(Array.from(anio.options).map((o) => o.value)).toEqual([ANIO - 2, ANIO - 1, ANIO].map(String));
    expect(anio.value).toBe(String(ANIO));
  });
});

describe('ReportsView – Consolidado Mensual', () => {
  const generar = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.selectOptions(screen.getAllByRole('combobox')[0], '2'); // Marzo
    await user.selectOptions(screen.getAllByRole('combobox')[1], String(ANIO - 1));
    await user.click(botones()[0]);
  };

  it('agrupa por vacuna y dosis, une lotes y descarga el PDF con el período', async () => {
    setupSupabase(tablas({
      dosis_aplicadas: {
        data: [
          { lote: 'L1', cat_vacunas_oficiales: vac('BCG', '1ra') },
          { lote: 'L2', cat_vacunas_oficiales: vac('BCG', '1ra') },
          { lote: 'L1', cat_vacunas_oficiales: vac('BCG', '1ra') }, // lote repetido
          { lote: null, cat_vacunas_oficiales: vac('Pentavalente', '2da') },
          { lote: 'X', cat_vacunas_oficiales: null }, // sin catálogo: cuenta en el total pero no en el detalle
        ],
      },
    }));
    const user = userEvent.setup();
    render(<ReportsView />);
    await generar(user);

    await waitFor(() => expect(h.doc.save).toHaveBeenCalledWith(`BIOSAFE_Consolidado_Marzo_${ANIO - 1}.pdf`));
    const t = ultimaTabla();
    expect(t.head).toEqual([['Vacuna', 'Nro. Dosis', 'Aplicadas', 'Lotes']]);
    expect(t.body).toEqual([
      ['BCG', '1ra', '3', 'L1, L2'],
      ['Pentavalente', '2da', '1', '—'],
    ]);
    expect(t.foot[0][0]).toBe(`Total dosis aplicadas en Marzo ${ANIO - 1}`);
    expect(t.foot[0][2]).toBe('5');
  });

  it('filtra las dosis por el mes y año elegidos', async () => {
    const user = userEvent.setup();
    render(<ReportsView />);
    await generar(user);
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());

    const b = supa.builders.dosis_aplicadas;
    expect(b.gte).toHaveBeenCalledWith('fecha_aplicacion', new Date(ANIO - 1, 2, 1).toISOString());
    expect(b.lte).toHaveBeenCalledWith('fecha_aplicacion', new Date(ANIO - 1, 3, 0, 23, 59, 59).toISOString());
  });

  it('indica cuando no hay registros en el período', async () => {
    const user = userEvent.setup();
    render(<ReportsView />);
    await generar(user);
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());
    expect(ultimaTabla().body).toEqual([['Sin registros en el período seleccionado', '', '', '']]);
  });

  it('el encabezado del PDF incluye el establecimiento y el período', async () => {
    const user = userEvent.setup();
    render(<ReportsView />);
    await generar(user);
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());
    expect(textosPdf()).toEqual(expect.arrayContaining([
      'BIOSAFE', 'Hospital Viedma', `Marzo ${ANIO - 1}`, 'Consolidado Mensual de Dosis Aplicadas',
    ]));
  });
});

describe('ReportsView – Cobertura por Vacuna', () => {
  const pacientes = (n: number, nombre: string, dosis = '1ra') =>
    Array.from({ length: n }, (_, i) => ({ id_paciente: `p${i}`, cat_vacunas_oficiales: vac(nombre, dosis) }));

  const generar = async () => { await userEvent.setup().click(botones()[1]); await waitFor(() => expect(h.doc.save).toHaveBeenCalled()); };

  it('calcula cobertura, estado y ordena de mayor a menor', async () => {
    setupSupabase(tablas({
      pacientes: { count: 10 },
      dosis_aplicadas: {
        data: [
          ...pacientes(1, 'Hepatitis B'),                        // 10%  → Crítica
          ...pacientes(8, 'Rotavirus'),                           // 80%  → En riesgo
          ...pacientes(10, 'BCG', '1ra'), ...pacientes(10, 'BCG', '2da'), // 100% → Óptima, 2 variantes
        ],
      },
    }));
    render(<ReportsView />);
    await generar();

    const t = ultimaTabla();
    expect(t.body).toEqual([
      ['BCG', '2', '10', '10', '100%', 'Óptima'],
      ['Rotavirus', '1', '10', '8', '80%', 'En riesgo'],
      ['Hepatitis B', '1', '10', '1', '10%', 'Crítica'],
    ]);
    expect(h.doc.save).toHaveBeenCalledWith(`BIOSAFE_Cobertura_Junio_${ANIO}.pdf`);
    // KPIs: promedio (100+80+10)/3 = 63, objetivo y vacunas en catálogo
    expect(textosPdf()).toEqual(expect.arrayContaining(['63%', '10', '3']));
  });

  it('limita la cobertura al 100% aunque haya más vacunados que pacientes', async () => {
    setupSupabase(tablas({ pacientes: { count: 1 }, dosis_aplicadas: { data: pacientes(3, 'BCG') } }));
    render(<ReportsView />);
    await generar();
    expect(ultimaTabla().body[0][4]).toBe('100%');
  });

  it('con 0 pacientes la cobertura es 0% y crítica', async () => {
    setupSupabase(tablas({ pacientes: { count: 0 }, dosis_aplicadas: { data: pacientes(2, 'BCG') } }));
    render(<ReportsView />);
    await generar();
    expect(ultimaTabla().body[0]).toEqual(['BCG', '1', '0', '2', '0%', 'Crítica']);
  });

  it('sin dosis muestra "Sin datos disponibles"', async () => {
    render(<ReportsView />);
    await generar();
    expect(ultimaTabla().body).toEqual([['Sin datos disponibles', '', '', '', '', '']]);
  });

  it('colorea la celda de estado según su valor', async () => {
    render(<ReportsView />);
    await generar();
    const { didParseCell } = ultimaTabla();
    const celda = (raw: string, index = 5, section = 'body') => {
      const c = { raw, styles: {} as any };
      didParseCell({ column: { index }, section, cell: c });
      return c.styles.textColor;
    };
    expect(celda('Crítica')).toEqual([162, 45, 45]);
    expect(celda('En riesgo')).toEqual([133, 79, 11]);
    expect(celda('Óptima')).toEqual([59, 109, 17]);
    expect(celda('Crítica', 4)).toBeUndefined();         // otra columna
    expect(celda('Crítica', 5, 'head')).toBeUndefined(); // no es el cuerpo
  });
});

describe('ReportsView – Pacientes en Mora', () => {
  const generar = async () => { await userEvent.setup().click(botones()[2]); await waitFor(() => expect(h.doc.save).toHaveBeenCalled()); };
  const vencida = (extra: Record<string, unknown> = {}) => ({
    fecha_vencimiento_proxima: '2026-05-16T12:00:00Z', // 30 días antes de AHORA
    pacientes: { nombre_completo: 'Lucía Gómez', fecha_nacimiento: '2024-06-01T12:00:00Z' },
    cat_vacunas_oficiales: vac('BCG', '1ra'),
    ...extra,
  });

  it('lista pacientes con días vencidos, edad y vacuna', async () => {
    setupSupabase(tablas({ dosis_aplicadas: { data: [vencida()] } }));
    render(<ReportsView />);
    await generar();

    const t = ultimaTabla();
    expect(t.body).toEqual([[
      'Lucía Gómez', '2 años', 'BCG — 1ra', new Date('2026-05-16T12:00:00Z').toLocaleDateString('es-BO'), '30 días',
    ]]);
    expect(t.foot[0][4]).toBe('1 paciente(s)');
    expect(textosPdf()).toContain('1 paciente(s) con dosis vencidas requieren atención inmediata.');
  });

  it('consulta solo dosis con vencimiento anterior a hoy', async () => {
    render(<ReportsView />);
    await generar();
    const b = supa.builders.dosis_aplicadas;
    expect(b.not).toHaveBeenCalledWith('fecha_vencimiento_proxima', 'is', null);
    expect(b.lt).toHaveBeenCalledWith('fecha_vencimiento_proxima', AHORA.toISOString());
  });

  it('usa valores por defecto si faltan paciente o vacuna', async () => {
    setupSupabase(tablas({ dosis_aplicadas: { data: [vencida({ pacientes: null, cat_vacunas_oficiales: null })] } }));
    render(<ReportsView />);
    await generar();
    const fila = ultimaTabla().body[0];
    expect([fila[0], fila[1], fila[2]]).toEqual(['Desconocido', '—', '—']);
  });

  it('sin pacientes en mora lo indica', async () => {
    render(<ReportsView />);
    await generar();
    expect(ultimaTabla().body).toEqual([['Sin pacientes en mora al día de hoy', '', '', '', '']]);
    expect(textosPdf()).toContain('No se encontraron pacientes en mora.');
  });

  it('nombra el archivo con la fecha de hoy', async () => {
    render(<ReportsView />);
    await generar();
    const hoy = AHORA.toLocaleDateString('es-BO').replace(/\//g, '-');
    expect(h.doc.save).toHaveBeenCalledWith(`BIOSAFE_Mora_${hoy}.pdf`);
  });

  it('resalta en rojo si pasan más de 30 días y en ámbar si no', async () => {
    render(<ReportsView />);
    await generar();
    const { didParseCell } = ultimaTabla();
    const estilo = (raw: string) => {
      const c = { raw, styles: {} as any };
      didParseCell({ column: { index: 4 }, section: 'body', cell: c });
      return c.styles;
    };
    expect(estilo('45 días')).toEqual({ textColor: [162, 45, 45], fontStyle: 'bold' });
    expect(estilo('10 días')).toEqual({ textColor: [133, 79, 11], fontStyle: 'bold' });
  });
});

describe('ReportsView – contexto y errores', () => {
  it('sin sesión el PDF usa "Sistema Central"', async () => {
    setupSupabase(tablas(), null);
    render(<ReportsView />);
    await userEvent.setup().click(botones()[0]);
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());
    expect(textosPdf()).toContain('Sistema Central');
  });

  it('acepta establecimientos como arreglo', async () => {
    setupSupabase(tablas({
      usuarios: { data: { nombre_completo: 'X', establecimientos: [{ nombre_establecimiento: 'Centro Sur' }] } },
    }));
    render(<ReportsView />);
    await userEvent.setup().click(botones()[0]);
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());
    expect(textosPdf()).toContain('Centro Sur');
  });

  it('muestra "Generando…" y bloquea todos los botones mientras trabaja', async () => {
    let liberar!: (v: unknown) => void;
    supa.auth.getSession.mockReturnValueOnce(new Promise((r) => { liberar = r; }));
    render(<ReportsView />);
    await userEvent.setup().click(botones()[1]);

    expect(screen.getByRole('button', { name: /Generando/ })).toBeDisabled();
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());

    liberar({ data: { session: null } });
    await waitFor(() => expect(h.doc.save).toHaveBeenCalled());
    await waitFor(() => botones().forEach((b) => expect(b).toBeEnabled()));
  });

  it.each([[0, 'consolidado'], [1, 'cobertura'], [2, 'mora']])(
    'si falla la generación (%i · %s) registra el error, no descarga y rehabilita el botón',
    async (i) => {
      h.autoTable.mockImplementationOnce(() => { throw new Error('pdf roto'); });
      render(<ReportsView />);
      await userEvent.setup().click(botones()[i]);

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(h.doc.save).not.toHaveBeenCalled();
      await waitFor(() => expect(botones()[i]).toBeEnabled());
    }
  );
});
