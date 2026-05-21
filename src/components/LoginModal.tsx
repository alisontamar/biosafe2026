import { useState } from 'react';
import { Eye, EyeOff, LogIn, X, Smartphone, Download, ChevronRight, ArrowLeft } from 'lucide-react';
// 1. Importamos nuestra conexión a Supabase
import { supabase } from '../lib/supabase';

const roleOptions = [
  { value: '', label: 'Selecciona tu rol' },
  { value: 'medico', label: 'Soy Médico' },
  { value: 'farmaceutico', label: 'Soy Farmacéutico' },
  { value: 'administrador', label: 'Soy Administrador' },
];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [showPass, setShowPass] = useState(false);
  const [view, setView] = useState<'entry' | 'login'>('entry');
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  
  // 2. Añadimos estados para manejar la carga y los errores
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const closeModal = () => {
    onClose();
    setForm({ email: '', password: '', role: '' });
    setShowPass(false);
    setView('entry');
    setErrorMsg(''); // Limpiamos errores al cerrar
  };

  // 3. Convertimos esta función en asíncrona para consultar a la BD
  const handleSubmit = async () => {
    // Validamos que no envíen campos vacíos
    if (!form.email || !form.password || !form.role) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // Autenticación oficial con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        throw error;
      }

      // Si pasamos el error, el login fue exitoso
      if (data.user) {
        /* Nota: En el futuro aquí podemos hacer un select a la tabla 'usuarios' 
           para validar que el rol seleccionado coincida con el de la BD. */
        
        window.location.hash = 'admin';
        closeModal();
      }
    } catch (error: any) {
      console.error('Error en login:', error.message);
      setErrorMsg('Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => setView('login');
  const goBack = () => setView('entry');

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,30,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      {view === 'entry' && (
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

      {view === 'login' && (
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

          {/* 4. Mostrar mensaje de error si existe */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
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
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 border outline-none transition-all duration-200 disabled:opacity-50"
                style={{ background: 'white', borderColor: 'rgba(0,0,0,0.1)', color: '#1a1a2e' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#7698B3'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
              />
            </div>

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
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm placeholder-gray-400 border outline-none transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'white', borderColor: 'rgba(0,0,0,0.1)', color: '#1a1a2e' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#7698B3'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                Tipo de usuario
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50"
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #726E97, #7698B3)' }}
            >
              {loading ? (
                // 5. Animación de carga simple
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Validando credenciales...' : 'Ingresar a BioSafe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}