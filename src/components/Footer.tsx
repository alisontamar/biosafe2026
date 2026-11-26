import { useState } from 'react';
import { MapPin, Mail, LogIn } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer
        id="footer"
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #FAF7FD 0%, #F0E7F7 100%)' }}
      >
        <div aria-hidden="true" className="absolute pointer-events-none" style={{ top: -120, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(162,128,185,0.14)' }} />
        <div aria-hidden="true" className="absolute pointer-events-none" style={{ bottom: -140, left: -100, width: 360, height: 360, borderRadius: '50%', background: 'rgba(118,152,179,0.12)' }} />

        {/* Main section */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Brand */}
            <div className="space-y-7 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <img src="/logo.png" alt="" aria-hidden="true" className="h-12 w-auto" />
                <div className="text-left">
                  <span className="text-2xl font-bold tracking-tight" style={{ color: '#A280B9' }}>
                    Bio<span style={{ color: '#7698B3' }}>Safe</span>
                  </span>
                  <p className="text-xs font-light mt-0.5" style={{ color: '#6B5A7A' }}>Cochabamba · Bolivia</p>
                </div>
              </div>

              <p className="font-light leading-relaxed max-w-md text-base mx-auto lg:mx-0" style={{ color: '#553B5E' }}>
                Transformando el registro de inmunización materno-infantil en Bolivia a través de tecnología segura, inteligente y accesible para todos.
              </p>

              <div className="space-y-3 inline-flex flex-col items-start">
                <div className="flex items-center gap-3 text-sm font-light" style={{ color: '#6B5A7A' }}>
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#A280B9' }} />
                  Cochabamba, Bolivia
                </div>
                <div className="flex items-center gap-3 text-sm font-light" style={{ color: '#6B5A7A' }}>
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#A280B9' }} />
                  aligomalva@gmail.com
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="flex flex-col items-center text-center gap-4 p-8 sm:p-10 mx-auto w-full max-w-md"
              style={{
                background: '#fff',
                borderRadius: 32,
                border: '1.5px solid #E6DAF0',
                boxShadow: '0 18px 40px -14px rgba(114,110,151,0.28)',
              }}
            >
              <img src="/hero/carnet.webp" alt="" aria-hidden="true" className="w-44 h-auto -mt-2" />
              <p className="text-sm font-light" style={{ color: '#6B5A7A' }}>¿Tienes acceso a la plataforma?</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2.5 py-3.5 px-8 rounded-full text-sm font-medium text-white transition-all duration-200 hover:-translate-y-1 active:translate-y-0"
                style={{ background: '#A280B9', boxShadow: '0 8px 24px rgba(162,128,185,0.45)' }}
              >
                <LogIn className="w-4 h-4" />
                Entrar a BioSafe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative border-t" style={{ borderColor: '#E6DAF0' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-light" style={{ color: '#6B5A7A' }}>© 2026 BioSafe Technologies by Bytetwo.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs font-light hover:text-[#A280B9] transition-colors" style={{ color: '#6B5A7A' }}>
                Políticas de Privacidad
              </a>
              <span style={{ color: '#D9C8E6' }}>·</span>
              <a href="#" className="text-xs font-light hover:text-[#A280B9] transition-colors" style={{ color: '#6B5A7A' }}>
                Términos del Servicio
              </a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
