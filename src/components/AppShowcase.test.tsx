import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppShowcase from './AppShowcase';

describe('AppShowcase', () => {
  it('tiene el ancla "app" y muestra las 10 pantallas', () => {
    const { container } = render(<AppShowcase />);
    expect(container.querySelector('section')).toHaveAttribute('id', 'app');
    expect(screen.getAllByRole('img')).toHaveLength(10);
  });

  it('los botones desplazan el carrusel', () => {
    render(<AppShowcase />);
    const track = screen.getByTestId('showcase-track');
    const scrollBy = vi.fn();
    track.scrollBy = scrollBy;
    fireEvent.click(screen.getByLabelText('Siguiente'));
    fireEvent.click(screen.getByLabelText('Anterior'));
    expect(scrollBy).toHaveBeenNthCalledWith(1, { left: 320, behavior: 'smooth' });
    expect(scrollBy).toHaveBeenNthCalledWith(2, { left: -320, behavior: 'smooth' });
  });
});
