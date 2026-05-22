import { useState, useEffect } from "react";
import { Search, UserPlus, MoreVertical, X, Loader2, Link as LinkIcon, Mail } from "lucide-react";
// Importamos ambos clientes para poder crear la credencial de Auth
import { supabase, supabaseAdmin } from "../lib/supabase";

export default function PatientsView() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para el Modal de Alta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado del nuevo paciente/usuario
  const [newPatient, setNewPatient] = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    sexo: 'M',
    correo: '',
    embarazada: false,
    tiene_hijos: false
  });

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Traemos pacientes con la info de su usuario vinculado
      let query = supabase
        .from('pacientes')
        .select(`
          *,
          usuarios!pacientes_id_tutor_registro_fkey ( nombre_completo, correo_electronico )
        `)
        .order('fecha_registro', { ascending: false });
      
      const { data: pacientesData, error } = await query;
      
      if (error) throw error;
      setPatients(pacientesData || []);

    } catch (error) {
      console.error("Error cargando pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Obtenemos el ID del establecimiento del Admin actual
      const { data: { session } } = await supabase.auth.getSession();
      const { data: adminProfile } = await supabase
        .from('usuarios')
        .select('id_establecimiento')
        .eq('id_usuario', session?.user.id)
        .single();

      // 2. CREAMOS LA CUENTA DE ACCESO PARA LA APP (Auth Real)
      const passwordTemporal = `BioSafe${new Date().getFullYear()}*`; 
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newPatient.correo,
        password: passwordTemporal,
        email_confirm: true 
      });

      if (authError) throw authError;
      
      const idUsuarioCreado = authData.user.id;

      // 3. GUARDAMOS SU PERFIL DE USUARIO EN TU TABLA EXACTA
      const { error: errUsuario } = await supabase.from('usuarios').insert([{
        id_usuario: idUsuarioCreado,
        id_establecimiento: adminProfile?.id_establecimiento, // Aquí sí existe la columna y vinculamos al tutor con la clínica
        nombre_completo: newPatient.nombre_completo,
        correo_electronico: newPatient.correo,
        password_hash: passwordTemporal,
        rol: 'Tutor_PersonaNormal',
        tiene_hijos: newPatient.tiene_hijos
      }]);

      if (errUsuario) throw errUsuario;

      // 4. CREAMOS SU IDENTIDAD DE PACIENTE FÍSICO (Sin la columna de establecimiento)
      const tokenUnico = crypto.randomUUID(); 
      
      const { error: errPaciente } = await supabase.from('pacientes').insert([{
        id_tutor_registro: idUsuarioCreado, // Se auto-asigna como su propio tutor
        nombre_completo: newPatient.nombre_completo,
        fecha_nacimiento: newPatient.fecha_nacimiento,
        sexo: newPatient.sexo,
        es_embarazada: newPatient.sexo === 'F' ? newPatient.embarazada : false,
        codigo_qr_token: tokenUnico
      }]);

      if (errPaciente) throw errPaciente;

      // 5. Éxito: Limpiamos y recargamos
      alert(`✅ Paciente registrado con éxito.\n\nSimulación de correo enviado a: ${newPatient.correo}\nContraseña temporal asignada: ${passwordTemporal}`);
      
      setIsModalOpen(false);
      setNewPatient({ nombre_completo: '', fecha_nacimiento: '', sexo: 'M', correo: '', embarazada: false, tiene_hijos: false });
      cargarPacientes();

    } catch (error: any) {
      console.error("Error al guardar paciente:", error);
      alert(`Hubo un error: ${error.message}`);
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

    if (meses < 0) return "Recién nacido";
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    return anos === 1 ? `1 año` : `${anos} años`;
  };

  const filteredPatients = patients.filter(p => 
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.usuarios?.correo_electronico && p.usuarios.correo_electronico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#726E97]">Pacientes</h1>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-4 font-medium">Paciente</th>
                <th className="text-left p-4 font-medium">Edad / Sexo</th>
                <th className="text-left p-4 font-medium">Acceso App Móvil</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#726E97]" />
                    Cargando historial...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id_paciente} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.sexo === 'F' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>
                        {p.nombre_completo.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span>{p.nombre_completo}</span>
                        {p.es_embarazada && <span className="text-[9px] text-pink-500 font-bold uppercase tracking-wider">Embarazada</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {calcularEdad(p.fecha_nacimiento)} <span className="text-slate-400">({p.sexo})</span>
                    </td>
                    <td className="p-4">
                      {p.usuarios ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-emerald-500" /> Vinculado
                          </span>
                          <span className="text-[10px] text-slate-400">{p.usuarios.correo_electronico}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">
                          Sin acceso app
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600">
                        AL DÍA
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded transition">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#726E97]" />
                  Alta de Nuevo Paciente
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
                    type="text" 
                    required
                    placeholder="Nombre Completo"
                    value={newPatient.nombre_completo}
                    onChange={e => setNewPatient({...newPatient, nombre_completo: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 focus:border-[#726E97] transition"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="date" 
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={newPatient.fecha_nacimiento}
                      onChange={e => setNewPatient({...newPatient, fecha_nacimiento: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 focus:border-[#726E97] transition"
                    />
                    <select 
                      value={newPatient.sexo}
                      onChange={e => setNewPatient({...newPatient, sexo: e.target.value, embarazada: false})} 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 focus:border-[#726E97] transition bg-white"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  
                  {newPatient.sexo === 'F' && (
                    <label className="flex items-center gap-2 cursor-pointer bg-pink-50 border border-pink-100 p-3 rounded-lg w-fit">
                      <input 
                        type="checkbox" 
                        checked={newPatient.embarazada}
                        onChange={e => setNewPatient({...newPatient, embarazada: e.target.checked})}
                        className="w-4 h-4 text-pink-500 rounded border-slate-300 focus:ring-pink-500"
                      />
                      <span className="text-xs font-semibold text-pink-700">Paciente en estado de gestación</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Acceso Digital (App Móvil)</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder="Correo electrónico del paciente"
                      value={newPatient.correo}
                      onChange={e => setNewPatient({...newPatient, correo: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20 focus:border-[#726E97] transition"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-100 p-3 rounded-lg w-fit">
                    <input 
                      type="checkbox" 
                      checked={newPatient.tiene_hijos}
                      onChange={e => setNewPatient({...newPatient, tiene_hijos: e.target.checked})}
                      className="w-4 h-4 text-[#726E97] rounded border-slate-300 focus:ring-[#726E97]"
                    />
                    <span className="text-xs font-semibold text-slate-700">El paciente tiene hijos a su cargo</span>
                  </label>
                </div>
                <p className="text-[10px] text-emerald-600 mt-3 font-medium flex items-center gap-1">
                  ✓ El sistema enviará automáticamente una clave de acceso a este correo.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#726E97] text-white rounded-lg text-sm font-bold hover:bg-[#5f5a82] transition shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isSubmitting ? 'Registrando y Creando App...' : 'Crear Paciente y Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}