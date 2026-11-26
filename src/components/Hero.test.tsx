import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Hero from './Hero';

afterEach(() => { vi.useRealTimers(); });

const normaliza = (s: string | null) => (s ?? '').replace(/ /g, ' ');

describe('Hero', () => {
  it('es la sección de inicio', () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('section')).toHaveAttribute('id', 'inicio');
  });

  it('muestra el título completo en tres líneas', () => {
    render(<Hero />);
    const h1 = screen.getByRole('heading', { level: 1 });
    const texto = normaliza(h1.textContent);
    expect(texto).toContain('El carnet digital');
    expect(texto).toContain('de tu familia.');
    expect(texto).toContain('Siempre contigo.');
  });

  it('describe el producto', () => {
    render(<Hero />);
    expect(screen.getByText(/BioSafe digitaliza el carnet de vacunación del PAI Bolivia/)).toBeInTheDocument();
  });

  it('tiene los dos llamados a la acción con su ancla', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /Descarga la App/ })).toHaveAttribute('href', '#red');
    expect(screen.getByRole('link', { name: /Ver IA Predictiva/ })).toHaveAttribute('href', '#ia');
  });

  it('lista las características principales', () => {
    render(<Hero />);
    ['Código QR por persona', 'Alertas epidemiológicas', 'Guías para padres'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
  });

  it('muestra las tres ilustraciones con texto alternativo', () => {
    render(<Hero />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    imgs.forEach((img) => expect(img.getAttribute('alt')).not.toBe(''));
  });

  it('rota las ilustraciones solo y permite elegir una', () => {
    vi.useFakeTimers();
    render(<Hero />);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0].style.opacity).toBe('1');
    act(() => { vi.advanceTimersByTime(5000); });
    expect(imgs[1].style.opacity).toBe('1');
    fireEvent.click(screen.getByLabelText('Ilustración 3'));
    expect(imgs[2].style.opacity).toBe('1');
  });

  it('las letras reaccionan al hover solo cuando terminó la animación', () => {
    vi.useFakeTimers();
    render(<Hero />);
    const letra = screen.getByText('E');

    fireEvent.mouseEnter(letra);
    expect(letra.style.transform).toBe('none'); // aún animando

    act(() => { vi.advanceTimersByTime(5000); });
    fireEvent.mouseEnter(letra);
    expect(letra.style.transform).toContain('translateY(-8px)');

    fireEvent.mouseLeave(letra);
    expect(letra.style.transform).toBe('none');
  });

  it('limpia los temporizadores al desmontar', () => {
    vi.useFakeTimers();
    const { unmount } = render(<Hero />);
    unmount();
    expect(() => act(() => { vi.advanceTimersByTime(5000); })).not.toThrow();
  });
});
