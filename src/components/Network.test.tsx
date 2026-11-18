import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Network from './Network';

const PUBLICOS: [string, string, string][] = [
  ['Para Padres y Tutores', 'Toda la familia, en un solo lugar', 'Descargar la App'],
  ['Para Personal de Salud', 'Registro de dosis en segundos', 'Acceder al Portal'],
  ['Para Establecimientos', 'Gestión centralizada', 'Solicitar acceso'],
];

describe('Network', () => {
  it('tiene el ancla "red" y el encabezado', () => {
    const { container } = render(<Network />);
    expect(container.querySelector('section')).toHaveAttribute('id', 'red');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('BioSafe para todos');
  });

  it.each(PUBLICOS)('tarjeta "%s"', (label, tagline, cta) => {
    render(<Network />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(tagline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: cta })).toHaveAttribute('href', '#footer');
  });

  it('cada tarjeta lista 4 características', () => {
    const { container } = render(<Network />);
    expect(container.querySelectorAll('ul')).toHaveLength(3);
    container.querySelectorAll('ul').forEach((ul) => expect(ul.querySelectorAll('li')).toHaveLength(4));
  });

  it('muestra el banner de descarga con las tiendas "próximamente"', () => {
    render(<Network />);
    expect(screen.getByText('Descarga BioSafe')).toBeInTheDocument();
    expect(screen.getByText('Google Play — Próximamente')).toBeInTheDocument();
    expect(screen.getByText('App Store — Próximamente')).toBeInTheDocument();
  });

  it('el enlace de la tarjeta anima su separación al pasar el mouse', () => {
    render(<Network />);
    const link = screen.getByRole('link', { name: 'Descargar la App' });
    fireEvent.mouseEnter(link);
    expect(link.style.gap).toBe('0.7rem');
    fireEvent.mouseLeave(link);
    expect(link.style.gap).toBe('0.4rem');
  });

  it('la tarjeta se eleva al pasar el mouse y vuelve al salir', () => {
    render(<Network />);
    const card = screen.getByRole('link', { name: 'Descargar la App' }).parentElement!.parentElement as HTMLElement;
    fireEvent.mouseEnter(card);
    expect(card.style.transform).toBe('translateY(-4px)');
    fireEvent.mouseLeave(card);
    expect(card.style.transform).toBe('translateY(0)');
  });
});
