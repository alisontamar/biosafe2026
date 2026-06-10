import { useState, useEffect } from "react";
import {
  Search, UserPlus, Eye, X, Loader2, Link as LinkIcon, Mail, Syringe,
} from "lucide-react";
import { supabase, supabaseAdmin } from "../lib/supabase";

function formatFecha(f: string) {
  const d = new Date(f);
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
}

export default function PatientsView() {
  const [patients, setPatients]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [userRole, setUserRole]     = useState("");
  const [overdueSet, setOverdueSet] = useState<Set<string>>(new Set());

  // Modal alta
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPatient, setNewPatient]     = useState({
    nombre_completo: "", fecha_nacimiento: "", sexo: "M",
    correo: "", embarazada: false, tiene_hijos: false,
  });

  // Panel historial
  const [historialPaciente, setHistorialPaciente] = useState<any | null>(null);
  const [historialDosis, setHistorialDosis]       = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial]   = useState(false);

  useEffect(() => { cargarPacientes(); }, []);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Perfil del usuario logueado
      const { data: profile } = await supabase
        .from("usuarios")
        .select("rol, id_establecimiento")
        .eq("id_usuario", session.user.id)
        .single();

      const role    = profile?.rol ?? "";
      const estabId = profile?.id_establecimiento ?? null;
      setUserRole(role);

      // IDs de pacientes con dosis vencidas
      const { data: overdueData } = await supabase
        .from("dosis_aplicadas")
        .select("id_paciente")
        .not("fecha_vencimiento_proxima", "is", null)
        .lt("fecha_vencimiento_proxima", new Date().toISOString());
      setOverdueSet(new Set(overdueData?.map(d => d.id_paciente) ?? []));

      // Construir query de pacientes
      let baseQuery = supabase
        .from("pacientes")
        .select("*, usuarios!pacientes_id_tutor_registro_fkey ( nombre_completo, correo_electronico )")
        .order("fecha_registro", { ascending: false });

      if (role !== "SuperAdmin" && estabId) {
        // Solo pacientes cuyo tutor pertenece al mismo establecimiento
        const { data: tutores } = await supabase
          .from("usuarios")
          .select("id_usuario")
          .eq("id_establecimiento", estabId);

        const tutorIds = tutores?.map(u => u.id_usuario) ?? [];
        if (tutorIds.length === 0) {
          setPatients([]);
          return;
        }
        baseQuery = baseQuery.in("id_tutor_registro", tutorIds);
      }

      const { data: pacientesData, error } = await baseQuery;
      if (error) throw error;
      setPatients(pacientesData || []);

    } catch (err) {
      console.error("Error cargando pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const verHistorial = async (paciente: any) => {
    setHistorialPaciente(paciente);
    setHistorialDosis([]);
    setLoadingHistorial(true);
    const { data } = await supabase
      .from("dosis_aplicadas")
      .select(`
        fecha_aplicacion, fecha_vencimiento_proxima, lote, origen_registro,
        cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero ),
        usuarios ( nombre_completo )
      `)
      .eq("id_paciente", paciente.id_paciente)
      .order("fecha_aplicacion", { ascending: false });
    setHistorialDosis(data ?? []);
    setLoadingHistorial(false);
  };

  const handleGuardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: adminProfile } = await supabase
        .from("usuarios")
        .select("id_establecimiento")
        .eq("id_usuario", session?.user.id)
        .single();

      const passwordTemporal = `BioSafe${new Date().getFullYear()}*`;

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newPatient.correo,
        password: passwordTemporal,
        email_confirm: true,
      });
      if (authError) throw authError;

      const idUsuarioCreado = authData.user.id;

      const { error: errUsuario } = await supabase.from("usuarios").insert([{
        id_usuario:         idUsuarioCreado,
        id_establecimiento: adminProfile?.id_establecimiento,
        nombre_completo:    newPatient.nombre_completo,
        correo_electronico: newPatient.correo,
        password_hash:      passwordTemporal,
        rol:                "Tutor_PersonaNormal",
        tiene_hijos:        newPatient.tiene_hijos,
      }]);
      if (errUsuario) throw errUsuario;

      const tokenUnico = crypto.randomUUID();
      const { error: errPaciente } = await supabase.from("pacientes").insert([{
        id_tutor_registro: idUsuarioCreado,
        nombre_completo:   newPatient.nombre_completo,
        fecha_nacimiento:  newPatient.fecha_nacimiento,
        sexo:              newPatient.sexo,
        es_embarazada:     newPatient.sexo === "F" ? newPatient.embarazada : false,
        codigo_qr_token:   tokenUnico,
      }]);
      if (errPaciente) throw errPaciente;

      alert(`✅ Paciente registrado.\n\nCorreo: ${newPatient.correo}\nContraseña temporal: ${passwordTemporal}`);
      setIsModalOpen(false);
      setNewPatient({ nombre_completo: "", fecha_nacimiento: "", sexo: "M", correo: "", embarazada: false, tiene_hijos: false });
      cargarPacientes();

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return "Desconocida";
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
    if (hoy.getDate() < nac.getDate()) meses--;
    if (meses < 0)  return "Recién nacido";
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    return anos === 1 ? "1 año" : `${anos} años`;
  };

  const filteredPatients = patients.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.usuarios?.correo_electronico && p.usuarios.correo_electronico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#726E97]">Pacientes</h1>
          {userRole !== "SuperAdmin" && (
            <p className="text-xs text-slate-400 mt-0.5">Mostrando pacientes de tu establecimiento</p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#726E97] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#5f5a82] transition w-full sm:w-auto shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Alta de Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20"
            />
          </div>
        </div>

        {/* ── Mobile: tarjetas ── */}
        <div className="sm:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#726E97]" />
              Cargando...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No se encontraron pacientes.</div>
          ) : filteredPatients.map(p => {
            const enMora = overdueSet.has(p.id_paciente);
            return (
              <div key={p.id_paciente} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${p.sexo === "F" ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500"}`}>
                  {p.nombre_completo.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.nombre_completo}</p>
                    {enMora
                      ? <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">EN MORA</span>
                      : <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full shrink-0">AL DÍA</span>
                    }
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {calcularEdad(p.fecha_nacimiento)} · {p.sexo === "F" ? "Femenino" : "Masculino"}
                    {p.es_embarazada && " · Embarazada"}
                  </p>
                  {p.usuarios && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <LinkIcon className="w-3 h-3 text-emerald-400" />
                      <span className="truncate">{p.usuarios.correo_electronico}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => verHistorial(p)}
                  className="p-2 hover:bg-[#EEEDFE] rounded-lg transition text-slate-400 hover:text-[#726E97] shrink-0"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Desktop: tabla ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-4 font-medium">Paciente</th>
                <th className="text-left p-4 font-medium">Edad / Sexo</th>
                <th className="text-left p-4 font-medium">Acceso App</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="p-4 text-right font-medium">Historial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#726E97]" />
                    Cargando...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No se encontraron pacientes.</td>
                </tr>
              ) : (
                filteredPatients.map(p => {
                  const enMora = overdueSet.has(p.id_paciente);
                  return (
                    <tr key={p.id_paciente} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${p.sexo === "F" ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500"}`}>
                            {p.nombre_completo.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{p.nombre_completo}</span>
                            {p.es_embarazada && (
                              <span className="text-[9px] text-pink-500 font-bold uppercase tracking-wider">Embarazada</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {calcularEdad(p.fecha_nacimiento)}{" "}
                        <span className="text-slate-400">({p.sexo})</span>
                      </td>
                      <td className="p-4">
                        {p.usuarios ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                              <LinkIcon className="w-3 h-3 text-emerald-500" /> Vinculado
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{p.usuarios.correo_electronico}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">Sin acceso</span>
                        )}
                      </td>
                      <td className="p-4">
                        {enMora
                          ? <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">EN MORA</span>
                          : <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600">AL DÍA</span>
                        }
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => verHistorial(p)}
                          className="p-1.5 hover:bg-[#EEEDFE] rounded-lg transition text-slate-400 hover:text-[#726E97]"
                          title="Ver historial"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel historial de vacunación ── */}
      {historialPaciente && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setHistorialPaciente(null)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${historialPaciente.sexo === "F" ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500"}`}>
                    {historialPaciente.nombre_completo.charAt(0)}
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{historialPaciente.nombre_completo}</p>
                </div>
                <p className="text-xs text-slate-400 ml-10">
                  {calcularEdad(historialPaciente.fecha_nacimiento)} · {historialPaciente.sexo === "F" ? "Femenino" : "Masculino"}
                </p>
              </div>
              <button
                onClick={() => setHistorialPaciente(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Subheader */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5 text-[#726E97]" />
                Historial de vacunación
              </p>
            </div>

            {/* Dosis list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingHistorial ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#726E97]" />
                </div>
              ) : historialDosis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Syringe className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">Sin dosis registradas</p>
                  <p className="text-xs text-slate-300 mt-1">No se han aplicado vacunas aún</p>
                </div>
              ) : (
                historialDosis.map((d, i) => {
                  const vac         = d.cat_vacunas_oficiales as any;
                  const atendedor   = d.usuarios as any;
                  const esMigrado   = d.origen_registro === "Migrado_Cartilla_Fisica";
                  const tieneProx   = !!d.fecha_vencimiento_proxima;
                  const proxVencida = tieneProx && new Date(d.fecha_vencimiento_proxima) < new Date();

                  return (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">
                            {vac?.nombre_enfermedad ?? "Vacuna"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{vac?.dosis_numero}</p>
                        </div>
                        {esMigrado ? (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                            Migrado
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                            Aplicado
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                        <p>📅 Aplicado: <span className="font-medium text-slate-700">{formatFecha(d.fecha_aplicacion)}</span></p>
                        {d.lote && <p>🏷 Lote: <span className="font-medium text-slate-700">{d.lote}</span></p>}
                        {atendedor?.nombre_completo && (
                          <p>👤 Por: <span className="font-medium text-slate-700">{atendedor.nombre_completo}</span></p>
                        )}
                        {tieneProx && (
                          <p className={proxVencida ? "text-red-500 font-semibold" : "text-slate-500"}>
                            {proxVencida ? "⚠️ Vencida:" : "⏭ Próx. dosis:"}{" "}
                            <span className="font-medium">{formatFecha(d.fecha_vencimiento_proxima)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer con total */}
            {!loadingHistorial && historialDosis.length > 0 && (
              <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50">
                <p className="text-xs text-slate-500 text-center">
                  <span className="font-bold text-[#726E97]">{historialDosis.length}</span> dosis registradas en total
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal alta de paciente ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#726E97]" /> Alta de Nuevo Paciente
                </h2>
                <p className="text-[10px] text-slate-500 mt-1">Se creará su expediente clínico y su acceso a la app móvil.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPaciente} className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Datos Clínicos</h3>
                <div className="space-y-3">
                  <input
                    type="text" required placeholder="Nombre Completo"
                    value={newPatient.nombre_completo}
                    onChange={e => setNewPatient({ ...newPatient, nombre_completo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 focus:border-[#726E97] transition"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date" required max={new Date().toISOString().split("T")[0]}
                      value={newPatient.fecha_nacimiento}
                      onChange={e => setNewPatient({ ...newPatient, fecha_nacimiento: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 transition"
                    />
                    <select
                      value={newPatient.sexo}
                      onChange={e => setNewPatient({ ...newPatient, sexo: e.target.value, embarazada: false })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 transition bg-white"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  {newPatient.sexo === "F" && (
                    <label className="flex items-center gap-2 cursor-pointer bg-pink-50 border border-pink-100 p-3 rounded-lg w-fit">
                      <input
                        type="checkbox" checked={newPatient.embarazada}
                        onChange={e => setNewPatient({ ...newPatient, embarazada: e.target.checked })}
                        className="w-4 h-4 text-pink-500 rounded"
                      />
                      <span className="text-xs font-semibold text-pink-700">Paciente en estado de gestación</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Acceso Digital</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email" required placeholder="Correo electrónico del paciente"
                      value={newPatient.correo}
                      onChange={e => setNewPatient({ ...newPatient, correo: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 transition"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-100 p-3 rounded-lg w-fit">
                    <input
                      type="checkbox" checked={newPatient.tiene_hijos}
                      onChange={e => setNewPatient({ ...newPatient, tiene_hijos: e.target.checked })}
                      className="w-4 h-4 text-[#726E97] rounded"
                    />
                    <span className="text-xs font-semibold text-slate-700">El paciente tiene hijos a su cargo</span>
                  </label>
                </div>
                <p className="text-[10px] text-emerald-600 mt-3 font-medium">
                  ✓ El sistema enviará automáticamente una clave de acceso a este correo.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#726E97] text-white rounded-lg text-sm font-bold hover:bg-[#5f5a82] transition shadow-sm flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isSubmitting ? "Registrando..." : "Crear Paciente y Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
