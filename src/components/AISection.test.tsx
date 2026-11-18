import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => {
  const marker = () => {
    const o: any = {};
    o.addTo = vi.fn(() => o);
    o.bindPopup = vi.fn(() => o);
    o.remove = vi.fn();
    return o;
  };
  const map: any = { remove: vi.fn(), flyTo: vi.fn() };
  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => marker()),
  };
  return { L, map };
});
vi.mock('leaflet', () => ({ default: h.L }));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import AISection from './AISection';

const IA = { risk: 'moderado', temperature: 12, rain: true, title: 'Frío con lluvia', message: 'Abrígate y vacuna a tiempo.' };

const geo = (impl: unknown) =>
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: impl });
const geoOk = (latitude: number, longitude: number) =>
  geo({ getCurrentPosition: (ok: any) => ok({ coords: { latitude, longitude } }) });
const geoDenegada = () =>
  geo({ getCurrentPosition: (_ok: any, ko: any) => ko(new Error('denied')) });

beforeEach(() => {
  vi.clearAllMocks();
  setupSupabase();
  supa.functions.invoke.mockResolvedValue({ data: IA, error: null });
});
afterEach(() => { geo(undefined); });

const verificar = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Verificar alertas en mi zona/ }));
};

describe('AISection – contenido', () => {
  it('muestra encabezado, señales y leyenda del mapa', () => {
    const { container } = render(<AISection />);
    expect(container.querySelector('section')).toHaveAttribute('id', 'ia');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alertas epidemiológicas en tu zona');
    ['Abandono de esquemas', 'Datos epidemiológicos', 'Clima regional'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
    ['Riesgo Alto', 'Riesgo Moderado', 'Sin Alertas'].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });

  it('crea el mapa con un marcador por ciudad y popups informativos', () => {
    render(<AISection />);
    expect(h.L.map).toHaveBeenCalledTimes(1);
    expect(h.L.circleMarker).toHaveBeenCalledTimes(10);
    const popups = h.L.circleMarker.mock.results.map((r: any) => r.value.bindPopup.mock.calls[0][0] as string);
    expect(popups.some((p) => p.includes('La Paz') && p.includes('Riesgo Alto'))).toBe(true);
    expect(popups.some((p) => p.includes('Tarija') && p.includes('Sin Alertas'))).toBe(true);
  });

  it('colorea y dimensiona los marcadores según el riesgo', () => {
    render(<AISection />);
    const opciones = h.L.circleMarker.mock.calls.map((c: any[]) => c[1]);
    expect(opciones.filter((o: any) => o.color === '#ef4444' && o.radius === 11)).toHaveLength(5); // altos
    expect(opciones.filter((o: any) => o.color === '#f59e0b' && o.radius === 8)).toHaveLength(4);  // moderados
    expect(opciones.filter((o: any) => o.color === '#10b981' && o.radius === 6)).toHaveLength(1);  // bajo
  });

  it('destruye el mapa al desmontar', () => {
    const { unmount } = render(<AISection />);
    unmount();
    expect(h.map.remove).toHaveBeenCalled();
  });

  it('el botón empieza listo para verificar', () => {
    render(<AISection />);
    expect(screen.getByRole('button', { name: /Verificar alertas en mi zona/ })).toBeEnabled();
  });
});

describe('AISection – verificación de zona', () => {
  it('con ubicación e IA disponibles muestra el análisis completo', async () => {
    geoOk(-17.39, -66.16); // Cochabamba
    render(<AISection />);
    await verificar();

    expect(await screen.findByRole('button', { name: /Análisis completado/ })).toBeDisabled();
    expect(supa.functions.invoke).toHaveBeenCalledWith('health-advisor', { body: { lat: -17.39, lng: -66.16 } });
    expect(screen.getByText('Cochabamba')).toBeInTheDocument();
    expect(screen.getByText('12°C')).toBeInTheDocument();
    expect(screen.getByText('Con lluvia')).toBeInTheDocument();
    expect(screen.getByText('Frío con lluvia')).toBeInTheDocument();
    expect(screen.getByText('Abrígate y vacuna a tiempo.')).toBeInTheDocument();
    expect(screen.getByText('Generado con IA en tiempo real')).toBeInTheDocument();
    expect(screen.queryByText(/Ubicación no disponible/)).not.toBeInTheDocument();
  });

  it('centra el mapa en la ubicación del usuario', async () => {
    geoOk(-17.39, -66.16);
    render(<AISection />);
    await verificar();
    await waitFor(() => expect(h.map.flyTo).toHaveBeenCalledWith([-17.39, -66.16], 10, { duration: 1.5 }));
  });

  it('elige la ciudad de referencia más cercana', async () => {
    geoOk(-19.5, -65.7); // cerca de Potosí
    render(<AISection />);
    await verificar();
    expect(await screen.findByText('Potosí')).toBeInTheDocument();
  });

  it('indica "Sin lluvia" cuando la IA reporta tiempo seco', async () => {
    supa.functions.invoke.mockResolvedValue({ data: { ...IA, rain: false }, error: null });
    geoOk(-17.39, -66.16);
    render(<AISection />);
    await verificar();
    expect(await screen.findByText('Sin lluvia')).toBeInTheDocument();
  });

  it.each([
    ['la función devuelve error', { data: null, error: new Error('500') }],
    ['la respuesta trae un error', { data: { error: 'sin cuota' }, error: null }],
  ])('si %s usa el mensaje local de la ciudad', async (_caso, respuesta) => {
    supa.functions.invoke.mockResolvedValue(respuesta);
    geoOk(-17.39, -66.16);
    render(<AISection />);
    await verificar();

    expect(await screen.findByText(/Vigilancia activa por enfermedades de transmisión hídrica/)).toBeInTheDocument();
    expect(screen.queryByText('Generado con IA en tiempo real')).not.toBeInTheDocument();
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
  });

  it('si el usuario niega la ubicación usa La Paz como referencia', async () => {
    geoDenegada();
    render(<AISection />);
    await verificar();

    expect(await screen.findByText('La Paz')).toBeInTheDocument();
    expect(screen.getByText(/Ubicación no disponible — usando La Paz como referencia/)).toBeInTheDocument();
    expect(supa.functions.invoke).toHaveBeenCalledWith('health-advisor', { body: { lat: -16.5, lng: -68.15 } });
    expect(h.map.flyTo).not.toHaveBeenCalled();
  });

  it('si el navegador no soporta geolocalización también usa La Paz', async () => {
    geo(undefined);
    render(<AISection />);
    await verificar();
    expect(await screen.findByText(/usando La Paz como referencia/)).toBeInTheDocument();
  });

  it('muestra "Obteniendo ubicación…" mientras espera al navegador', async () => {
    geo({ getCurrentPosition: vi.fn() }); // nunca responde
    render(<AISection />);
    await verificar();
    expect(screen.getByRole('button', { name: /Obteniendo ubicación/ })).toBeDisabled();
  });

  it('muestra "Analizando con IA…" mientras espera la respuesta', async () => {
    let resolver!: (v: unknown) => void;
    supa.functions.invoke.mockReturnValue(new Promise((r) => { resolver = r; }));
    geoOk(-17.39, -66.16);
    render(<AISection />);
    await verificar();

    expect(await screen.findByRole('button', { name: /Analizando con IA/ })).toBeDisabled();
    resolver({ data: IA, error: null });
    expect(await screen.findByRole('button', { name: /Análisis completado/ })).toBeInTheDocument();
  });
});
