
const pillars = [
  {
    number: '01',
    title: 'Identidad QR Dinámica',
    description:
      'Cada menor cuenta con un código QR único y encriptado en el smartphone de su tutor, eliminando la dependencia del carnet físico y agilizando el triaje.',
    accent: '#726E97',
  },
  {
    number: '02',
    title: 'Registro Ágil Fast-Track',
    description:
      'El personal médico o farmacéutico escanea y registra la aplicación de dosis en segundos, optimizando los tiempos de atención y reduciendo errores manuales.',
    accent: '#7698B3',
  },
  {
    number: '03',
    title: 'Historial Clínico Seguro',
    description:
      'Información centralizada bajo arquitectura multi-tenant y encriptación de grado médico, garantizando que el historial esté siempre disponible y protegido.',
    accent: '#726E97',
  },
  {
    number: '04',
    title: 'Notificaciones Inteligentes',
    description:
      'Recordatorios automatizados enviados directamente al tutor antes de cada dosis, diseñados específicamente para reducir la tasa de abandono del esquema de vacunación.',
    accent: '#7698B3',
  },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  .hw-section {
    padding: 6rem 1.5rem;
    background: #fafafa;
    font-family: 'DM Sans', sans-serif;
  }

  .hw-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hw-heading {
    text-align: center;
    margin-bottom: 4rem;
  }

  .hw-eyebrow {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #7698B3;
    margin-bottom: 1rem;
  }

  .hw-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 400;
    color: #1a1a2e;
    line-height: 1.15;
    margin: 0 0 1rem;
  }

  .hw-title em {
    font-style: italic;
    color: #726E97;
  }

  .hw-subtitle {
    color: #9ca3af;
    font-weight: 300;
    font-size: 0.95rem;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
  }

  .hw-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 1024px) {
    .hw-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .hw-grid {
      grid-template-columns: 1fr;
    }
    .hw-section {
      padding: 4rem 1.25rem;
    }
  }

  .hw-card {
    position: relative;
    background: #ffffff;
    border-radius: 18px;
    padding: 2rem 1.75rem 2.25rem;
    border: 2px solid #c4bfe8;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
    overflow: hidden;
    cursor: default;
  }

  .hw-card:hover {
    border-color: #726E97;
    box-shadow: 0 16px 48px -8px rgba(114, 110, 151, 0.22);
    transform: translateY(-4px);
  }

  .hw-card--blue {
    border-color: #b3cfe0;
  }

  .hw-card--blue:hover {
    border-color: #7698B3;
    box-shadow: 0 16px 48px -8px rgba(118, 152, 179, 0.22);
  }

  .hw-card-bg {
    position: absolute;
    top: -1.5rem;
    right: -0.75rem;
    font-size: 6.5rem;
    font-weight: 900;
    line-height: 1;
    color: #726E97;
    opacity: 0.04;
    user-select: none;
    font-family: 'DM Serif Display', serif;
    transition: opacity 0.25s ease;
  }

  .hw-card--blue .hw-card-bg {
    color: #7698B3;
  }

  .hw-card:hover .hw-card-bg {
    opacity: 0.07;
  }

  .hw-card-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #726E9720, #726E9708);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #726E97;
    margin-bottom: 1.4rem;
    border: 1px solid #726E9730;
  }

  .hw-card--blue .hw-card-number {
    background: linear-gradient(135deg, #7698B320, #7698B308);
    color: #7698B3;
    border-color: #7698B330;
  }

  .hw-card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.75rem;
    line-height: 1.4;
    padding-right: 1rem;
  }

  .hw-card-desc {
    font-size: 0.85rem;
    font-weight: 300;
    color: #6b7280;
    line-height: 1.75;
    margin: 0;
  }

  .hw-card-line {
    position: absolute;
    bottom: 0;
    left: 1.75rem;
    right: 1.75rem;
    height: 2px;
    border-radius: 999px;
    opacity: 0;
    transition: opacity 0.25s ease;
    background: linear-gradient(90deg, #726E97, transparent);
  }

  .hw-card--blue .hw-card-line {
    background: linear-gradient(90deg, #7698B3, transparent);
  }

  .hw-card:hover .hw-card-line {
    opacity: 1;
  }
`;

export default function HowItWorks() {
  return (
    <>
      <style>{styles}</style>
      <section id="como-funciona" className="hw-section">
        <div className="hw-inner">
          {/* Heading */}
          <div className="hw-heading">
            <span className="hw-eyebrow">Cómo Funciona</span>
            <h2 className="hw-title">
              Los <em>4 Pilares</em> de BioSafe
            </h2>
            <p className="hw-subtitle">
              Una arquitectura diseñada desde cero para la inmunización segura, eficiente y conectada.
            </p>
          </div>

          {/* Pillars grid */}
          <div className="hw-grid">
            {pillars.map((pillar) => {
              const isBlue = pillar.accent === '#7698B3';
              return (
                <div
                  key={pillar.number}
                  className={`hw-card${isBlue ? ' hw-card--blue' : ''}`}
                >
                  <span className="hw-card-bg">{pillar.number}</span>

                  <div className="hw-card-number">{pillar.number}</div>

                  <h3 className="hw-card-title">{pillar.title}</h3>
                  <p className="hw-card-desc">{pillar.description}</p>

                  <div className="hw-card-line" />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}