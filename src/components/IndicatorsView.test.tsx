import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Recharts no calcula tamaños en jsdom: se reemplaza por componentes que exponen sus datos.
vi.mock('recharts', () => {
  const nil = () => null;
  const chart = (id: string) => ({ data, children }: any) => (
    <div data-testid={id} data-data={JSON.stringify(data ?? null)}>{children}</div>
  );
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: chart('bar-chart'),
    LineChart: chart('line-chart'),
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data }: any) => <div data-testid="pie" data-data={JSON.stringify(data)} />,
    Bar: nil, Line: nil, XAxis: nil, YAxis: nil, CartesianGrid: nil, Tooltip: nil, Cell: nil, ReferenceLine: nil,
  };
});
vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import { IndicatorsView } from './IndicatorsView';

// "Hoy" fijo: 15-jun-2026 → últimos 6 meses = Ene…Jun
const AHORA = new Date(2026, 5, 15, 12, 0, 0);
const f = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();
const vac = (nombre: string, dosis: string) => ({ nombre_enfermedad: nombre, dosis_numero: dosis });

const DOSIS = [
  { id_paciente: 'p1', fecha_aplicacion: f(2026, 6, 10), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('BCG', '1ra') },
  { id_paciente: 'p2', fecha_aplicacion: f(2026, 6, 5), fecha_vencimiento_proxima: f(2026, 8, 1), cat_vacunas_oficiales: vac('BCG', '1ra') },
  { id_paciente: 'p3', fecha_aplicacion: f(2026, 5, 20), fecha_vencimiento_proxima: f(2026, 6, 1), cat_vacunas_oficiales: vac('BCG', '2da') },
  { id_paciente: 'p4', fecha_aplicacion: f(2026, 4, 20), fecha_vencimiento_proxima: f(2026, 5, 1), cat_vacunas_oficiales: vac('Rotavirus', '1ra') },
  { id_paciente: 'p5', fecha_aplicacion: f(2026, 5, 25), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('Rotavirus', '1ra') },
  { id_paciente: 'p6', fecha_aplicacion: f(2026, 1, 10), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('Hepatitis B', 'RN') },
  { id_paciente: 'p7', fecha_aplicacion: f(2026, 6, 1), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: null },
];
const ALERTAS = [
  { titulo: 'Riesgo alto de sarampión', resumen: 'Brote en Cercado', nivel: 'alto' },
  { titulo: 'Dengue', resumen: 'x'.repeat(120), nivel: 'moderado' },
  { titulo: 'Aviso', resumen: null, nivel: 'bajo' },
];

const tablas = (over: Record<string, any> = {}) => ({
  usuarios: { data: { id_establecimiento: 'e1', establecimientos: { nombre_establecimiento: 'Hospital Viedma' } } },
  pacientes: { count: 10 },
  dosis_aplicadas: { data: DOSIS },
  alertas_epidemiologicas_ia: { data: ALERTAS, count: 3 },
  ...over,
});

const kpi = (label: string) => screen.getByText(label).parentElement!;
const grafico = (id: string, i = 0) => JSON.parse(screen.getAllByTestId(id)[i].getAttribute('data-data')!);
const filaTabla = (nombre: string) => screen.getAllByText(nombre).map((e) => e.closest('tr')).find(Boolean)!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const mostrar = async (t = tablas()) => {
  setupSupabase(t);
  render(<IndicatorsView />);
  await screen.findByText('Resumen general');
};

describe('IndicatorsView – indicadores generales', () => {
  it('muestra el establecimiento del usuario', async () => {
    await mostrar();
    expect(screen.getByText('Hospital Viedma')).toBeInTheDocument();
  });

  it('usa "Centro de Salud" si no hay establecimiento y acepta arreglo', async () => {
    await mostrar(tablas({ usuarios: { data: { establecimientos: null } } }));
    expect(screen.getByText('Centro de Salud', { selector: 'strong' })).toBeInTheDocument();
  });

  it('acepta establecimientos como arreglo', async () => {
    await mostrar(tablas({ usuarios: { data: { establecimientos: [{ nombre_establecimiento: 'Centro Sur' }] } } }));
    expect(screen.getByText('Centro Sur')).toBeInTheDocument();
  });

  it('calcula los KPI principales', async () => {
    await mostrar();
    expect(kpi('Niños registrados')).toHaveTextContent('10');
    expect(kpi('Cobertura promedio')).toHaveTextContent('20%');          // (30+20+10)/3
    expect(kpi('Esquemas completos')).toHaveTextContent('4');
    expect(kpi('Esquemas completos')).toHaveTextContent('40% del total');
    expect(kpi('Dosis aplicadas')).toHaveTextContent('7');
    expect(kpi('Abandono')).toHaveTextContent('2');
    expect(kpi('Abandono')).toHaveTextContent('20% del total');
  });

  it('clasifica el estado de esquemas (completos / en proceso / abandonados)', async () => {
    await mostrar();
    expect(grafico('pie')).toEqual([
      { name: 'Completos', value: 4, color: '#A280B9' },
      // p2 (próxima dosis) + 3 pacientes sin dosis
      { name: 'En proceso', value: 4, color: '#F59E0B' },
      { name: 'Abandonados', value: 2, color: '#EF4444' },
    ]);
    expect(screen.getByText('Estado de esquemas (10 niños)')).toBeInTheDocument();
    expect(screen.getByText('Completos').closest('div')).toHaveTextContent(/Completos\s*4\s*\(40%\)/);
  });

  it('agrupa las dosis de los últimos 6 meses como % de pacientes', async () => {
    await mostrar();
    const esperado = [
      { mes: 'Ene', cov: 10 }, { mes: 'Feb', cov: 0 }, { mes: 'Mar', cov: 0 },
      { mes: 'Abr', cov: 10 }, { mes: 'May', cov: 20 }, { mes: 'Jun', cov: 30 },
    ];
    expect(grafico('bar-chart', 0)).toEqual(esperado);
    expect(grafico('line-chart')).toEqual(esperado.map(({ mes, cov }) => ({ mes, pct: cov })));
  });

  it('calcula las dosis vencidas por vacuna', async () => {
    await mostrar();
    expect(grafico('bar-chart', 2)).toEqual([{ name: 'BCG', n: 1 }, { name: 'Rotavirus', n: 1 }]);
  });

  it('el botón Actualizar vuelve a cargar los datos', async () => {
    const user = userEvent.setup();
    await mostrar();
    const antes = supa.from.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Actualizar/ }));
    await screen.findByText('Resumen general');
    expect(supa.from.mock.calls.length).toBeGreaterThan(antes);
  });

  it('sin sesión muestra todo en cero', async () => {
    setupSupabase(tablas(), null);
    render(<IndicatorsView />);
    await screen.findByText('Resumen general');
    expect(kpi('Niños registrados')).toHaveTextContent('0');
    expect(supa.from).not.toHaveBeenCalled();
  });

  it('si falla la carga registra el error y sigue mostrando la pantalla', async () => {
    setupSupabase(tablas());
    supa.auth.getSession.mockRejectedValueOnce(new Error('sin red'));
    render(<IndicatorsView />);
    await screen.findByText('Resumen general');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('IndicatorsView – detalle por vacuna', () => {
  it('lista las vacunas ordenadas por cobertura', async () => {
    await mostrar();
    expect(grafico('bar-chart', 1).map((v: any) => v.name)).toEqual(['BCG', 'Rotavirus', 'Hepatitis B']);

    const bcg = within(filaTabla('BCG')).getAllByRole('cell').map((c) => c.textContent);
    expect(bcg).toEqual(['BCG', '2', '10', '3', '30%', 'Crítica', '+100%']);
    const rota = within(filaTabla('Rotavirus')).getAllByRole('cell').map((c) => c.textContent);
    expect(rota[3]).toBe('2');
    expect(rota[6]).toBe('+0%');
  });

  it('muestra tendencia negativa cuando baja el mes anterior', async () => {
    await mostrar(tablas({
      dosis_aplicadas: {
        data: [
          { id_paciente: 'a', fecha_aplicacion: f(2026, 6, 1), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('Polio', '1ra') },
          { id_paciente: 'b', fecha_aplicacion: f(2026, 4, 20), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('Polio', '1ra') },
          { id_paciente: 'c', fecha_aplicacion: f(2026, 4, 25), fecha_vencimiento_proxima: null, cat_vacunas_oficiales: vac('Polio', '1ra') },
        ],
      },
    }));
    expect(within(filaTabla('Polio')).getByText('-50%')).toBeInTheDocument();
  });

  describe('pestañas por nivel de cobertura', () => {
    const pacs = (n: number, v: string) =>
      Array.from({ length: n }, (_, i) => ({
        id_paciente: `${v}-${i}`, fecha_aplicacion: f(2026, 6, 1), fecha_vencimiento_proxima: null,
        cat_vacunas_oficiales: vac(v, '1ra'),
      }));
    const datos = () => tablas({ dosis_aplicadas: { data: [...pacs(9, 'V90'), ...pacs(8, 'V80'), ...pacs(3, 'V30')] } });
    const visibles = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent);

    it('muestra todas por defecto con su estado', async () => {
      await mostrar(datos());
      expect(visibles()).toEqual(['V90', 'V80', 'V30']);
      expect(within(filaTabla('V90')).getByText('Óptima')).toBeInTheDocument();
      expect(within(filaTabla('V80')).getByText('En riesgo')).toBeInTheDocument();
      expect(within(filaTabla('V30')).getByText('Crítica')).toBeInTheDocument();
    });

    it.each([
      ['Cobertura alta', ['V90']],
      ['Cobertura baja', ['V80']],
      ['Crítica', ['V30']],
      ['Todas', ['V90', 'V80', 'V30']],
    ])('"%s"', async (pestana, esperado) => {
      const user = userEvent.setup();
      await mostrar(datos());
      await user.click(screen.getByRole('button', { name: pestana }));
      expect(visibles()).toEqual(esperado);
    });

    it('avisa si una categoría no tiene vacunas', async () => {
      const user = userEvent.setup();
      await mostrar(tablas({ dosis_aplicadas: { data: pacs(3, 'V30') } }));
      await user.click(screen.getByRole('button', { name: 'Cobertura alta' }));
      expect(screen.getByText('No hay vacunas en esta categoría.')).toBeInTheDocument();
    });
  });

  it('limita la cobertura al 100%', async () => {
    await mostrar(tablas({ pacientes: { count: 1 } }));
    expect(grafico('bar-chart', 1).every((v: any) => v.cov <= 100)).toBe(true);
  });
});

describe('IndicatorsView – alertas epidemiológicas', () => {
  it('muestra el total y las alertas con su nivel', async () => {
    await mostrar();
    expect(screen.getByText('Alertas epidemiológicas (3)')).toBeInTheDocument();
    expect(screen.getByText(/Riesgo alto de sarampión — Brote en Cercado/)).toBeInTheDocument();
    expect(screen.getByText('Crítica', { selector: 'span.rounded-full.bg-white' })).toBeInTheDocument();
    expect(screen.getByText('Alerta')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('recorta el resumen a 100 caracteres con puntos suspensivos', async () => {
    await mostrar();
    expect(screen.getByText(`Dengue — ${'x'.repeat(100)}…`)).toBeInTheDocument();
  });

  it('tolera alertas sin resumen', async () => {
    await mostrar();
    expect(screen.getByText('Aviso —')).toBeInTheDocument();
  });

  it('consulta solo alertas activas, las 5 más recientes', async () => {
    await mostrar();
    const b = supa.builders.alertas_epidemiologicas_ia;
    expect(b.eq).toHaveBeenCalledWith('activa', true);
    expect(b.limit).toHaveBeenCalledWith(5);
  });
});

describe('IndicatorsView – sin datos', () => {
  const vacio = () => tablas({
    pacientes: { count: 0 }, dosis_aplicadas: { data: [] }, alertas_epidemiologicas_ia: { data: [], count: 0 },
  });

  it('muestra los mensajes vacíos de cada sección', async () => {
    await mostrar(vacio());
    [
      'Sin dosis registradas en los últimos 6 meses',
      'No hay dosis registradas en el catálogo',
      'No hay dosis registradas aún.',
      'Sin dosis vencidas registradas',
      'No hay alertas epidemiológicas activas en el sistema.',
      'Sin datos históricos',
    ].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('los porcentajes se reemplazan por "—" cuando no hay pacientes', async () => {
    await mostrar(vacio());
    expect(kpi('Esquemas completos')).toHaveTextContent('—');
    expect(kpi('Abandono')).toHaveTextContent('—');
  });
});
