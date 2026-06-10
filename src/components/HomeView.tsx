import { useState, useEffect } from "react";
import { UserRound, Baby, ShieldCheck, AlertTriangle, QrCode, Activity } from "lucide-react";
import { supabase } from "../lib/supabase";

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, detail, color }: {
  icon: React.ElementType; title: string; value: string | number; detail: string; color: string;
}) {
  const colors: Record<string, string> = {
    purple: "text-[#726E97] bg-purple-50",
    green:  "text-emerald-500 bg-emerald-50",
    blue:   "text-blue-500 bg-blue-50",
    red:    "text-red-500 bg-red-50",
  };
  const detailColor = detail.startsWith("+") ? "text-emerald-500" : "text-slate-400";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className={`text-xs ${detailColor}`}>{detail}</p>
    </div>
  );
}

// ── Acceso rápido a vacunación ────────────────────────────────────────────────
function QuickVaccinationCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#726E97]">
          <QrCode size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Registrar vacuna</h2>
          <p className="text-xs text-slate-400">Escanea el carnet QR del paciente para registrar la dosis</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border">
        El registro de dosis se realiza desde la sección <strong>Vacunación</strong>, donde puedes seleccionar la vacuna del catálogo oficial y escanear el código QR del paciente.
      </p>
      <button
        onClick={() => onNavigate?.("vacunacion")}
        className="w-full py-3 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition"
        style={{ background: "#726E97" }}
      >
        Ir a Vacunación
      </button>
    </div>
  );
}

// ── HomeView (main) ───────────────────────────────────────────────────────────
export function HomeView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [idEstablecimiento, setIdEstablecimiento] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ tutores: 0, ninos: 0, cobertura: "0%", alertas: 0 });
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [alertaReciente, setAlertaReciente] = useState<any>(null);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('usuarios')
        .select('id_establecimiento')
        .eq('id_usuario', session.user.id)
        .single();
      
      const estabId = profile?.id_establecimiento;
      setIdEstablecimiento(estabId);

      const { count: countTutores } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'Tutor_PersonaNormal');

      const hace5Anios = new Date();
      hace5Anios.setFullYear(hace5Anios.getFullYear() - 5);
      
      let queryNinos = supabase.from('pacientes').select('*', { count: 'exact', head: true }).gte('fecha_nacimiento', hace5Anios.toISOString().split('T')[0]);
      if (estabId) queryNinos = queryNinos.eq('id_establecimiento_registro', estabId);
      const { count: countNinos } = await queryNinos;

      let queryAlertas = supabase.from('alertas_epidemiologicas_ia').select('*', { count: 'exact', head: true });
      if (estabId) queryAlertas = queryAlertas.eq('id_establecimiento', estabId);
      const { count: countAlertas } = await queryAlertas;

      const { data: dosisData } = await supabase
        .from('dosis_aplicadas')
        .select(`
          fecha_vencimiento_proxima,
          pacientes ( nombre_completo ),
          cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero )
        `)
        .not('fecha_vencimiento_proxima', 'is', null)
        .gte('fecha_vencimiento_proxima', new Date().toISOString())
        .order('fecha_vencimiento_proxima', { ascending: true })
        .limit(4);

      let queryAlertaIA = supabase.from('alertas_epidemiologicas_ia').select('*').order('fecha_creacion', { ascending: false }).limit(1);
      if (estabId) queryAlertaIA = queryAlertaIA.eq('id_establecimiento', estabId);
      const { data: alertaIAData } = await queryAlertaIA;

      setStats({
        tutores: countTutores || 0,
        ninos: countNinos || 0,
        cobertura: "82,4%", 
        alertas: countAlertas || 0
      });

      if (dosisData) setPendientes(dosisData);
      if (alertaIAData && alertaIAData.length > 0) setAlertaReciente(alertaIAData[0]);

    } catch (error) {
      console.error("Error cargando Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFechaCorta = (fechaStr: string) => {
    const d = new Date(fechaStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#726E97]"></div></div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold text-[#726E97]">Resumen general</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        <StatCard icon={UserRound}    title="Padres de familia registrados" value={stats.tutores} detail="Registros activos"       color="purple" />
        <StatCard icon={Baby}         title="Niños(as) 0-5 años"            value={stats.ninos}   detail="En seguimiento local"    color="green"  />
        <StatCard icon={ShieldCheck}  title="Esquemas Completos"            value={stats.cobertura} detail="Estimación actual"     color="blue"   />
        <StatCard icon={AlertTriangle} title="Alertas Activas"              value={stats.alertas} detail="Emitidas por la IA"      color="red"    />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-5">Seguimiento de vacunación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-5 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#726E97" strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.824} ${2 * Math.PI * 40 * 0.176}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[9px] text-slate-400 leading-none">Cobertura</p>
                  <p className="text-xl font-bold text-[#726E97] leading-tight">{stats.cobertura}</p>
                  <p className="text-[9px] text-slate-400 leading-none">Meta: 90%</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Población protegida</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Próximas dosis pendientes</p>
              {pendientes.length > 0 ? (
                <div className="space-y-2">
                  {pendientes.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.pacientes?.nombre_completo || "Desconocido"}</p>
                        <p className="text-xs text-slate-400 truncate">{p.cat_vacunas_oficiales?.nombre_enfermedad} — {p.cat_vacunas_oficiales?.dosis_numero}</p>
                      </div>
                      <span className="text-xs text-red-500 font-semibold shrink-0 bg-red-50 px-2 py-1 rounded-lg">
                        {formatFechaCorta(p.fecha_vencimiento_proxima)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-slate-400 text-xs">No hay dosis pendientes en este centro.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-red-600 text-sm">Alertas epidemiológicas (IA)</h2>
              {alertaReciente && <span className="text-[10px] px-2 py-1 rounded-full bg-white text-red-500 border border-red-200 font-bold uppercase">{alertaReciente.nivel_riesgo || 'ALERTA'}</span>}
            </div>
            {alertaReciente ? (
              <>
                <p className="text-xs text-red-500 font-semibold text-right">{alertaReciente.titulo_riesgo}<br /><span className="font-normal">Notificación Reciente</span></p>
                <p className="text-[10px] text-red-400 mt-2 italic leading-tight text-right line-clamp-3">{alertaReciente.insight_texto}</p>
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center mt-6">No hay alertas epidemiológicas activas en tu región en este momento.</p>
            )}
          </div>
          
          {alertaReciente && (
            <>
              <svg viewBox="0 0 200 60" className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,45 L25,38 L50,42 L75,30 L100,35 L125,20 L150,28 L175,15 L200,22" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,45 L25,38 L50,42 L75,30 L100,35 L125,20 L150,28 L175,15 L200,22 L200,60 L0,60 Z" fill="url(#spark)" />
              </svg>
              <button className="w-full py-3 rounded-lg bg-[#726E97] text-white font-semibold text-sm hover:opacity-90 transition">
                Ver detalle de riesgo
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <QuickVaccinationCard onNavigate={onNavigate} />
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
           <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#726E97]">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Insights de riesgo <span className="text-[#726E97]">(IA)</span></h2>
              <p className="text-xs text-slate-400">Análisis epidemiológico en tiempo real</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border text-center">
            El motor de Inteligencia Artificial requiere más datos históricos de dosis aplicadas para generar la distribución por zona de calor y recomendaciones de acción precisas.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomeView;