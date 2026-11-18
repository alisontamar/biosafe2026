import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

const LABELS = ['Inicio', 'Cómo Funciona', 'Inteligencia Artificial', 'Red BioSafe'];

describe('Header', () => {
  it('muestra el logo y los enlaces de navegación con su ancla', () => {
    render(<Header />);
    LABELS.forEach((l) => expect(screen.getByText(l)).toBeInTheDocument());
    expect(screen.getByText('Cómo Funciona')).toHaveAttribute('href', '#como-funciona');
    expect(screen.getByText('Red BioSafe')).toHaveAttribute('href', '#red');
  });

  it('el menú móvil está cerrado al inicio', () => {
    render(<Header />);
    expect(screen.queryByText('Módulo Educativo para Padres')).not.toBeInTheDocument();
  });

  it('abre el menú móvil, bloquea el scroll y lo restaura al cerrar', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Abrir menú'));

    expect(screen.getByText('Módulo Educativo para Padres')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByLabelText('Abrir menú'));
    expect(screen.queryByText('Módulo Educativo para Padres')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('cierra el menú móvil al elegir un enlace', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Abrir menú'));

    const links = screen.getAllByText('Red BioSafe'); // [desktop, móvil]
    expect(links).toHaveLength(2);
    await user.click(links[1]);

    expect(screen.queryByText('Módulo Educativo para Padres')).not.toBeInTheDocument();
  });

  it('marca como activo el enlace de escritorio clicado', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const link = screen.getByText('Inicio');
    expect(link).not.toHaveClass('active');
    await user.click(link);
    expect(link).toHaveClass('active');
  });

  it('restaura el scroll del body al desmontar con el menú abierto', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Header />);
    await user.click(screen.getByLabelText('Abrir menú'));
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
