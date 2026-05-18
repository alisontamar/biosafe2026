import { useState } from 'react';
import { MapPin, Mail, Eye, EyeOff, LogIn, X, Smartphone, Download, ChevronRight, ArrowLeft } from 'lucide-react';

const roleOptions = [
  { value: '', label: 'Selecciona tu rol' },
  { value: 'medico', label: 'Soy Médico' },
  { value: 'farmaceutico', label: 'Soy Farmacéutico' },
  { value: 'administrador', label: 'Soy Administrador' },
];

export default function Footer() {
  const [showPass, setShowPass] = useState(false);
  const [modal, setModal] = useState<null | 'entry' | 'login'>(null);
  const [form, setForm] = useState({ email: '', password: '', role: '' });

  const openEntry = () => setModal('entry');
  const goLogin = () => setModal('login');
  const goBack = () => setModal('entry');
  const closeModal = () => {
    setModal(null);
    setForm({ email: '', password: '', role: '' });
    setShowPass(false);
  };

  const handleSubmit = () => {
    window.location.hash = 'admin';
    closeModal();
  };

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
                onClick={openEntry}
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

      {/* ── Backdrop ── */}
      {modal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,30,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* ── ENTRY MODAL ── */}
          {modal === 'entry' && (
            <div
              className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl"
              style={{ background: 'white' }}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
              >
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold mb-1" style={{ color: '#1a1a2e' }}>
                ¿Cómo quieres acceder?
              </h3>
              <p className="text-sm font-light text-gray-500 mb-8 leading-relaxed">
                Si eres padre o tutor, BioSafe está disponible como app móvil para el seguimiento de vacunas de tu hijo/a.
              </p>

              {/* Download block */}
              <div
                className="rounded-2xl p-5 mb-6 border"
                style={{ background: '#f8f7fc', borderColor: 'rgba(114,110,151,0.15)' }}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Padres y tutores
                </p>
                <button
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar la aplicación
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
                <p className="text-xs text-gray-400 font-light mt-2 text-center">
                  Disponible en iOS y Android
                </p>
              </div>

              {/* Medical center link */}
              <div className="text-center">
                <button
                  onClick={goLogin}
                  className="inline-flex items-center gap-1.5 text-xs font-light transition-all duration-200 hover:gap-2.5 group"
                  style={{ color: '#7698B3' }}
                >
                  <span>Soy centro médico / profesional de salud</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── LOGIN MODAL ── */}
          {modal === 'login' && (
            <div
              className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl"
              style={{ background: 'white' }}
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver
                </button>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-semibold mb-1" style={{ color: '#1a1a2e' }}>
                Acceso Profesional
              </h3>
              <p className="text-sm font-light text-gray-500 mb-7">
                Ingresa tus credenciales para continuar.
              </p>

              {/* Google button */}
              <button
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 mb-5"
                style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#1a1a2e', background: 'white' }}
              >
                {/* Google icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                <span className="text-xs text-gray-400 font-light">o usa tu correo</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 border outline-none transition-all duration-200"
                    style={{ background: 'white', borderColor: 'rgba(0,0,0,0.1)', color: '#1a1a2e' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#7698B3'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm placeholder-gray-400 border outline-none transition-all duration-200"
                      style={{ background: 'white', borderColor: 'rgba(0,0,0,0.1)', color: '#1a1a2e' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#7698B3'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    Tipo de usuario
                  </label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 appearance-none cursor-pointer"
                    style={{
                      background: 'white',
                      borderColor: 'rgba(0,0,0,0.1)',
                      color: form.role ? '#1a1a2e' : '#9ca3af',
                    }}
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.value === ''} style={{ color: '#1a1a2e' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 mt-1"
                  style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
                >
                  <LogIn className="w-4 h-4" />
                  Ingresar a BioSafe
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}