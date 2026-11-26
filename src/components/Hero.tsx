import { useState, useEffect } from 'react';
import { Download, ArrowRight, QrCode, Bell, BookOpen, Sparkles } from 'lucide-react';

interface AnimatedTitleProps {
  line: string;
  className?: string;
  style?: React.CSSProperties;
  globalOffset?: number;
}

function AnimatedTitle({ line, className, style, globalOffset = 0 }: AnimatedTitleProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [doneAnimating, setDoneAnimating] = useState<boolean[]>(() =>
    Array(line.length).fill(false)
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    line.split('').forEach((_, i) => {
      const t = setTimeout(() => {
        setDoneAnimating(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, (globalOffset + i) * 45 + 600);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [line, globalOffset]);

  return (
    <span className={className} style={style}>
      {line.split('').map((char, i) =>
        char === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'inline-block',
              opacity: doneAnimating[i] ? 1 : undefined,
              animation: doneAnimating[i]
                ? 'none'
                : `letterDrop 0.6s cubic-bezier(.34,1.56,.64,1) ${(globalOffset + i) * 45}ms both`,
              transition: doneAnimating[i] ? 'transform 0.3s cubic-bezier(.34,1.56,.64,1), color 0.3s ease' : undefined,
              transform: doneAnimating[i] && hovered === i ? 'translateY(-8px) scale(1.18) rotate(-4deg)' : 'none',
              color: doneAnimating[i] && hovered === i ? '#CDB6DC' : 'inherit',
            }}
          >
            {char}
          </span>
        )
      )}
    </span>
  );
}

const LINE1 = 'El carnet digital';
const LINE2 = 'de tu familia.';
const LINE3 = 'Siempre contigo.';

const features = [
  { icon: QrCode, label: 'Código QR por persona' },
  { icon: Bell, label: 'Alertas epidemiológicas' },
  { icon: BookOpen, label: 'Guías para padres' },
];

const slides = [
  { src: '/hero/carnet.webp', alt: 'Una madre y su hijo consultan el carnet digital de vacunación en el celular' },
  { src: '/hero/validacion.webp', alt: 'Personal médico escanea el código QR de una paciente para registrar su vacuna' },
  { src: '/hero/alertas.webp', alt: 'Una mujer recibe alertas epidemiológicas en su celular' },
];

export default function Hero() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12"
      style={{ background: 'linear-gradient(180deg, #F3ECF9 0%, #FAF7FD 100%)' }}
    >
      <div aria-hidden="true" className="absolute pointer-events-none" style={{ top: -140, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'rgba(162,128,185,0.16)' }} />
      <div aria-hidden="true" className="absolute pointer-events-none" style={{ bottom: -160, left: -120, width: 440, height: 440, borderRadius: '50%', background: 'rgba(118,152,179,0.14)' }} />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1
            className="font-extralight leading-[1.08] tracking-tight mb-4 sm:mb-6"
            style={{ fontSize: 'clamp(2.2rem, 5.2vw, 4.2rem)', color: '#402B52', animation: 'fadeUp 0.6s ease 0.1s both' }}
          >
            <AnimatedTitle line={LINE1} globalOffset={0} />
            <br />
            <span className="font-semibold" style={{ color: '#A280B9' }}>
              <AnimatedTitle line={LINE2} globalOffset={LINE1.length} />
            </span>
            <br />
            <span style={{ color: '#7698B3', fontWeight: 300 }}>
              <AnimatedTitle line={LINE3} globalOffset={LINE1.length + LINE2.length} />
            </span>
          </h1>

          <p
            className="text-sm sm:text-base font-light leading-relaxed max-w-xl mb-6 sm:mb-8"
            style={{ color: '#553B5E', animation: 'fadeUp 0.6s ease 0.25s both' }}
          >
            BioSafe digitaliza el carnet de vacunación del PAI Bolivia. Un código QR único para cada
            persona, historial completo de dosis, recordatorios antes de cada vacuna y alertas
            epidemiológicas en tu zona — todo desde tu celular.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 mb-7 sm:mb-9 w-full sm:w-auto"
            style={{ animation: 'fadeUp 0.6s ease 0.35s both' }}
          >
            <a
              href="#red"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1"
              style={{ background: '#A280B9', boxShadow: '0 8px 24px rgba(162,128,185,0.45)' }}
            >
              <Download className="w-4 h-4" />
              Descarga la App
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </a>
            <a
              href="#ia"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-1"
              style={{ color: '#553B5E', border: '1.5px solid #D9C8E6', background: '#fff' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#A280B9' }} />
              Ver IA Predictiva
            </a>
          </div>

          {/* Feature pills */}
          <div
            className="flex flex-row flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 w-full"
            style={{ animation: 'fadeUp 0.6s ease 0.45s both' }}
          >
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                style={{ background: '#fff', border: '1px solid #E6DAF0', color: '#553B5E', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(114,110,151,0.08)' }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#A280B9' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Ilustraciones */}
        <div className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: '1 / 0.92', animation: 'fadeUp 0.7s ease 0.3s both' }}>
          {slides.map((sl, i) => (
            <img
              key={sl.src}
              src={sl.src}
              alt={sl.alt}
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: i === slide ? 1 : 0, transition: 'opacity 0.8s ease' }}
            />
          ))}

          <div
            className="absolute -bottom-2 left-2 sm:left-0 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#fff', border: '1px solid #E6DAF0', boxShadow: '0 12px 30px rgba(114,110,151,0.18)', animation: 'floatY 3.5s ease-in-out infinite' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#A280B9' }}>
              <span className="text-white text-[9px] font-bold tracking-wider">QR</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium leading-none" style={{ color: '#402B52' }}>Carnet QR digital</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#7698B3' }}>Un QR por persona, siempre disponible</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((sl, i) => (
              <button
                key={sl.src}
                type="button"
                aria-label={`Ilustración ${i + 1}`}
                onClick={() => setSlide(i)}
                style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 999, border: 'none', background: i === slide ? '#A280B9' : '#D9C8E6', transition: 'all 0.3s', cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes letterDrop {
          0%   { opacity: 0; transform: translateY(-28px) scale(0.8) rotate(-6deg); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.06) rotate(2deg); }
          80%  { transform: translateY(-3px) scale(0.98) rotate(-1deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-7px); }
        }
      `}</style>
    </section>
  );
}
