import { describe, it, expect } from 'vitest';
import { normalizar, ubicar, LUGARES } from './geoBolivia';

describe('normalizar', () => {
  it('quita tildes, pasa a minúsculas y recorta espacios', () => {
    expect(normalizar('  Potosí ')).toBe('potosi');
  });

  it('devuelve cadena vacía para null/undefined', () => {
    expect(normalizar(null)).toBe('');
    expect(normalizar(undefined)).toBe('');
  });
});

describe('ubicar', () => {
  it('usa latitud/longitud cuando vienen en la alerta', () => {
    const r = ubicar({ latitud: -16.5, longitud: -68.1, municipio: 'El Alto', departamento: 'La Paz' });
    expect(r).toEqual({ lat: -16.5, lng: -68.1, lugar: 'El Alto - La Paz' });
  });

  it('acepta alias lat/lng', () => {
    expect(ubicar({ lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2, lugar: 'Ubicación' });
  });

  it('busca por nombre de lugar si no hay coordenadas', () => {
    const r = ubicar({ departamento: 'Tarija' });
    const tarija = LUGARES.find((l) => l.nombre === 'Tarija')!;
    expect(r).toEqual({ lat: tarija.lat, lng: tarija.lng, lugar: 'Tarija' });
  });

  it('ignora tildes y mayúsculas al buscar', () => {
    expect(ubicar({ zona: 'POTOSÍ' })?.lugar).toBe('Potosi');
  });

  it('encuentra el lugar dentro de un texto largo (título/resumen)', () => {
    expect(ubicar({ titulo: 'Brote de dengue en Riberalta' })?.lugar).toBe('Riberalta');
  });

  it('prioriza municipio sobre departamento', () => {
    expect(ubicar({ municipio: 'El Alto', departamento: 'La Paz' })?.lugar).toBe('El Alto');
  });

  it('devuelve null si no reconoce ninguna ubicación', () => {
    expect(ubicar({ zona: 'Narnia' })).toBeNull();
    expect(ubicar({})).toBeNull();
  });

  it('ignora coordenadas no numéricas y cae a búsqueda por nombre', () => {
    expect(ubicar({ latitud: 'abc', longitud: 'xyz', municipio: 'Sucre' })?.lugar).toBe('Sucre');
  });
});
