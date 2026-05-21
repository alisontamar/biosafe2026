import { useState } from 'react';
import { MapPin, Mail, LogIn } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer
        id="footer"
        style={{ background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2f7 50%, #f0f4f8 100%)' }}
      >
        {/* Main section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Brand */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-2xl font-semibold tracking-tight" style={{ color: '#1a1a2e' }}>
                    Bio<span style={{ color: '#7698B3' }}>Safe</span>
                  </span>
                  <p className="text-xs font-light text-gray-500 mt-0.5">Cochabamba · Bolivia</p>
                </div>
              </div>

              <p className="text-gray-500 font-light leading-relaxed max-w-md text-base">
                Transformando el registro de inmunización materno-infantil en Bolivia a través de tecnología segura, inteligente y accesible para todos.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 text-sm font-light">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#7698B3' }} />
                  Cochabamba, Bolivia
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm font-light">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#7698B3' }} />
                  aligomalva@gmail.com
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <p className="text-sm text-gray-500 font-light">¿Tienes acceso a la plataforma?</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2.5 py-4 px-8 rounded-2xl text-sm font-medium text-white transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
              >
                <LogIn className="w-4 h-4" />
                Entrar a BioSafe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-light text-gray-600">© 2026 BioSafe Technologies by Bytetwo.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs font-light text-gray-600 hover:text-gray-700 transition-colors">
                Políticas de Privacidad
              </a>
              <span className="text-gray-400">·</span>
              <a href="#" className="text-xs font-light text-gray-600 hover:text-gray-700 transition-colors">
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
