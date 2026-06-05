import { Users, Stethoscope, Building2, ArrowRight, Smartphone } from 'lucide-react';

const audiences = [
  {
    icon: Users,
    accent: '#726E97',
    bg: 'rgba(114,110,151,0.07)',
    label: 'Para Padres y Tutores',
    tagline: 'Toda la familia, en un solo lugar',
    description:
      'Registra a tus hijos, genera su carnet QR, recibe recordatorios antes de cada vacuna y consulta el historial completo cuando quieras.',
    features: ['Carnet QR digital', 'Historial del PAI Bolivia', 'Alertas y recordatorios', 'Guías post-vacuna'],
    cta: 'Descargar la App',
    ctaHref: '#footer',
  },
  {
    icon: Stethoscope,
    accent: '#7698B3',
    bg: 'rgba(118,152,179,0.07)',
    label: 'Para Personal de Salud',
    tagline: 'Registro de dosis en segundos',
    description:
      'Escanea el QR del paciente, accede a su expediente completo y registra la dosis del catálogo PAI Bolivia desde el portal web.',
    features: ['Scanner QR de pacientes', 'Registro de dosis', 'Expedientes con historial', 'Estadísticas del día'],
    cta: 'Acceder al Portal',
    ctaHref: '#footer',
  },
  {
    icon: Building2,
    accent: '#726E97',
    bg: 'rgba(114,110,151,0.07)',
    label: 'Para Establecimientos',
    tagline: 'Gestión centralizada',
    description:
      'Administra tu equipo de salud, crea usuarios con roles diferenciados y obtén estadísticas de cobertura de vacunación en tiempo real.',
    features: ['Gestión de personal', 'Estadísticas de cobertura', 'Alertas epidemiológicas', 'Reportes de vacunación'],
    cta: 'Solicitar acceso',
    ctaHref: '#footer',
  },
];

export default function Network() {
  return (
    <section id="red" style={{ padding: '5rem 1.5rem', background: '#f8f7fc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#7698B3',
              marginBottom: '0.75rem',
            }}
          >
            Ecosistema BioSafe
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
              fontWeight: 700,
              color: '#1a1a2e',
              lineHeight: 1.15,
              margin: '0 0 1rem',
            }}
          >
            BioSafe para{' '}
            <span style={{ color: '#726E97' }}>todos</span>
          </h2>
          <p
            style={{
              color: '#9ca3af',
              fontWeight: 300,
              fontSize: '0.95rem',
              maxWidth: 460,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Un solo sistema que conecta a las familias con los centros de salud y farmacias de Bolivia.
          </p>
        </div>

        {/* Audience cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
            marginBottom: '3rem',
          }}
        >
          {audiences.map(({ icon: Icon, accent, bg, label, tagline, description, features, cta, ctaHref }) => (
            <div
              key={label}
              style={{
                background: '#ffffff',
                borderRadius: 24,
                overflow: 'hidden',
                border: `1.5px solid ${accent}18`,
                transition: 'box-shadow 0.25s, transform 0.25s, border-color 0.25s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = `0 20px 48px -8px ${accent}28`;
                el.style.transform = 'translateY(-4px)';
                el.style.borderColor = accent + '44';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
                el.style.borderColor = accent + '18';
              }}
            >
              {/* Top band */}
              <div
                style={{
                  background: bg,
                  borderBottom: `1px solid ${accent}14`,
                  padding: '1.5rem 1.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: accent + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 500, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e', margin: 0, marginTop: 2 }}>
                    {tagline}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 300, color: '#6b7280', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
                  {description}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#374151' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={ctaHref}
                  style={{
                    marginTop: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: accent,
                    textDecoration: 'none',
                    transition: 'gap 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '0.7rem'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '0.4rem'; }}
                >
                  {cta}
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Download banner */}
        <div
          style={{
            borderRadius: 24,
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #726E97 0%, #5d5a7a 50%, #7698B3 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Smartphone size={26} style={{ color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Descarga BioSafe
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Disponible próximamente en Google Play y App Store
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['Google Play', 'App Store'].map(store => (
              <div
                key={store}
                style={{
                  padding: '0.7rem 1.5rem',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'default',
                }}
              >
                {store} — Próximamente
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
