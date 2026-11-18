import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { StatCard } from './StatCard';

const base = { icon: Activity, title: 'Casos activos', value: '128', detail: '+5% esta semana' };

describe('StatCard', () => {
  it('muestra título, valor y detalle', () => {
    render(<StatCard {...base} color="green" />);
    expect(screen.getByText('Casos activos')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('+5% esta semana')).toBeInTheDocument();
  });

  it('usa estilo de alerta en el detalle cuando color es red', () => {
    render(<StatCard {...base} color="red" />);
    expect(screen.getByText('+5% esta semana')).toHaveClass('text-[#A280B9]');
  });

  it('usa estilo positivo en el detalle para otros colores', () => {
    render(<StatCard {...base} color="blue" />);
    expect(screen.getByText('+5% esta semana')).toHaveClass('text-emerald-500');
  });
});
