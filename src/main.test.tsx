import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ render: vi.fn(), createRoot: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: h.createRoot.mockImplementation(() => ({ render: h.render })) }));
vi.mock('./App.tsx', () => ({ default: () => <div>APP</div> }));
vi.mock('./index.css', () => ({}));

beforeEach(() => {
  vi.resetModules();
  h.render.mockClear();
  h.createRoot.mockClear();
  document.body.innerHTML = '<div id="root"></div>';
});

describe('main', () => {
  it('monta la aplicación en #root dentro de StrictMode', async () => {
    await import('./main');
    expect(h.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(h.render).toHaveBeenCalledTimes(1);

    const arbol = h.render.mock.calls[0][0];
    expect(String(arbol.type)).toContain('react.strict_mode');
    expect(arbol.props.children.type()).toEqual(expect.objectContaining({ props: { children: 'APP' } }));
  });
});
