import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Clock, Info, MapPin, RefreshCw, Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import AlertsHeatMap from "./AlertsHeatMap";

export type Alerta = Record<string, any> & {
  titulo?: string;
  resumen?: string;
  nivel?: string;
  activa?: boolean;
  fecha_generacion?: string;
};

type Nivel = "alto" | "medio" | "bajo";

export function nivelDe(a: Alerta): Nivel {
  const n = String(a.nivel ?? a.nivel_riesgo ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/alt|crit|grave|rojo/.test(n)) return "alto";
  if (/med|moder|amar|ambar/.test(n)) return "medio";
  return "bajo";
}

const NIVEL_UI: Record<Nivel, { label: string; badge: string; box: string; icon: string; Icon: React.ElementType }> = {
  alto:  { label: "Alto",  badge: "bg-red-50 text-red-500 border-red-200",             box: "bg-red-50 border-red-100",         icon: "text-red-500",     Icon: AlertCircle },
  medio: { label: "Medio", badge: "bg-amber-50 text-amber-700 border-amber-200",       box: "bg-amber-50 border-amber-100",     icon: "text-amber-500",   Icon: AlertTriangle },
  bajo:  { label: "Bajo",  badge: "bg-emerald-50 text-emerald-700 border-emerald-200", box: "bg-emerald-50 border-emerald-100", icon: "text-emerald-500", Icon: Info },
};

export function tiempoRelativo(f?: string) {
  if (!f) return "Sin fecha";
  const min = Math.floor((Date.now() - new Date(f).getTime()) / 60000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Hace ${d} ${d === 1 ? "día" : "días"}`;
  return new Date(f).toLocaleDateString("es-BO");
}

function ubicacion(a: Alerta) {
  return [a.municipio, a.departamento, a.zona].filter(Boolean).join(" - ");
}

// Campos ya mostrados de forma destacada; el resto va en "Más información"
const CAMPOS_OCULTOS = new Set(["titulo", "resumen", "nivel", "nivel_riesgo", "activa", "fecha_generacion", "municipio", "departamento", "zona"]);

export function AlertDetailModal({ alerta, onClose, onVerTodas }: { alerta: Alerta; onClose: () => void; onVerTodas?: () => void }) {
  const ui = NIVEL_UI[nivelDe(alerta)];
  const extras = Object.entries(alerta).filter(
    ([k, v]) => !CAMPOS_OCULTOS.has(k) && v !== null && v !== "" && typeof v !== "object" && !/^id_|^id$/.test(k)
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#402B52]/40" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Detalle de riesgo"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${ui.box}`}>
              <ui.Icon className={`w-5 h-5 ${ui.icon}`} />
            </div>
            <div>
              <p className="bs-label">Detalle de riesgo</p>
              <h2 className="text-xl font-bold text-[#402B52] leading-tight">{alerta.titulo || "Alerta epidemiológica"}</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-slate-50 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`bs-pill border ${ui.badge}`}>RIESGO {ui.label.toUpperCase()}</span>
          {ubicacion(alerta) && (
            <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3.5 h-3.5" />{ubicacion(alerta)}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3.5 h-3.5" />{tiempoRelativo(alerta.fecha_generacion)}</span>
        </div>

        <div>
          <p className="bs-label mb-2">Resumen</p>
          <p className="text-[13px] leading-[18px] text-slate-600 whitespace-pre-line">{alerta.resumen || "Sin descripción disponible."}</p>
        </div>

        {extras.length > 0 && (
          <div>
            <p className="bs-label mb-2">Más información</p>
            <dl className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {extras.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-[13px]">
                  <dt className="text-slate-400 capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="text-slate-700 text-right font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {onVerTodas && (
            <button onClick={onVerTodas} className="flex-1 py-3 rounded-2xl border border-[#A280B9] text-[#A280B9] font-bold text-sm hover:bg-[#F3ECF8]">
              Ver todas las alertas
            </button>
          )}
          <button onClick={onClose} className="flex-1 bs-btn text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsView() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<"activas" | "historial">("activas");
  const [nivel, setNivel] = useState<"todos" | Nivel>("todos");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Alerta | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("alertas_epidemiologicas_ia")
      .select("*")
      .order("fecha_generacion", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setAlertas(data ?? []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const activas = alertas.filter((a) => a.activa);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return alertas.filter((a) => {
      if (estado === "activas" ? !a.activa : a.activa) return false;
      if (nivel !== "todos" && nivelDe(a) !== nivel) return false;
      if (t && !`${a.titulo ?? ""} ${a.resumen ?? ""} ${ubicacion(a)}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [alertas, estado, nivel, q]);

  const conteo = (n: Nivel) => activas.filter((a) => nivelDe(a) === n).length;

  return (
    <div className="space-y-5 p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#402B52]">Alertas del Sistema</h1>
        <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm text-[#A280B9] font-bold text-xs hover:bg-[#F3ECF8]">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {[
          { l: "Activas", v: activas.length, c: "text-[#402B52]" },
          { l: "Riesgo alto", v: conteo("alto"), c: "text-red-500" },
          { l: "Riesgo medio", v: conteo("medio"), c: "text-amber-500" },
          { l: "Riesgo bajo", v: conteo("bajo"), c: "text-emerald-500" },
        ].map((s) => (
          <div key={s.l} className="bs-card p-4">
            <p className="bs-label">{s.l}</p>
            <p className={`mt-1 text-[26px] font-bold leading-tight ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <AlertsHeatMap alertas={activas} onSelect={setSel} />

      <div className="bs-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex rounded-2xl bg-slate-50 p-1 w-fit">
          {(["activas", "historial"] as const).map((e) => (
            <button key={e} onClick={() => setEstado(e)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${estado === e ? "bg-[#A280B9] text-white" : "text-slate-400 hover:text-slate-700"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["todos", "alto", "medio", "bajo"] as const).map((n) => (
            <button key={n} onClick={() => setNivel(n)}
              className={`bs-pill border capitalize ${nivel === n ? "bg-[#F3ECF8] border-[#A280B9] text-[#402B52]" : "border-slate-200 text-slate-400 hover:border-[#A280B9]"}`}>
              {n === "todos" ? "Todos los niveles" : n}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alerta o zona"
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[#A280B9] focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A280B9]" /></div>
      ) : error ? (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">No se pudieron cargar las alertas: {error}</div>
      ) : lista.length === 0 ? (
        <div className="bs-card p-10 text-center text-slate-400 text-[13px]">
          {estado === "activas" ? "No hay alertas epidemiológicas activas en este momento." : "No hay alertas en el historial."}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((a, i) => {
            const ui = NIVEL_UI[nivelDe(a)];
            return (
              <button key={a.id_alerta ?? a.id ?? i} onClick={() => setSel(a)}
                className={`w-full text-left flex gap-4 p-4 rounded-2xl border ${ui.box} hover:shadow-md`}>
                <ui.Icon className={`w-6 h-6 shrink-0 ${ui.icon}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-sm text-[#402B52]">{a.titulo || "Alerta epidemiológica"}</h4>
                    <span className={`bs-pill border bg-white shrink-0 ${ui.badge}`}>{ui.label.toUpperCase()}</span>
                  </div>
                  <p className="text-[13px] leading-[18px] text-slate-600 mt-1 line-clamp-2">{a.resumen}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-[11px] font-bold text-slate-400 uppercase">
                    {ubicacion(a) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ubicacion(a)}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tiempoRelativo(a.fecha_generacion)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {sel && <AlertDetailModal alerta={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
