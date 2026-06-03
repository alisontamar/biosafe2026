import { useState } from 'react';
import { Eye, EyeOff, LogIn, X, Smartphone, Download, ChevronRight, ArrowLeft, Shield, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [showPass, setShowPass] = useState(false);
  const [view, setView] = useState<'entry' | 'login'>('entry');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const closeModal = () => {
    onClose();
    setForm({ email: '', password: '' });
    setShowPass(false);
    setView('entry');
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      if (data.user) {
        window.location.hash = 'admin';
        closeModal();
      }
    } catch (error: any) {
      setErrorMsg('Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,30,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      {view === 'entry' && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
          {/* Header sólido */}
          <div className="px-8 pt-8 pb-10 relative" style={{ background: '#726E97' }}>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 border border-white/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">BioSafe</h3>
            <p className="text-sm text-white/70 font-light">Sistema de vigilancia vacunal</p>
          </div>

          {/* Cuerpo blanco */}
          <div className="bg-white px-8 py-7">
            <p className="text-sm text-gray-500 font-light mb-6">
              Selecciona cómo deseas acceder a la plataforma.
            </p>

            {/* Tarjeta app móvil */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#726E97' }}>
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Para padres y tutores</p>
                  <p className="text-xs text-gray-400 font-light">Seguimiento del carnet de vacunas</p>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: '#726E97' }}
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Descargar app móvil
                </span>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
              <p className="text-[10px] text-gray-400 font-light mt-2 text-center">Disponible en iOS y Android</p>
            </div>

            {/* Acceso profesional */}
            <button
              onClick={() => setView('login')}
              className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#726E97]/40 hover:bg-[#726E97]/5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#726E97]/10 flex items-center justify-center group-hover:bg-[#726E97]/20 transition-colors">
                  <Activity className="w-4 h-4 text-[#726E97]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800">Profesional de salud</p>
                  <p className="text-xs text-gray-400 font-light">Centro médico / establecimiento</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#726E97] transition-colors" />
            </button>
          </div>
        </div>
      )}

      {view === 'login' && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
          {/* Barra de acento sólida */}
          <div className="h-1.5 w-full" style={{ background: '#726E97' }} />

          <div className="bg-white px-8 py-7">
            {/* Volver + cerrar */}
            <div className="flex items-center justify-between mb-7">
              <button
                onClick={() => setView('entry')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver
              </button>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Título */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#726E97' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: '#1a1a2e' }}>Acceso Profesional</h3>
                <p className="text-xs text-gray-400 font-light">Ingresa tus credenciales de BioSafe</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4" onKeyDown={handleKeyDown}>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tucorreo@ejemplo.com"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-300 border outline-none transition-all duration-200 disabled:opacity-50"
                  style={{ background: '#fafafa', borderColor: '#e5e7eb', color: '#1a1a2e' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#726E97'; e.currentTarget.style.background = 'white'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm placeholder-gray-300 border outline-none transition-all duration-200 disabled:opacity-50"
                    style={{ background: '#fafafa', borderColor: '#e5e7eb', color: '#1a1a2e' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#726E97'; e.currentTarget.style.background = 'white'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: '#726E97' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Validando...' : 'Ingresar a BioSafe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
