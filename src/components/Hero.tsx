import { useState } from 'react';
import { LogIn, PlayCircle, ArrowRight } from 'lucide-react';

interface AnimatedTitleProps {
  line: string;
  className?: string;
  style?: React.CSSProperties;
}

function AnimatedTitle({ line, className, style }: AnimatedTitleProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <span className={className} style={style}>
      {line.split('').map((char: string, i: number) =>
        char === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'inline-block',
              transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), color 0.3s ease',
              transform: hovered === i ? 'translateY(-8px) scale(1.18) rotate(-4deg)' : 'none',
              color: hovered === i ? '#c4b5fd' : 'inherit',
            }}
          >
            {char}
          </span>
        )
      )}
    </span>
  );
}


export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      {/* FULL BG IMAGE */}
      <img
        src="https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=1600"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.38) saturate(0.7)' }}
      />

      {/* colour wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(114,110,151,0.55) 0%, rgba(22,18,40,0.7) 50%, rgba(118,152,179,0.4) 100%)',
        }}
      />

      {/* vignette bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,8,20,0.7), transparent)' }}
      />

      {/* CONTENT — centred column */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full"
      >
        {/* Badge */}
       
         <div className="h-12 mb-6"></div>
       

        {/* Main headline */}
        <h1
          className="font-extralight leading-[1.05] tracking-tight mb-7"
          style={{
            fontSize: 'clamp(2.8rem, 6.5vw, 5rem)',
            color: '#f3f0ff',
            animation: 'fadeUp 0.6s ease 0.1s both',
          }}
        >
          <AnimatedTitle line="La Bioseguridad" />
          <br />
          <span className="font-semibold" style={{ color: '#c4b5fd' }}>
            <AnimatedTitle line="Materno-Infantil" />
          </span>
          <br />
          <span style={{ color: '#bfdbfe', fontWeight: 300 }}>
            <AnimatedTitle line="centralizada en la nube." />
          </span>
        </h1>

        {/* Description */}
        <p
          className="text-base font-light leading-relaxed max-w-xl mb-10"
          style={{ color: 'rgba(255,255,255,0.6)', animation: 'fadeUp 0.6s ease 0.2s both' }}
        >
          BioSafe transforma el registro de inmunización tradicional en un ecosistema digital
          inteligente, seguro y proactivo — accesible desde cualquier lugar.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-16"
          style={{ animation: 'fadeUp 0.6s ease 0.3s both' }}
        >
          <a
            href="#footer"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, #726E97, #5d5a7a)',
              boxShadow: '0 4px 24px rgba(114,110,151,0.45)',
            }}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión en el Portal
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 hover:-translate-y-1"
            style={{
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <PlayCircle className="w-4 h-4" />
            Conoce BIOSAFE
          </a>
        </div>

        {/* Stats */}
        <div
          className="flex items-center"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '2rem',
            animation: 'fadeUp 0.6s ease 0.4s both',
          }}
        >
        
        </div>
      </div>

      {/* Floating pill — QR — bottom right */}
      <div
        className="absolute bottom-8 right-8 hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl z-10"
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.18)',
          animation: 'floatY 3.5s ease-in-out infinite',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
        >
          <span className="text-white text-[9px] font-bold tracking-wider">QR</span>
        </div>
        <div className="text-left">
          <p className="text-xs font-medium text-white leading-none">Identidad QR para cada persona</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Seguro y confiable
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
      </div>

      {/* Floating badge — cobertura — bottom left */}
      

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
      `}</style>
    </section>
  );
}