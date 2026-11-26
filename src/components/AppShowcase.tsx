import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const screens = [
  { img: 'carnet', title: 'Tu carnet digital', text: 'El historial de vacunas de toda tu familia, siempre contigo.' },
  { img: 'alertas-ia', title: 'Alertas inteligentes', text: 'Nuestra IA te avisa antes de que algo represente un riesgo.' },
  { img: 'validacion', title: 'Validación QR segura', text: 'El personal médico escanea y registra en segundos.' },
  { img: 'inicio', title: 'Inicio familiar', text: 'Estado de vacunas y recomendaciones del día en un vistazo.' },
  { img: 'expediente', title: 'Expediente de cada integrante', text: 'Vacunas pendientes y aplicadas, con su carnet digital o físico.' },
  { img: 'qr', title: 'Código QR personal', text: 'Preséntalo al personal médico y accede al expediente al instante.' },
  { img: 'educacion', title: 'Educación', text: 'Guías claras para el embarazo y los primeros pasos del recién nacido.' },
  { img: 'alertas-mapa', title: 'Alertas en el mapa', text: 'Brotes de los últimos 7 días ubicados por departamento.' },
  { img: 'alertas-lista', title: 'Alertas del día', text: 'Información oficial, clasificada por nivel de riesgo.' },
  { img: 'ubicacion', title: 'Tu privacidad primero', text: 'Usamos tu ciudad solo mientras la app está abierta.' },
  { img: 'admin', title: 'Panel de administración', text: 'Centros, usuarios y estadísticas bajo control.' },
];

export default function AppShowcase() {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <section
      id="app"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5rem 0 4.5rem',
        background: 'linear-gradient(160deg, #8A63A5 0%, #7A5496 55%, #664482 100%)',
      }}
    >
      {/* Formas suaves de fondo */}
      <div aria-hidden="true" style={{ position: 'absolute', top: -120, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: -140, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E6D9F0', marginBottom: '0.75rem' }}>
            Conoce la app
          </span>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 1rem' }}>
            Cuidar a tu familia, <span style={{ color: '#E6D9F0' }}>más simple</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 300, fontSize: '0.95rem', maxWidth: 480, margin: '0 auto' }}>
            Desliza para recorrer las pantallas de BioSafe, pensadas para familias y para el personal de salud.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={track}
          data-testid="showcase-track"
          style={{
            display: 'flex',
            gap: '1.75rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '0.5rem max(1.5rem, calc(50% - 550px)) 1.5rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {screens.map((s) => (
            <figure key={s.img} style={{ flex: '0 0 auto', width: 240, margin: 0, scrollSnapAlign: 'center' }}>
              <div
                style={{
                  borderRadius: 38,
                  padding: 8,
                  background: '#2E1B3F',
                  boxShadow: '0 24px 50px rgba(30,15,45,0.35)',
                }}
              >
                <img
                  src={`/screens/${s.img}.jpg`}
                  alt={`Pantalla de BioSafe: ${s.title}`}
                  loading="lazy"
                  draggable={false}
                  style={{ display: 'block', width: '100%', aspectRatio: '560 / 1152', objectFit: 'cover', borderRadius: 30, background: '#fff' }}
                />
              </div>
              <figcaption style={{ textAlign: 'center', marginTop: '1.1rem', padding: '0 0.5rem' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{s.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', lineHeight: 1.45 }}>{s.text}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" aria-label="Anterior" onClick={() => scroll(-1)} style={navBtn}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Siguiente" onClick={() => scroll(1)} style={navBtn}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

const navBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
