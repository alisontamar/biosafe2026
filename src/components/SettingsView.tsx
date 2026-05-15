import { 
  User, 
  Building2, 
  BellRing, 
  Save, 
  Globe,
  Database
} from "lucide-react";

export default function SettingsView() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#726E97]">Configuración</h1>
        <button className="bg-[#726E97] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all font-semibold text-sm">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Perfil y Cuenta */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Perfil del Administrador */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800">Perfil del Administrador</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input type="text" defaultValue="Admin BioSafe" className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#726E97]/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                <input type="email" defaultValue="admin@biosafe.com" className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#726E97]/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cargo / Rol</label>
                <input type="text" defaultValue="Director Médico" className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50 outline-none" disabled />
              </div>
            </div>
          </section>

          {/* Ajustes del Establecimiento */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800">Información del Establecimiento</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Centro de Salud</label>
                <input type="text" defaultValue="Centro de Salud Central" className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#726E97]/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ciudad / Municipio</label>
                  <input type="text" defaultValue="Cochabamba" className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#726E97]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Código Ministerial</label>
                  <input type="text" defaultValue="CB-4021-X" className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#726E97]/20" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Preferencias y Seguridad */}
        <div className="space-y-6">
          
          {/* Notificaciones y Alertas IA */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <BellRing className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Notificaciones IA</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: "Alertas de Brotes", desc: "IA detecta anomalías regionales" },
                { label: "Recordatorios de Stock", desc: "Aviso de vacunas por vencer" },
                { label: "Reportes Semanales", desc: "Envío automático al correo" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-[#726E97] rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seguridad y Sistema */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Seguridad</h2>
            </div>
            
            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition border border-slate-100">
              Cambiar Contraseña
            </button>
            <button className="w-full text-left mt-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition border border-red-50">
              Cerrar Sesión Global
            </button>
          </section>

          {/* Info del Sistema */}
          <div className="p-4 bg-slate-800 text-white rounded-xl shadow-sm overflow-hidden relative group">
            <Database className="w-20 h-20 absolute -right-5 -bottom-5 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado del Sistema</p>
            <p className="text-xl font-bold mt-1">BioSafe v3.2.0</p>
            <div className="flex items-center gap-2 mt-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium">Sincronizado con Nube</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}