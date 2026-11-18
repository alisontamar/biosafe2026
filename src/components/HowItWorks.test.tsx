import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from './HowItWorks';

const FUNCIONES: [string, string[]][] = [
  ['Carnet QR digital', ['Sin papeles que perder', 'Verificado y seguro', 'Funciona en todo el país']],
  ['Esquema PAI Bolivia completo', ['15+ vacunas oficiales', 'Historial con fecha y lote', 'Pendientes resaltadas por edad']],
  ['Alertas y recordatorios', ['Recordatorios automáticos', 'Alertas epidemiológicas', 'Notificaciones a tiempo']],
  ['Guías para padres', ['Qué esperar post-vacuna', 'Cómo tratar efectos leves', 'Señales de alerta']],
];

describe('HowItWorks', () => {
  it('tiene el ancla "que-es" y el encabezado', () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector('section')).toHaveAttribute('id', 'que-es');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('¿Qué es BioSafe?');
  });

  it('presenta las 4 funciones principales', () => {
    render(<HowItWorks />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    FUNCIONES.forEach(([titulo]) => expect(screen.getByRole('heading', { level: 3, name: titulo })).toBeInTheDocument());
  });

  it.each(FUNCIONES)('"%s" muestra sus etiquetas', (_titulo, pills) => {
    render(<HowItWorks />);
    pills.forEach((p) => expect(screen.getByText(p)).toBeInTheDocument());
  });
});
