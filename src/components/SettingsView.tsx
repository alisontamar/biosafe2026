import { useState, useEffect } from "react";
import {
  User, Building2, BellRing, Plus, Users, Shield, Trash2, Mail, Loader2,
} from "lucide-react";
import { supabase, supabaseAdmin } from "../lib/supabase";

export default function SettingsView() {
  const [loading, setLoading]           = useState(true);
  const [userProfile, setUserProfile]   = useState<any>(null);
  const [establecimientos, setEstablecimientos] = useState<any[]>([]);
  const [personal, setPersonal]         = useState<any[]>([]);
  const [showForm, setShowForm]         = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const [newEstablecimiento, setNewEstablecimiento] = useState({
    nombre: "", ciudad: "", tipo: "Centro de Salud",
    adminNombre: "", adminCorreo: "", adminPassword: "", enviarCorreo: true,
  });

  const [newPersonal, setNewPersonal] = useState({
    nombre: "", correo: "", rol: "Medico", password: "",
  });

  useEffect(() => { cargarDatosConfiguracion(); }, []);

  const cargarDatosConfiguracion = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id_usuario", session.user.id)
        .single();

      setUserProfile(profile);

      if (profile?.rol === "SuperAdmin") {
        const { data } = await supabase
          .from("establecimientos")
          .select("*")
          .order("fecha_registro", { ascending: false });
        setEstablecimientos(data || []);
      } else if (profile?.rol === "AdminEstablecimiento" && profile.id_establecimiento) {
        const { data } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id_establecimiento", profile.id_establecimiento)
          .neq("id_usuario", session.user.id);
        setPersonal(data || []);
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── SuperAdmin: crear establecimiento + admin ────────────────────────────────
  const handleCrearEstablecimiento = async () => {
    if (!newEstablecimiento.nombre || !newEstablecimiento.ciudad || !newEstablecimiento.adminCorreo) return;
    try {
      const { data: estCreado, error: errEst } = await supabase
        .from("establecimientos")
        .insert([{
          nombre_establecimiento: newEstablecimiento.nombre,
          ciudad_municipio:       newEstablecimiento.ciudad,
          tipo:                   newEstablecimiento.tipo,
        }])
        .select()
        .single();
      if (errEst) throw errEst;

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newEstablecimiento.adminCorreo,
        password: newEstablecimiento.adminPassword || "123456",
        email_confirm: true,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { error: errUser } = await supabase.from("usuarios").insert([{
          id_usuario:         authData.user.id,
          id_establecimiento: estCreado!.id_establecimiento,
          nombre_completo:    newEstablecimiento.adminNombre,
          correo_electronico: newEstablecimiento.adminCorreo,
          password_hash:      newEstablecimiento.adminPassword || "123456",
          rol:                "AdminEstablecimiento",
        }]);
        if (errUser) throw errUser;
      }

      setShowForm(false);
      setNewEstablecimiento({ nombre: "", ciudad: "", tipo: "Centro de Salud", adminNombre: "", adminCorreo: "", adminPassword: "", enviarCorreo: true });
      cargarDatosConfiguracion();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── SuperAdmin: eliminar establecimiento ─────────────────────────────────────
  const handleEliminarEstablecimiento = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?\n\nSe eliminará el establecimiento y todos sus datos asociados. Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("establecimientos")
        .delete()
        .eq("id_establecimiento", id);
      if (error) throw error;
      setEstablecimientos(prev => prev.filter(e => e.id_establecimiento !== id));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── AdminEstablecimiento: crear personal ─────────────────────────────────────
  const handleCrearPersonal = async () => {
    if (!newPersonal.nombre || !newPersonal.correo) return;
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newPersonal.correo,
        password: newPersonal.password || "123456",
        email_confirm: true,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { error: errUser } = await supabase.from("usuarios").insert([{
          id_usuario:         authData.user.id,
          id_establecimiento: userProfile.id_establecimiento,
          nombre_completo:    newPersonal.nombre,
          correo_electronico: newPersonal.correo,
          password_hash:      newPersonal.password || "123456",
          rol:                newPersonal.rol,
        }]);
        if (errUser) throw errUser;
      }

      setShowForm(false);
      setNewPersonal({ nombre: "", correo: "", rol: "Medico", password: "" });
      cargarDatosConfiguracion();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── AdminEstablecimiento: eliminar personal ──────────────────────────────────
  const handleEliminarPersonal = async (idUsuario: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a "${nombre}" del sistema?\n\nPerderá acceso inmediatamente.`)) return;
    setDeletingId(idUsuario);
    try {
      await supabaseAdmin.auth.admin.deleteUser(idUsuario);
      const { error } = await supabase
        .from("usuarios")
        .delete()
        .eq("id_usuario", idUsuario);
      if (error) throw error;
      setPersonal(prev => prev.filter(p => p.id_usuario !== idUsuario));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#726E97]" />
      </div>
    );
  }

  const isSuperAdmin          = userProfile?.rol === "SuperAdmin";
  const isAdminEstablecimiento = userProfile?.rol === "AdminEstablecimiento";

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-[#726E97]">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── columna principal ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mi perfil */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800">Mi Perfil</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input type="text" defaultValue={userProfile?.nombre_completo} disabled
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                <input type="email" defaultValue={userProfile?.correo_electronico} disabled
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50 outline-none" />
              </div>
            </div>
          </section>

          {/* SuperAdmin: Red BioSafe */}
          {isSuperAdmin && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-slate-800">Red BioSafe (Establecimientos)</h2>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-emerald-600 transition"
                >
                  <Plus className="w-3 h-3" /> Nuevo
                </button>
              </div>

              {showForm && (
                <div className="mb-6 border border-emerald-100 bg-emerald-50/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-emerald-100/50 px-5 py-3 border-b border-emerald-100">
                    <h3 className="text-sm font-bold text-emerald-800">Alta de Nuevo Establecimiento</h3>
                    <p className="text-xs text-emerald-600">Se creará el centro y su cuenta administradora simultáneamente.</p>
                  </div>
                  <div className="p-5 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <Building2 className="w-3 h-3" /> 1. Datos del Centro Médico
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="text" placeholder="Nombre del centro" value={newEstablecimiento.nombre}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, nombre: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-400" />
                        <input type="text" placeholder="Ciudad / Municipio" value={newEstablecimiento.ciudad}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, ciudad: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-400" />
                        <select value={newEstablecimiento.tipo}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, tipo: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none bg-white focus:border-emerald-400">
                          <option value="Centro de Salud">Centro de Salud</option>
                          <option value="Farmacia">Farmacia</option>
                        </select>
                      </div>
                    </div>
                    <hr className="border-emerald-100" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <Shield className="w-3 h-3" /> 2. Cuenta de Administrador Local
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input type="text" placeholder="Nombre del encargado" value={newEstablecimiento.adminNombre}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, adminNombre: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-400" />
                        <input type="email" placeholder="Correo administrativo" value={newEstablecimiento.adminCorreo}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, adminCorreo: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-400" />
                        <input type="text" placeholder="Contraseña temporal" value={newEstablecimiento.adminPassword}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, adminPassword: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-400" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                        <input type="checkbox" checked={newEstablecimiento.enviarCorreo}
                          onChange={e => setNewEstablecimiento({ ...newEstablecimiento, enviarCorreo: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                        <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                          <Mail className="w-4 h-4 text-slate-400" /> Enviar credenciales por correo
                        </span>
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setShowForm(false)}
                        className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition">
                        Cancelar
                      </button>
                      <button onClick={handleCrearEstablecimiento}
                        className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
                        Crear Centro y Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Ubicación</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {establecimientos.map(est => (
                      <tr key={est.id_establecimiento} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{est.nombre_establecimiento}</td>
                        <td className="px-4 py-3">{est.ciudad_municipio}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${est.tipo === "Farmacia" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {est.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {deletingId === est.id_establecimiento ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                          ) : (
                            <button
                              onClick={() => handleEliminarEstablecimiento(est.id_establecimiento, est.nombre_establecimiento)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {establecimientos.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">No hay establecimientos registrados.</p>
                )}
              </div>
            </section>
          )}

          {/* AdminEstablecimiento: gestión de personal */}
          {isAdminEstablecimiento && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-slate-800">Gestión de Personal</h2>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-blue-600 transition"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>

              {showForm && (
                <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-lg space-y-4">
                  <h3 className="text-sm font-bold text-blue-800">Crear acceso para personal médico</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Nombre completo" value={newPersonal.nombre}
                      onChange={e => setNewPersonal({ ...newPersonal, nombre: e.target.value })}
                      className="px-3 py-2 text-sm border rounded outline-none" />
                    <input type="email" placeholder="Correo electrónico" value={newPersonal.correo}
                      onChange={e => setNewPersonal({ ...newPersonal, correo: e.target.value })}
                      className="px-3 py-2 text-sm border rounded outline-none" />
                    <select value={newPersonal.rol}
                      onChange={e => setNewPersonal({ ...newPersonal, rol: e.target.value })}
                      className="px-3 py-2 text-sm border rounded outline-none bg-white">
                      <option value="Medico">Médico</option>
                      <option value="Enfermero">Enfermero/a</option>
                      <option value="Farmaceutico">Farmacéutico/a</option>
                    </select>
                    <input type="text" placeholder="Contraseña temporal" value={newPersonal.password}
                      onChange={e => setNewPersonal({ ...newPersonal, password: e.target.value })}
                      className="px-3 py-2 text-sm border rounded outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded">
                      Cancelar
                    </button>
                    <button onClick={handleCrearPersonal}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm">
                      Crear Cuenta
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-3">Profesional</th>
                      <th className="px-4 py-3">Correo</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personal.map(p => (
                      <tr key={p.id_usuario} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {p.nombre_completo.charAt(0)}
                            </div>
                            {p.nombre_completo}
                          </div>
                        </td>
                        <td className="px-4 py-3">{p.correo_electronico}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                            {p.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {deletingId === p.id_usuario ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                          ) : (
                            <button
                              onClick={() => handleEliminarPersonal(p.id_usuario, p.nombre_completo)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {personal.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">Aún no hay personal registrado en este centro.</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── columna lateral ── */}
        <div className="space-y-6">

          {/* Notificaciones IA */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <BellRing className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Notificaciones IA</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Alertas de Brotes",     desc: "IA detecta anomalías regionales" },
                { label: "Recordatorios de Stock", desc: "Aviso de vacunas por vencer" },
                { label: "Reportes Semanales",     desc: "Envío automático al correo" },
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

          {/* Seguridad */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Seguridad</h2>
            </div>
            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition border border-slate-100">
              Cambiar Contraseña
            </button>
          </section>

          {/* Tarjeta BioSafe */}
          <div className="p-5 rounded-xl overflow-hidden relative" style={{ background: "#726E97" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-sm">B</span>
                </div>
                <span className="text-white font-bold text-lg tracking-tight">BioSafe</span>
              </div>
              <p className="text-white/90 text-sm font-medium leading-snug">
                Trabajando por la salud<br />de todos.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70 text-xs">Sistema operativo</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
