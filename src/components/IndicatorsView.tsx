import { useState, useEffect } from "react";
import {
  Building, CalendarDays, CheckCircle2, Syringe,
  Table, UserX, AlertTriangle, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import { supabase } from "../lib/supabase";

// ── types ─────────────────────────────────────────────────────────────────────
type VaccineStat = {
  name: string;
  dosis: string;
  prog: number;
  appl: number;
  cov: number;
  group: "alta" | "baja" | "critica";
  trend: number;
};

type AlertItem = { color: string; bg: string; text: string; level: string };

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ── helpers ───────────────────────────────────────────────────────────────────
function StatusPill({ cov }: { cov: number }) {
  if (cov >= 90) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Óptima</span>;
  if (cov >= 75) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">En riesgo</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Crítica</span>;
}

function TrendBadge({ val }: { val: number }) {
  const up = val >= 0;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {up ? `+${val}%` : `${val}%`}
    </span>
  );
}

function CovBar({ cov }: { cov: number }) {
  const color = cov >= 90 ? "#639922" : cov >= 75 ? "#BA7517" : "#E24B4A";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 min-w-[50px]">
        <div className="h-full rounded-full" style={{ width: `${cov}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 min-w-[32px] text-right">{cov}%</span>
    </div>
  );
}

const TABS = [
  { key: "all",     label: "Todas" },
  { key: "alta",    label: "Cobertura alta" },
  { key: "baja",    label: "Cobertura baja" },
  { key: "critica", label: "Crítica" },
] as const;
type TabKey = typeof TABS[number]["key"];

function getVaccineGroup(cov: number): "alta" | "baja" | "critica" {
  if (cov >= 85) return "alta";
  if (cov >= 70) return "baja";
  return "critica";
}

function resolveAlertStyle(titulo: string, datos: any): { color: string; bg: string; level: string } {
  const nivel = (datos?.nivel || datos?.nivel_riesgo || "").toLowerCase();
  const title = titulo.toLowerCase();
  const isHigh = nivel.includes("alto") || nivel.includes("critic") || title.includes("alto") || title.includes("riesgo alto") || title.includes("crítico");
  const isMed  = nivel.includes("moderado") || nivel.includes("medio") || nivel.includes("warning") || title.includes("moderado") || title.includes("alerta");
  if (isHigh) return { color: "#A32D2D", bg: "#FCEBEB", level: "Crítica" };
  if (isMed)  return { color: "#854F0B", bg: "#FAEEDA", level: "Alerta" };
  return { color: "#3B6D11", bg: "#EAF3DE", level: "Info" };
}

// ── component ─────────────────────────────────────────────────────────────────
export function IndicatorsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [establecimiento, setEstablecimiento] = useState("Centro de Salud");

  const [totalPacientes, setTotalPacientes]   = useState(0);
  const [totalDosis, setTotalDosis]           = useState(0);
  const [totalAlertas, setTotalAlertas]       = useState(0);
  const [totalCompletos, setTotalCompletos]   = useState(0);
  const [totalAbandono, setTotalAbandono]     = useState(0);
  const [coberturaPromedio, setCoberturaPromedio] = useState(0);

  const [campData,     setCampData]     = useState<{ mes: string; cov: number }[]>([]);
  const [trendData,    setTrendData]    = useState<{ mes: string; pct: number }[]>([]);
  const [vaccineRows,  setVaccineRows]  = useState<VaccineStat[]>([]);
  const [donutData,    setDonutData]    = useState([
    { name: "Completos",   value: 0, color: "#7F77DD" },
    { name: "En proceso",  value: 0, color: "#FAC775" },
    { name: "Abandonados", value: 0, color: "#E24B4A" },
  ]);
  const [dropData,     setDropData]     = useState<{ name: string; n: number }[]>([]);
  const [alertsList,   setAlertsList]   = useState<AlertItem[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // User profile + establishment name
      const { data: profile } = await supabase
        .from("usuarios")
        .select("id_establecimiento, establecimientos(nombre_establecimiento)")
        .eq("id_usuario", session.user.id)
        .single();

      const estabId = profile?.id_establecimiento as string | null;
      const estData = profile?.establecimientos as any;
      const nombreEst = Array.isArray(estData)
        ? estData[0]?.nombre_establecimiento
        : estData?.nombre_establecimiento;
      if (nombreEst) setEstablecimiento(nombreEst);

      // Total patients
      const { count: cntPacientes } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true });
      const nPacientes = cntPacientes ?? 0;
      setTotalPacientes(nPacientes);

      // All doses with vaccine metadata (foundation for most charts)
      const { data: dosisData } = await supabase
        .from("dosis_aplicadas")
        .select(`
          id_paciente,
          fecha_aplicacion,
          fecha_vencimiento_proxima,
          cat_vacunas_oficiales (
            nombre_enfermedad,
            dosis_numero
          )
        `)
        .order("fecha_aplicacion", { ascending: true });

      const doses = dosisData ?? [];
      setTotalDosis(doses.length);

      const now = new Date();

      // ── Monthly campaign data (last 6 months) ───────────────────────────────
      const monthKeys: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
      }
      const monthlyCount = new Map<string, number>(monthKeys.map(k => [k, 0]));
      doses.forEach(d => {
        const key = `${new Date(d.fecha_aplicacion).getFullYear()}-${new Date(d.fecha_aplicacion).getMonth()}`;
        if (monthlyCount.has(key)) monthlyCount.set(key, (monthlyCount.get(key) ?? 0) + 1);
      });

      const campArr: { mes: string; cov: number }[] = [];
      const trendArr: { mes: string; pct: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const key  = `${d.getFullYear()}-${d.getMonth()}`;
        const cnt  = monthlyCount.get(key) ?? 0;
        const cov  = nPacientes > 0 ? Math.min(Math.round((cnt / nPacientes) * 100), 100) : 0;
        campArr.push({ mes: MONTH_NAMES[d.getMonth()], cov });
        trendArr.push({ mes: MONTH_NAMES[d.getMonth()], pct: cov });
      }
      setCampData(campArr);
      setTrendData(trendArr);

      // ── Per-vaccine stats ────────────────────────────────────────────────────
      const lastMonthStart = new Date(now); lastMonthStart.setMonth(now.getMonth() - 1);
      const prevMonthStart = new Date(now); prevMonthStart.setMonth(now.getMonth() - 2);

      const vaccineMap = new Map<string, {
        name: string;
        dosisNums: Set<string>;
        patients: Set<string>;
        appl: number;
        lastMonth: number;
        prevMonth: number;
      }>();

      doses.forEach(d => {
        const vac = d.cat_vacunas_oficiales as any;
        if (!vac) return;
        const name = vac.nombre_enfermedad as string;
        if (!vaccineMap.has(name)) {
          vaccineMap.set(name, { name, dosisNums: new Set(), patients: new Set(), appl: 0, lastMonth: 0, prevMonth: 0 });
        }
        const entry = vaccineMap.get(name)!;
        entry.dosisNums.add(vac.dosis_numero);
        entry.patients.add(d.id_paciente);
        entry.appl++;
        const date = new Date(d.fecha_aplicacion);
        if (date >= lastMonthStart)      entry.lastMonth++;
        else if (date >= prevMonthStart) entry.prevMonth++;
      });

      const vacRows: VaccineStat[] = Array.from(vaccineMap.values()).map(v => {
        const cov   = nPacientes > 0 ? Math.min(Math.round((v.patients.size / nPacientes) * 100), 100) : 0;
        const trend = v.prevMonth > 0
          ? Math.round(((v.lastMonth - v.prevMonth) / v.prevMonth) * 100)
          : v.lastMonth > 0 ? 100 : 0;
        return {
          name:  v.name,
          dosis: String(v.dosisNums.size),
          prog:  nPacientes,
          appl:  v.patients.size,
          cov,
          group: getVaccineGroup(cov),
          trend,
        };
      }).sort((a, b) => b.cov - a.cov);

      setVaccineRows(vacRows);
      const avgCov = vacRows.length > 0
        ? Math.round(vacRows.reduce((s, v) => s + v.cov, 0) / vacRows.length)
        : 0;
      setCoberturaPromedio(avgCov);

      // ── Donut: patient schema status ─────────────────────────────────────────
      const patientStatus = new Map<string, { overdue: boolean; upcoming: boolean }>();
      doses.forEach(d => {
        if (!patientStatus.has(d.id_paciente))
          patientStatus.set(d.id_paciente, { overdue: false, upcoming: false });
        const ps = patientStatus.get(d.id_paciente)!;
        if (d.fecha_vencimiento_proxima) {
          if (new Date(d.fecha_vencimiento_proxima) < now) ps.overdue = true;
          else ps.upcoming = true;
        }
      });

      let completos = 0, enProceso = 0, abandonados = 0;
      patientStatus.forEach(ps => {
        if (ps.overdue && !ps.upcoming) abandonados++;
        else if (ps.upcoming)           enProceso++;
        else                            completos++;
      });
      // patients with no doses yet go into "en proceso"
      enProceso += Math.max(0, nPacientes - patientStatus.size);

      setTotalCompletos(completos);
      setTotalAbandono(abandonados);
      setDonutData([
        { name: "Completos",   value: completos,   color: "#7F77DD" },
        { name: "En proceso",  value: enProceso,   color: "#FAC775" },
        { name: "Abandonados", value: abandonados, color: "#E24B4A" },
      ]);

      // ── Dropoff (overdue next-dose per vaccine) ──────────────────────────────
      const dropMap = new Map<string, number>();
      doses.forEach(d => {
        const vac = d.cat_vacunas_oficiales as any;
        if (!vac || !d.fecha_vencimiento_proxima) return;
        if (new Date(d.fecha_vencimiento_proxima) < now) {
          dropMap.set(vac.nombre_enfermedad, (dropMap.get(vac.nombre_enfermedad) ?? 0) + 1);
        }
      });
      const dropArr = Array.from(dropMap.entries())
        .map(([name, n]) => ({ name, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 6);
      setDropData(dropArr);

      // ── Epidemiological alerts ───────────────────────────────────────────────
      const { count: cntAlertas } = await supabase
        .from("alertas_epidemiologicas_ia")
        .select("*", { count: "exact", head: true });
      setTotalAlertas(cntAlertas ?? 0);

      let alertQuery = supabase
        .from("alertas_epidemiologicas_ia")
        .select("titulo_riesgo, insight_texto, datos_clima_oms")
        .order("fecha_creacion", { ascending: false })
        .limit(5);
      if (estabId) alertQuery = alertQuery.eq("id_establecimiento", estabId);

      const { data: alertasData } = await alertQuery;
      if (alertasData && alertasData.length > 0) {
        setAlertsList(alertasData.map(a => {
          const { color, bg, level } = resolveAlertStyle(a.titulo_riesgo, a.datos_clima_oms);
          const preview = (a.insight_texto ?? "").substring(0, 100);
          return {
            color, bg, level,
            text: `${a.titulo_riesgo} — ${preview}${preview.length >= 100 ? "…" : ""}`,
          };
        }));
      } else {
        setAlertsList([]);
      }

    } catch (err) {
      console.error("Error cargando indicadores:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#726E97]" />
      </div>
    );
  }

  const rows = activeTab === "all" ? vaccineRows : vaccineRows.filter(v => v.group === activeTab);
  const totalDonutValue = donutData.reduce((s, d) => s + d.value, 0);
  const hasVaccineData  = vaccineRows.length > 0;
  const hasCampData     = campData.some(c => c.cov > 0);

  return (
    <div className="space-y-5 p-4 sm:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Building size={18} className="text-[#534AB7]" />
        <span>Centro de Salud <strong className="text-slate-800">{establecimiento}</strong></span>
        <button
          onClick={loadData}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#534AB7] transition"
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* KPI row */}
      <section>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Resumen general</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {[
            {
              label: "Niños registrados",
              value: totalPacientes.toLocaleString(),
              sub:   "Pacientes en sistema",
              color: "#534AB7",
            },
            {
              label: "Cobertura promedio",
              value: `${coberturaPromedio}%`,
              sub:   "Meta: 90%",
              color: "#534AB7",
            },
            {
              label: "Esquemas completos",
              value: totalCompletos.toLocaleString(),
              sub:   totalPacientes > 0 ? `${Math.round((totalCompletos / totalPacientes) * 100)}% del total` : "—",
              color: "#3B6D11",
            },
            {
              label: "Dosis aplicadas",
              value: totalDosis.toLocaleString(),
              sub:   "Total registradas",
              color: "#534AB7",
            },
            {
              label: "Abandono",
              value: totalAbandono.toLocaleString(),
              sub:   totalPacientes > 0 ? `${Math.round((totalAbandono / totalPacientes) * 100)}% del total` : "—",
              color: "#A32D2D",
            },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4">
              <p className="text-xs text-slate-500 mb-1">{k.label}</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-tight">{k.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cobertura por mes + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar chart months */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <CalendarDays size={15} className="text-[#534AB7]" /> Dosis aplicadas por mes
          </p>
          {hasCampData ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={campData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
                  <Tooltip formatter={(value: any) => [`${value ?? 0}%`, "% de pacientes"]} />
                  <ReferenceLine y={90} stroke="#E24B4A" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Meta 90%", position: "right", fontSize: 10, fill: "#E24B4A" }} />
                  <Bar dataKey="cov" fill="#AFA9EC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#AFA9EC" }} />% Pacientes vacunados</span>
                <span className="flex items-center gap-1"><span className="w-5 inline-block border-t-2 border-dashed border-red-400" />Meta 90%</span>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
              Sin dosis registradas en los últimos 6 meses
            </div>
          )}
        </div>

        {/* Donut + trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#534AB7]" /> Estado de esquemas ({totalPacientes} niños)
          </p>
          <div className="flex items-center gap-5">
            {totalDonutValue > 0 ? (
              <PieChart width={110} height={110}>
                <Pie data={donutData} cx={50} cy={50} innerRadius={34} outerRadius={50} dataKey="value" strokeWidth={0}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            ) : (
              <div className="w-[110px] h-[110px] rounded-full border-[12px] border-slate-100 flex-shrink-0 flex items-center justify-center">
                <span className="text-xs text-slate-300">—</span>
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {d.value}
                    {totalPacientes > 0 && (
                      <span className="font-normal text-slate-400 text-[10px]">
                        {" "}({Math.round((d.value / totalPacientes) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tendencia de cobertura mensual</p>
            {hasCampData ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
                  <Tooltip formatter={(value: any) => [`${value ?? 0}%`, "Cobertura"]} />
                  <Line type="monotone" dataKey="pct" stroke="#7F77DD" strokeWidth={2} dot={{ r: 3, fill: "#7F77DD" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[80px] flex items-center justify-center text-xs text-slate-300">
                Sin datos históricos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cobertura por tipo de vacuna */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Syringe size={15} className="text-[#534AB7]" /> Cobertura por tipo de vacuna
        </p>
        {hasVaccineData ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vaccineRows} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="cov" orientation="left"  domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar yAxisId="cov" dataKey="cov"  name="Cobertura"        fill="#7F77DD" radius={[3,3,0,0]} />
                <Bar yAxisId="n"   dataKey="appl" name="Pacientes únicos" fill="#5DCAA5" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#7F77DD]" />Cobertura %</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#5DCAA5]" />Pacientes únicos</span>
            </div>
          </>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
            No hay dosis registradas en el catálogo
          </div>
        )}
      </div>

      {/* Tabla detalle */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Table size={15} className="text-[#534AB7]" /> Detalle por vacuna
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-xs px-3 py-1 rounded-full border transition ${activeTab === t.key ? "bg-[#EEEDFE] text-[#3C3489] border-[#AFA9EC]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {rows.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-2">
              {rows.map(v => (
                <div key={v.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate">{v.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{v.appl} pac. · {v.dosis} variante(s)</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CovBar cov={v.cov} />
                    <StatusPill cov={v.cov} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left pb-2 font-medium">Vacuna</th>
                    <th className="text-left pb-2 font-medium">Variantes</th>
                    <th className="text-left pb-2 font-medium">Programados</th>
                    <th className="text-left pb-2 font-medium">Pac. únicos</th>
                    <th className="text-left pb-2 font-medium min-w-[110px]">Cobertura</th>
                    <th className="text-left pb-2 font-medium">Estado</th>
                    <th className="text-left pb-2 font-medium">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(v => (
                    <tr key={v.name} className="border-b border-slate-50">
                      <td className="py-2 font-semibold text-slate-700">{v.name}</td>
                      <td className="py-2 text-slate-500 text-center">{v.dosis}</td>
                      <td className="py-2 text-slate-500">{v.prog}</td>
                      <td className="py-2 text-slate-500">{v.appl}</td>
                      <td className="py-2"><CovBar cov={v.cov} /></td>
                      <td className="py-2"><StatusPill cov={v.cov} /></td>
                      <td className="py-2"><TrendBadge val={v.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            {vaccineRows.length === 0
              ? "No hay dosis registradas aún."
              : "No hay vacunas en esta categoría."}
          </p>
        )}
      </div>

      {/* Abandono + alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <UserX size={15} className="text-red-500" /> Análisis de abandono (dosis vencidas)
          </p>
          {dropData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dropData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="n" name="Dosis vencidas" fill="#F09595" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
              Sin dosis vencidas registradas
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-600" /> Alertas epidemiológicas ({totalAlertas})
          </p>
          {alertsList.length > 0 ? (
            <div className="flex flex-col gap-3">
              {alertsList.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: a.bg }}>
                  <AlertTriangle size={14} style={{ color: a.color, marginTop: 2, flexShrink: 0 }} />
                  <p className="text-xs flex-1 leading-relaxed" style={{ color: a.color }}>{a.text}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border" style={{ color: a.color, borderColor: a.color }}>{a.level}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50">
              <AlertTriangle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs flex-1 leading-relaxed text-emerald-700">No hay alertas epidemiológicas activas en el sistema.</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-emerald-400 text-emerald-600">OK</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default IndicatorsView;
