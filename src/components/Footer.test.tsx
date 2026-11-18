import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./LoginModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div>MODAL ABIERTO<button onClick={onClose}>cerrar-modal</button></div> : null,
}));

import Footer from './Footer';

describe('Footer', () => {
  it('muestra marca, contacto y copyright', () => {
    render(<Footer />);
    expect(screen.getByText('Cochabamba · Bolivia')).toBeInTheDocument();
    expect(screen.getByText('aligomalva@gmail.com')).toBeInTheDocument();
    expect(screen.getByText(/© 2026 BioSafe Technologies/)).toBeInTheDocument();
    expect(screen.getByText('Políticas de Privacidad')).toBeInTheDocument();
    expect(screen.getByText('Términos del Servicio')).toBeInTheDocument();
  });

  it('el modal de login empieza cerrado', () => {
    render(<Footer />);
    expect(screen.queryByText('MODAL ABIERTO')).not.toBeInTheDocument();
  });

  it('abre y cierra el modal con el botón "Entrar a BioSafe"', async () => {
    const user = userEvent.setup();
    render(<Footer />);
    await user.click(screen.getByRole('button', { name: /Entrar a BioSafe/ }));
    expect(screen.getByText('MODAL ABIERTO')).toBeInTheDocument();

    await user.click(screen.getByText('cerrar-modal'));
    expect(screen.queryByText('MODAL ABIERTO')).not.toBeInTheDocument();
  });
});
