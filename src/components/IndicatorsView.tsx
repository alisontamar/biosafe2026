import { useState } from "react";
import {
  Building, CalendarDays, CheckCircle2, Syringe,
  Table, UserX, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";

// ── data ─────────────────────────────────────────────────────────────────────
const campData = [
  { mes: "Ene", cov: 74 }, { mes: "Feb", cov: 80 }, { mes: "Mar", cov: 88 },
  { mes: "Abr", cov: 85 }, { mes: "May", cov: 91 },
];

const trendData = [
  { mes: "Ene", pct: 58 }, { mes: "Feb", pct: 62 }, { mes: "Mar", pct: 66 },
  { mes: "Abr", pct: 68 }, { mes: "May", pct: 70 },
];

const vaccineRows = [
  { name: "BCG",          dosis: "1", prog: 412, appl: 404, cov: 98, group: "alta",    trend: +2 },
  { name: "Hepatitis B",  dosis: "1", prog: 412, appl: 391, cov: 95, group: "alta",    trend: +1 },
  { name: "Pentavalente", dosis: "3", prog: 400, appl: 348, cov: 87, group: "alta",    trend: +5 },
  { name: "Rotavirus",    dosis: "2", prog: 390, appl: 328, cov: 84, group: "alta",    trend: +3 },
  { name: "Neumococo",    dosis: "3", prog: 395, appl: 316, cov: 80, group: "baja",    trend: -1 },
  { name: "SRP",          dosis: "2", prog: 370, appl: 281, cov: 76, group: "baja",    trend: -3 },
  { name: "Varicela",     dosis: "1", prog: 350, appl: 214, cov: 61, group: "critica", trend: -8 },
];

const donutData = [
  { name: "Completos",   value: 287, color: "#7F77DD" },
  { name: "En proceso",  value: 82,  color: "#FAC775" },
  { name: "Abandonados", value: 43,  color: "#E24B4A" },
];

const dropData = [
  { name: "Varicela", n: 22 }, { name: "SRP", n: 12 }, { name: "Neumococo", n: 9 },
  { name: "Rotavirus", n: 6 }, { name: "Pentavalente", n: 4 }, { name: "Otros", n: 3 },
];

const alerts = [
  { color: "#A32D2D", bg: "#FCEBEB", text: "Varicela por debajo del 65% — 3er mes consecutivo.", level: "Crítica" },
  { color: "#854F0B", bg: "#FAEEDA", text: "SRP: 12 niños con cita vencida sin reprogramar.", level: "Alerta" },
  { color: "#854F0B", bg: "#FAEEDA", text: "Neumococo 3ra dosis: tasa de abandono subió 4 pp.", level: "Alerta" },
  { color: "#3B6D11", bg: "#EAF3DE", text: "BCG y HepB superan meta del 90%. ¡Bien!", level: "OK" },
];

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
  { key: "all",    label: "Todas" },
  { key: "alta",   label: "Cobertura alta" },
  { key: "baja",   label: "Cobertura baja" },
  { key: "critica",label: "Crítica" },
] as const;
type TabKey = typeof TABS[number]["key"];

// ── component ─────────────────────────────────────────────────────────────────
export function IndicatorsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const rows = activeTab === "all" ? vaccineRows : vaccineRows.filter(v => v.group === activeTab);

  return (
    <div className="space-y-5 p-4 sm:p-6 bg-slate-50 min-h-screen">

      {/* Centro header */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Building size={18} className="text-[#534AB7]" />
        <span>Centro de Salud <strong className="text-slate-800">Cotahuma</strong></span>
        <span className="ml-auto text-xs text-slate-400">Enero – Mayo 2025</span>
      </div>

      {/* KPI row */}
      <section>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Resumen general</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: "Niños registrados",  value: "412",   sub: "+8% vs mes ant.",  color: "#534AB7" },
            { label: "Cobertura promedio", value: "83%",   sub: "Meta: 90%",         color: "#534AB7" },
            { label: "Esquemas completos", value: "287",   sub: "69,7% del total",  color: "#3B6D11" },
            { label: "Dosis aplicadas",    value: "1.840", sub: "+12% vs mes ant.", color: "#534AB7" },
            { label: "Abandono",           value: "43",    sub: "10,4% del total",  color: "#A32D2D" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs text-slate-500 mb-1">{k.label}</p>
              <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cobertura por campaña + donut */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Bar chart campaigns */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <CalendarDays size={15} className="text-[#534AB7]" /> Cobertura por campaña
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={campData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
              <Tooltip formatter={(value: any) => [`${value ?? 0}%`, "Cobertura"]} />
              <ReferenceLine y={90} stroke="#E24B4A" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Meta 90%", position: "right", fontSize: 10, fill: "#E24B4A" }} />
              <Bar dataKey="cov" fill="#AFA9EC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#AFA9EC" }} />Cobertura %</span>
            <span className="flex items-center gap-1"><span className="w-5 inline-block border-t-2 border-dashed border-red-400" />Meta 90%</span>
          </div>
        </div>

        {/* Donut + trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#534AB7]" /> Estado de esquemas (412 niños)
          </p>
          <div className="flex items-center gap-5">
            <PieChart width={110} height={110}>
              <Pie data={donutData} cx={50} cy={50} innerRadius={34} outerRadius={50} dataKey="value" strokeWidth={0}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
            <div className="flex flex-col gap-2 flex-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-slate-700">{d.value} <span className="font-normal text-slate-400 text-[10px]">({Math.round(d.value/412*100)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tendencia de completitud</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 80]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
                <Tooltip formatter={(value: any) => [`${value ?? 0}%`, "Completitud"]} />
                <Line type="monotone" dataKey="pct" stroke="#7F77DD" strokeWidth={2} dot={{ r: 3, fill: "#7F77DD" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cobertura por tipo de vacuna */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Syringe size={15} className="text-[#534AB7]" /> Cobertura por tipo de vacuna
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={vaccineRows} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cov" orientation="left"  domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `${v}%`} />
            <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar yAxisId="cov" dataKey="cov"  name="Cobertura"      fill="#7F77DD" radius={[3,3,0,0]} />
            <Bar yAxisId="n"   dataKey="appl" name="Dosis aplicadas" fill="#5DCAA5" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#7F77DD]" />Cobertura</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#5DCAA5]" />Dosis aplicadas</span>
        </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Vacuna</th>
                <th className="text-left pb-2 font-medium">Dosis</th>
                <th className="text-left pb-2 font-medium">Programados</th>
                <th className="text-left pb-2 font-medium">Aplicados</th>
                <th className="text-left pb-2 font-medium min-w-[120px]">Cobertura</th>
                <th className="text-left pb-2 font-medium">Estado</th>
                <th className="text-left pb-2 font-medium">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.name} className="border-b border-slate-50">
                  <td className="py-2 font-semibold text-slate-700">{v.name}</td>
                  <td className="py-2 text-slate-500">{v.dosis}</td>
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
      </div>

      {/* Abandono + alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <UserX size={15} className="text-red-500" /> Análisis de abandono
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dropData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="n" name="Abandonos" fill="#F09595" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-600" /> Alertas del centro
          </p>
          <div className="flex flex-col gap-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: a.bg }}>
                <AlertTriangle size={14} style={{ color: a.color, marginTop: 2, flexShrink: 0 }} />
                <p className="text-xs flex-1 leading-relaxed" style={{ color: a.color }}>{a.text}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border" style={{ color: a.color, borderColor: a.color }}>{a.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default IndicatorsView;