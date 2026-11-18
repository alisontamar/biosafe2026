import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('./components/Header', () => ({ default: () => <div>HEADER</div> }));
vi.mock('./components/Hero', () => ({ default: () => <div>HERO</div> }));
vi.mock('./components/HowItWorks', () => ({ default: () => <div>HOWITWORKS</div> }));
vi.mock('./components/AISection', () => ({ default: () => <div>AISECTION</div> }));
vi.mock('./components/Network', () => ({ default: () => <div>NETWORK</div> }));
vi.mock('./components/Footer', () => ({ default: () => <div>FOOTER</div> }));
vi.mock('./components/AdminDashboard', () => ({ default: () => <div>ADMIN</div> }));

import App from './App';

afterEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  it('muestra la página pública por defecto', () => {
    render(<App />);
    ['HEADER', 'HERO', 'HOWITWORKS', 'AISECTION', 'NETWORK', 'FOOTER'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });

  it('muestra el panel admin si la URL ya trae #admin', () => {
    window.location.hash = '#admin';
    render(<App />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.queryByText('HERO')).not.toBeInTheDocument();
  });

  it('cambia de pantalla cuando cambia el hash', async () => {
    render(<App />);
    act(() => { window.location.hash = '#admin'; });
    await waitFor(() => expect(screen.getByText('ADMIN')).toBeInTheDocument());

    act(() => { window.location.hash = ''; });
    await waitFor(() => expect(screen.getByText('HERO')).toBeInTheDocument());
  });
});
