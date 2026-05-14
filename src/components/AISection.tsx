import { useState } from 'react';
import {
  Brain,
  AlertTriangle,
  MapPin,
  Thermometer,
  Syringe,
  CheckCircle2,
  TrendingDown,
  Globe,
  ShieldCheck,
} from 'lucide-react';

const signals = [
  {
    icon: TrendingDown,
    title: 'Abandono local',
    text: 'Detecta zonas con menor continuidad en esquemas de vacunación.',
  },
  {
    icon: Globe,
    title: 'Datos externos',
    text: 'Cruza señales epidemiológicas oficiales y contexto regional.',
  },
  {
    icon: Thermometer,
    title: 'Clima regional',
    text: 'Relaciona frío, lluvias y temporada con riesgo preventivo.',
  },
];

export default function AISection() {
  const [riskChecked, setRiskChecked] = useState(false);

  return (
    <section
      id="ia"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
      style={{
        background:
          'linear-gradient(180deg, #fbfbfd 0%, #f8f7fc 48%, #eef2f7 100%)',
      }}
    >
      {/* Fondo decorativo suave */}
      <div
        className="pointer-events-none absolute -top-32 right-0 h-[360px] w-[360px] rounded-full opacity-10 blur-3xl"
        style={{ background: '#726E97' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full opacity-10 blur-3xl"
        style={{ background: '#7698B3' }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mx-auto mb-14 max-w-3xl text-center">

          <h2
            className="text-4xl font-light leading-tight sm:text-5xl lg:text-6xl"
            style={{ color: '#1a1a2e' }}
          >
            IA que anticipa{' '}
            <span className="italic font-light" style={{ color: '#726E97' }}>
              riesgos
            </span>{' '}
            antes de que ocurran
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm font-light leading-7 text-gray-500 sm:text-base">
            BioSafe interpreta datos de vacunación, clima y alertas sanitarias
            para generar señales tempranas de prevención en centros
            materno-infantiles.
          </p>
        </div>

        {/* Contenido principal minimalista */}
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Texto izquierdo */}
          <div className="order-2 lg:order-1">
            <div className="mb-8 flex items-start gap-4">
               <div>
                <h3
                  className="text-2xl font-semibold leading-tight sm:text-3xl"
                  style={{ color: '#1a1a2e' }}
                >
                  No solo registramos datos, prevenimos riesgos.
                </h3>

                <p className="mt-4 text-sm font-light leading-7 text-gray-500">
                  El motor de IA analiza patrones de abandono, condiciones
                  climáticas y señales epidemiológicas para orientar acciones
                  preventivas antes de que el riesgo aumente.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {signals.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex gap-4">
                    <div
                      className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(114,110,151,0.09)' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: '#726E97' }} />
                    </div>

                    <div>
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: '#1a1a2e' }}
                      >
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm font-light leading-6 text-gray-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-9 flex items-start gap-3 border-l-2 pl-5" style={{ borderColor: '#7698B3' }}>
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: '#f59e0b' }}
              />
              <p className="text-sm font-light leading-6 text-gray-500">
                Las alertas tempranas ayudan a priorizar campañas, reforzar
                recordatorios y proteger a los grupos más vulnerables.
              </p>
            </div>
          </div>

          {/* Mapa derecho */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-xl">
              <div className="mb-6 text-center lg:text-left">
                <p
                  className="mb-2 text-xs font-medium uppercase tracking-[0.24em]"
                  style={{ color: '#7698B3' }}
                >
                  Índice de Riesgo Epidemiológico
                </p>
                <h3
                  className="text-2xl font-semibold sm:text-3xl"
                  style={{ color: '#1a1a2e' }}
                >
                  Mapa preventivo de Bolivia
                </h3>
              </div>

              {/* Área del mapa sin card pesada */}
              <div className="relative flex min-h-[340px] items-center justify-center sm:min-h-[390px]">
                {/* Círculo suave detrás */}
                <div
                  className="absolute h-[280px] w-[280px] rounded-full opacity-50 sm:h-[340px] sm:w-[340px]"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(118,152,179,0.22), rgba(114,110,151,0.05), transparent 70%)',
                  }}
                />

                <svg
  viewBox="0 0 260 300"
  className="relative h-[290px] w-full max-w-[260px] drop-shadow-md sm:h-[340px] sm:max-w-[300px]"
  role="img"
  aria-label="Mapa de Bolivia con punto de riesgo"
>
  <defs>
    <linearGradient id="boliviaGradientMinimal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#726E97" stopOpacity="0.96" />
      <stop offset="100%" stopColor="#7698B3" stopOpacity="0.96" />
    </linearGradient>
  </defs>

  {/* Silueta de Bolivia más precisa */}
  <path
    d="M105 15 L145 25 L165 55 L215 75 L210 115 L235 150 L200 185 L195 235 L155 250 L145 295 L100 285 L65 315 L35 275 L5 270 L25 220 L0 180 L30 150 L20 110 L50 80 L60 40 Z"
    fill="url(#boliviaGradientMinimal)"
  />

  {/* Divisiones internas estilizadas */}
  <path
    d="M60 40 L110 100 L90 160 L40 160 M110 100 L165 25 M110 100 L185 140 L195 235 M90 160 L140 195 L145 295 M140 195 L200 185"
    fill="none"
    stroke="rgba(255,255,255,0.3)"
    strokeWidth="1.5"
    strokeLinecap="round"
  />

  {/* Punto de riesgo (Ubicación central/Cochabamba-Santa Cruz) */}
  <g className="animate-pulse">
    <circle cx="125" cy="165" r="30" fill="#f59e0b" opacity="0.1" />
    <circle cx="125" cy="165" r="18" fill="#f59e0b" opacity="0.2" />
    <circle cx="125" cy="165" r="8" fill="#f59e0b" />
  </g>
</svg>
                {/* Etiqueta flotante */}
                <div
                  className="absolute right-2 top-12 rounded-2xl border bg-white/80 px-4 py-3 text-left shadow-sm backdrop-blur-md sm:right-10"
                  style={{ borderColor: 'rgba(114,110,151,0.12)' }}
                >
                  <p className="text-[11px] font-light text-gray-500">
                    Zona detectada
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                    Riesgo moderado
                  </p>
                </div>

                <div
                  className="absolute bottom-8 left-2 rounded-2xl border bg-white/80 px-4 py-3 text-left shadow-sm backdrop-blur-md sm:left-8"
                  style={{ borderColor: 'rgba(118,152,179,0.14)' }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" style={{ color: '#7698B3' }} />
                    <p className="text-xs font-medium" style={{ color: '#726E97' }}>
                      Monitoreo preventivo
                    </p>
                  </div>
                </div>
              </div>

              {/* Pregunta debajo del mapa */}
              <div className="mx-auto mt-2 max-w-lg text-center">
                <h4
                  className="text-xl font-semibold sm:text-2xl"
                  style={{ color: '#1a1a2e' }}
                >
                  ¿Quieres saber si hay riesgo en tu zona?
                </h4>

                <p className="mx-auto mt-3 max-w-md text-sm font-light leading-6 text-gray-500">
                  Consulta tu ubicación para recibir una recomendación
                  preventiva personalizada.
                </p>

                <button
                  type="button"
                  onClick={() => setRiskChecked(true)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #726E97, #7698B3)',
                    boxShadow: '0 14px 28px rgba(114,110,151,0.22)',
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  Confirmar ubicación
                </button>

                {riskChecked && (
                  <div
                    className="mx-auto mt-6 max-w-md rounded-3xl border bg-white/75 p-5 text-left shadow-sm backdrop-blur-md"
                    style={{ borderColor: 'rgba(114,110,151,0.14)' }}
                  >
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: '#1a1a2e' }}
                        >
                          Hay riesgo preventivo por clima frío.
                        </p>

                        <p className="mt-1 text-sm font-light leading-6 text-gray-500">
                          Abriga a los más pequeños, evita cambios bruscos de
                          temperatura y revisa que sus vacunas estén al día.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-gray-500">
                            <Thermometer
                              className="h-3.5 w-3.5"
                              style={{ color: '#7698B3' }}
                            />
                            Clima frío
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-gray-500">
                            <Syringe
                              className="h-3.5 w-3.5"
                              style={{ color: '#726E97' }}
                            />
                            Revisar vacunas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}