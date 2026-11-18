import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const h = vi.hoisted(() => {
  const layer = () => {
    const o: any = {};
    o.addTo = vi.fn(() => o);
    o.bindPopup = vi.fn(() => o);
    o.clearLayers = vi.fn();
    return o;
  };
  const map: any = { fitBounds: vi.fn(), remove: vi.fn() };
  const bounds: any = { pad: vi.fn(() => bounds) };
  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => layer()),
    layerGroup: vi.fn(() => layer()),
    circle: vi.fn(() => layer()),
    circleMarker: vi.fn(() => layer()),
    latLngBounds: vi.fn(() => bounds),
  };
  return { L, map, bounds };
});
vi.mock('leaflet', () => ({ default: h.L }));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
// AlertsHeatMap importa AlertsView, que importa el cliente de Supabase: se simula para no necesitar claves.
vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import AlertsHeatMap from './AlertsHeatMap';

beforeEach(() => { vi.clearAllMocks(); });

const cercado = { titulo: 'Sarampión', nivel: 'alto', municipio: 'Cercado' };
const cercado2 = { titulo: 'Rubéola', nivel: 'bajo', municipio: 'Cercado' };
const tarija = { titulo: 'Dengue', nivel: 'medio', departamento: 'Tarija' };
const nowhere = { titulo: 'Misterio', zona: 'Narnia' };

describe('AlertsHeatMap', () => {
  it('muestra título y leyenda', () => {
    render(<AlertsHeatMap alertas={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('Mapa de calor epidemiológico')).toBeInTheDocument();
    ['alto', 'medio', 'bajo'].forEach((n) => expect(screen.getByText(n)).toBeInTheDocument());
  });

  it('crea el mapa centrado en Bolivia y lo destruye al desmontar', () => {
    const { unmount } = render(<AlertsHeatMap alertas={[]} onSelect={vi.fn()} />);
    expect(h.L.map).toHaveBeenCalledTimes(1);
    expect((h.L.map.mock.calls as any[][])[0][1]).toMatchObject({ center: [-16.8, -64.6], zoom: 5 });
    expect(h.L.tileLayer).toHaveBeenCalled();
    unmount();
    expect(h.map.remove).toHaveBeenCalled();
  });

  it('sin alertas no dibuja focos ni ajusta el zoom', () => {
    render(<AlertsHeatMap alertas={[]} onSelect={vi.fn()} />);
    expect(h.L.circleMarker).not.toHaveBeenCalled();
    expect(h.map.fitBounds).not.toHaveBeenCalled();
  });

  it('dibuja 3 anillos y un marcador por foco, y ajusta el encuadre', () => {
    render(<AlertsHeatMap alertas={[cercado, tarija]} onSelect={vi.fn()} />);
    expect(h.L.circleMarker).toHaveBeenCalledTimes(2);
    expect(h.L.circle).toHaveBeenCalledTimes(6);
    expect(h.map.fitBounds).toHaveBeenCalled();
  });

  it('agrupa alertas de la misma zona en un solo foco con el nivel más alto', () => {
    render(<AlertsHeatMap alertas={[cercado2, cercado]} onSelect={vi.fn()} />);
    expect(h.L.circleMarker).toHaveBeenCalledTimes(1);
    expect((h.L.circleMarker.mock.calls as any[][])[0][1]).toMatchObject({ fillColor: '#EF4444' }); // alto
  });

  it('avisa cuántas alertas no se pudieron ubicar', () => {
    render(<AlertsHeatMap alertas={[cercado, nowhere, nowhere]} onSelect={vi.fn()} />);
    expect(screen.getByText(/2 alerta\(s\) sin zona reconocible/)).toBeInTheDocument();
  });

  it('no muestra el aviso si todas se ubican', () => {
    render(<AlertsHeatMap alertas={[cercado]} onSelect={vi.fn()} />);
    expect(screen.queryByText(/sin zona reconocible/)).not.toBeInTheDocument();
  });

  it('el popup lista las alertas y al hacer clic llama a onSelect', () => {
    const onSelect = vi.fn();
    render(<AlertsHeatMap alertas={[cercado]} onSelect={onSelect} />);
    const popup: HTMLElement = h.L.circleMarker.mock.results[0].value.bindPopup.mock.calls[0][0];

    expect(popup.textContent).toContain('Cercado');
    expect(popup.textContent).toContain('1 alerta(s) activa(s)');
    const boton = popup.querySelector('button')!;
    expect(boton.textContent).toBe('Sarampión');
    boton.click();
    expect(onSelect).toHaveBeenCalledWith(cercado);
  });
});
