import { Building2, Store, Users } from 'lucide-react';

const cards = [
  {
    icon: Building2,
    audience: 'Para Clínicas',
    tagline: 'Gestión clínica de alto nivel',
    description:
      'Herramientas de gestión clínica, reportes gerenciales y análisis de cobertura para tomar decisiones basadas en datos reales.',
    features: ['Dashboard gerencial', 'Reportes de cobertura', 'Gestión de personal', 'Alertas de brotes'],
    image: 'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: '#726E97',
  },
  {
    icon: Store,
    audience: 'Para Farmacias',
    tagline: 'Punto de vacunación masivo',
    description:
      'Un módulo de registro rápido diseñado para puntos de vacunación masivos y farmacias de barrio, con interfaz simplificada.',
    features: ['Registro en 3 pasos', 'Validación QR', 'Inventario de vacunas', 'Historial de dosis'],
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: '#7698B3',
  },
  {
    icon: Users,
    audience: 'Para Familias',
    tagline: 'Control total de la salud',
    description:
      'Una aplicación intuitiva para el control total de la salud de sus hijos y acceso a guías post-vacunación en cualquier momento.',
    features: ['QR del menor', 'Calendario de vacunas', 'Recordatorios', 'Guías post-vacuna'],
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=600',
    accent: '#726E97',
  },
];

export default function Network() {
  return (
    <section id="red" className="py-32" style={{ background: '#f8f7fc' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-20 space-y-4">
          <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: '#7698B3' }}>
            Ecosistema Conectado
          </p>
          <h2 className="text-4xl lg:text-5xl font-thin" style={{ color: '#1a1a2e' }}>
            La <span className="font-semibold" style={{ color: '#726E97' }}>Red BioSafe</span>
          </h2>
          <p className="text-gray-400 font-light max-w-xl mx-auto leading-relaxed">
            Un ecosistema unificado que conecta clínicas, farmacias y familias en una sola plataforma.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.audience}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:border-transparent transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.audience}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to bottom, ${card.accent}40, ${card.accent}90)` }}
                  />
                  <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-base">{card.audience}</p>
                      <p className="text-white/70 text-xs font-light">{card.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7">
                  <p className="text-sm font-light text-gray-500 leading-relaxed mb-6">
                    {card.description}
                  </p>

                  <div className="space-y-2.5">
                    {card.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: card.accent }}
                        />
                        <span className="text-sm font-light text-gray-600">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#footer"
                    className="mt-6 inline-flex items-center text-sm font-medium transition-colors duration-200"
                    style={{ color: card.accent }}
                  >
                    Solicitar acceso
                    <span className="ml-1 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
