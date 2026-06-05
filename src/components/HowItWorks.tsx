import { QrCode, Syringe, Bell, BookOpen } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    accent: '#726E97',
    bg: 'rgba(114,110,151,0.08)',
    title: 'Carnet QR digital',
    description:
      'Cada persona registrada en BioSafe recibe un código QR único. Muéstralo en cualquier centro de salud o farmacia y el personal de salud accede al historial de vacunación completo al instante.',
    pills: ['Sin papeles que perder', 'Verificado y seguro', 'Funciona en todo el país'],
  },
  {
    icon: Syringe,
    accent: '#7698B3',
    bg: 'rgba(118,152,179,0.08)',
    title: 'Esquema PAI Bolivia completo',
    description:
      'Seguimos el Programa Ampliado de Inmunización oficial de Bolivia: BCG, Pentavalente, Rotavirus, SRP, Fiebre Amarilla y más. Siempre sabrás cuáles ya se aplicaron y cuáles faltan.',
    pills: ['15+ vacunas oficiales', 'Historial con fecha y lote', 'Pendientes resaltadas por edad'],
  },
  {
    icon: Bell,
    accent: '#726E97',
    bg: 'rgba(114,110,151,0.08)',
    title: 'Alertas y recordatorios',
    description:
      'Te avisamos antes de que venza la próxima dosis. Además, BioSafe monitorea señales epidemiológicas en tu zona y genera alertas preventivas cuando detecta riesgo de brotes.',
    pills: ['Recordatorios automáticos', 'Alertas epidemiológicas', 'Notificaciones a tiempo'],
  },
  {
    icon: BookOpen,
    accent: '#7698B3',
    bg: 'rgba(118,152,179,0.08)',
    title: 'Guías para padres',
    description:
      '¿Fiebre después de la vacuna? ¿El brazo duele? BioSafe incluye guías simples y confiables para que sepas qué esperar tras cada dosis y cuándo acudir al médico.',
    pills: ['Qué esperar post-vacuna', 'Cómo tratar efectos leves', 'Señales de alerta'],
  },
];

export default function HowItWorks() {
  return (
    <section id="que-es" style={{ padding: '5rem 1.5rem', background: '#fafafa' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
            La aplicación
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
            ¿Qué es{' '}
            <span style={{ color: '#726E97' }}>BioSafe</span>?
          </h2>
          <p
            style={{
              color: '#9ca3af',
              fontWeight: 300,
              fontSize: '0.95rem',
              maxWidth: 500,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Una app para padres y tutores que digitaliza el carnet de vacunación y conecta a las
            familias con el sistema de salud boliviano.
          </p>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {features.map(({ icon: Icon, accent, bg, title, description, pills }) => (
            <div
              key={title}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '2rem 1.75rem',
                border: `1.5px solid ${accent}22`,
                transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = accent + '66';
                el.style.boxShadow = `0 16px 40px -8px ${accent}28`;
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = accent + '22';
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Icon size={22} style={{ color: accent }} />
              </div>

              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  margin: '0 0 0.65rem',
                  lineHeight: 1.35,
                }}
              >
                {title}
              </h3>

              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 300,
                  color: '#6b7280',
                  lineHeight: 1.75,
                  margin: '0 0 1.25rem',
                }}
              >
                {description}
              </p>

              {/* Feature pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {pills.map(pill => (
                  <span
                    key={pill}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: accent,
                      background: bg,
                      border: `1px solid ${accent}22`,
                      borderRadius: 999,
                      padding: '0.25rem 0.75rem',
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>

              {/* Bottom accent line */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '1.75rem',
                  right: '1.75rem',
                  height: 2,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${accent}, transparent)`,
                  opacity: 0.35,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
