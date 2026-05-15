import { useState } from 'react';
import { Shield, MapPin, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

const roleOptions = [
  { value: '', label: 'Selecciona tu rol' },
  { value: 'medico', label: 'Soy Médico' },
  { value: 'farmaceutico', label: 'Soy Farmacéutico' },
  { value: 'administrador', label: 'Soy Administrador' },
];

export default function Footer() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder - would connect to auth
  };

  return (
    <footer id="footer" style={{ background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2f7 50%, #f0f4f8 100%)' }}>
      {/* Login section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-20 items-start animate-fadeIn">
          {/* Brand */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 transition-all duration-500 hover:scale-105">
              
              <div>
                <span className="text-2xl font-semibold tracking-tight transition-all duration-300 hover:text-opacity-80" style={{ color: '#1a1a2e' }}>
                  Bio<span style={{ color: '#7698B3' }}>Safe</span>
                </span>
                <p className="text-xs font-light text-gray-500 mt-0.5 transition-all duration-300">Cochabamba · Bolivia</p>
              </div>
            </div>

            <p className="text-gray-500 font-light leading-relaxed max-w-md text-base transition-all duration-300 hover:text-gray-600">
              Transformando el registro de inmunización materno-infantil en Bolivia a través de tecnología segura, inteligente y accesible para todos.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-500 text-sm font-light transition-all duration-300 hover:text-gray-600 hover:translate-x-1">
                <MapPin className="w-4 h-4 flex-shrink-0 transition-all duration-300 hover:scale-110" style={{ color: '#7698B3' }} />
                Cochabamba, Bolivia
              </div>
              <div className="flex items-center gap-3 text-gray-500 text-sm font-light transition-all duration-300 hover:text-gray-600 hover:translate-x-1">
                <Mail className="w-4 h-4 flex-shrink-0 transition-all duration-300 hover:scale-110" style={{ color: '#7698B3' }} />
                aligomalva@gmail.com
              </div>
            </div>
          </div>

          {/* Login form */}
          <div
            className="rounded-3xl p-8 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{ background: 'white', borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <h3 className="text-xl font-semibold mb-2 transition-all duration-300 hover:text-opacity-90" style={{ color: '#1a1a2e' }}>Acceso a la Plataforma</h3>
            <p className="text-sm font-light text-gray-500 mb-8 transition-all duration-300">Ingresa tus credenciales para continuar.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-400 border outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    background: 'white',
                    borderColor: 'rgba(0,0,0,0.1)',
                    color: '#1a1a2e',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7698B3';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                  }}
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
                    style={{
                      background: 'white',
                      borderColor: 'rgba(0,0,0,0.1)',
                      color: '#1a1a2e',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#7698B3';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                  Tipo de usuario
                </label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 appearance-none cursor-pointer hover:shadow-md focus:shadow-md"
                  style={{
                    background: 'white',
                    borderColor: 'rgba(0,0,0,0.1)',
                    color: form.role ? '#1a1a2e' : '#6b7280',
                  }}
                >
                  {roleOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === ''}
                      style={{ background: 'white', color: '#1a1a2e' }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
  type="button"
  onClick={() => {
    window.location.hash = "admin";
  }}
  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 mt-2"
  style={{ background: "linear-gradient(135deg, #726E97, #7698B3)" }}
>
  <LogIn className="w-4 h-4" />
  Ingresar a BioSafe
</button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <p className="text-xs font-light text-gray-600">
            © 2026 BioSafe Technologies by Bytetwo.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-light text-gray-600 hover:text-gray-700 transition-all duration-200 hover:scale-105">
              Políticas de Privacidad 
            </a>
            <span className="text-gray-700">·</span>
            <a href="#" className="text-xs font-light text-gray-600 hover:text-gray-700 transition-all duration-200 hover:scale-105">
              Condiciones y Términos del Servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
