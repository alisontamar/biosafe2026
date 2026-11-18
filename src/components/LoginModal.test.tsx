import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => (await import('../test/supabaseMock')).moduleMock);

import { setupSupabase, supa } from '../test/supabaseMock';
import LoginModal from './LoginModal';

const abrirLogin = async (user: ReturnType<typeof userEvent.setup>, onClose = vi.fn()) => {
  render(<LoginModal isOpen onClose={onClose} />);
  await user.click(screen.getByText('Profesional de salud'));
  return onClose;
};

beforeEach(() => { setupSupabase(); });
afterEach(() => { window.location.hash = ''; });

describe('LoginModal', () => {
  it('no renderiza nada si está cerrado', () => {
    const { container } = render(<LoginModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra primero las opciones de acceso', () => {
    render(<LoginModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Para padres y tutores')).toBeInTheDocument();
    expect(screen.getByText('Profesional de salud')).toBeInTheDocument();
    expect(screen.getByText(/Descargar app móvil/)).toBeInTheDocument();
  });

  it('pasa al formulario de acceso profesional y puede volver', async () => {
    const user = userEvent.setup();
    await abrirLogin(user);
    expect(screen.getByText('Acceso Profesional')).toBeInTheDocument();

    await user.click(screen.getByText('Volver'));
    expect(screen.getByText('Profesional de salud')).toBeInTheDocument();
  });

  it('valida campos vacíos sin llamar a Supabase', async () => {
    const user = userEvent.setup();
    await abrirLogin(user);
    await user.click(screen.getByRole('button', { name: /Ingresar a BioSafe/ }));

    expect(screen.getByText('Por favor completa todos los campos.')).toBeInTheDocument();
    expect(supa.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('alterna la visibilidad de la contraseña', async () => {
    const user = userEvent.setup();
    await abrirLogin(user);
    const pass = screen.getByPlaceholderText('••••••••');
    expect(pass).toHaveAttribute('type', 'password');

    const toggle = pass.parentElement!.querySelector('button')!;
    await user.click(toggle);
    expect(pass).toHaveAttribute('type', 'text');
    await user.click(toggle);
    expect(pass).toHaveAttribute('type', 'password');
  });

  it('inicia sesión, navega a #admin y cierra el modal', async () => {
    const user = userEvent.setup();
    const onClose = await abrirLogin(user);
    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'doc@biosafe.bo');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123');
    await user.click(screen.getByRole('button', { name: /Ingresar a BioSafe/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(supa.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'doc@biosafe.bo', password: 'secreto123' });
    expect(window.location.hash).toBe('#admin');
  });

  it('también envía el formulario con Enter', async () => {
    const user = userEvent.setup();
    await abrirLogin(user);
    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'doc@biosafe.bo');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123{Enter}');
    await waitFor(() => expect(supa.auth.signInWithPassword).toHaveBeenCalledTimes(1));
  });

  it('muestra error con credenciales incorrectas y no navega', async () => {
    supa.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: new Error('bad') });
    const user = userEvent.setup();
    const onClose = await abrirLogin(user);
    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'x@y.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mala');
    await user.click(screen.getByRole('button', { name: /Ingresar a BioSafe/ }));

    expect(await screen.findByText('Credenciales incorrectas. Intenta de nuevo.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('cierra al hacer clic en el fondo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<LoginModal isOpen onClose={onClose} />);
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
