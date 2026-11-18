import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { AlertDetailModal, nivelDe, tiempoRelativo, type Alerta } from "./AlertsView";

const KEY = "biosafe_alertas_vistas";
const POLL_MS = 60_000;

const leerVisto = () => {
  try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
};
const guardarVisto = (t: number) => {
  try { localStorage.setItem(KEY, String(t)); } catch { /* sin storage */ }
};
const ts = (a: Alerta) => (a.fecha_generacion ? new Date(a.fecha_generacion).getTime() : 0);

const PUNTO = { alto: "bg-red-500", medio: "bg-amber-500", bajo: "bg-emerald-500" } as const;

export default function AlertBell({ onVerTodas }: { onVerTodas: () => void }) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [visto, setVisto] = useState(leerVisto);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<Alerta | null>(null);
  const [detalle, setDetalle] = useState<Alerta | null>(null);
  const primeraCarga = useRef(true);
  const conocidas = useRef<Set<string>>(new Set());
  const caja = useRef<HTMLDivElement>(null);

  const idDe = (a: Alerta, i: number) => String(a.id_alerta ?? a.id ?? `${a.titulo}-${a.fecha_generacion}-${i}`);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("alertas_epidemiologicas_ia")
      .select("*")
      .eq("activa", true)
      .order("fecha_generacion", { ascending: false })
      .limit(15);
    if (!data) return;
    const ids = new Set(data.map(idDe));
    if (!primeraCarga.current) {
      const nueva = data.find((a, i) => !conocidas.current.has(idDe(a, i)));
      if (nueva) { setToast(nueva); window.setTimeout(() => setToast(null), 8000); }
    }
    primeraCarga.current = false;
    conocidas.current = ids;
    setAlertas(data);
  }, []);

  useEffect(() => {
    cargar();
    const timer = window.setInterval(cargar, POLL_MS);
    // Tiempo real (si Realtime está habilitado para la tabla); el sondeo cubre el resto.
    const canal = supabase
      .channel("alertas-nuevas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alertas_epidemiologicas_ia" }, cargar)
      .subscribe();
    return () => { window.clearInterval(timer); supabase.removeChannel(canal); };
  }, [cargar]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => caja.current && !caja.current.contains(e.target as Node) && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const nuevas = alertas.filter((a) => ts(a) > visto).length;

  const marcarLeidas = () => {
    const t = Math.max(Date.now(), ...alertas.map(ts));
    guardarVisto(t); setVisto(t);
  };

  return (
    <div className="relative" ref={caja}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Notificaciones${nuevas ? `, ${nuevas} nuevas` : ""}`}
        className="relative p-2.5 rounded-2xl text-slate-400 hover:bg-[#F3ECF8] hover:text-[#A280B9]"
      >
        <Bell className="w-5 h-5" />
        {nuevas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {nuevas > 9 ? "9+" : nuevas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-[min(92vw,360px)] bg-white rounded-3xl shadow-xl border border-slate-100 z-40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <p className="font-bold text-[#402B52]">Notificaciones</p>
            {nuevas > 0 && (
              <button onClick={marcarLeidas} className="text-xs font-semibold text-[#7E57C2] hover:underline">
                Marcar como leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alertas.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No hay alertas activas.</p>
            ) : alertas.slice(0, 6).map((a, i) => (
              <button key={idDe(a, i)} onClick={() => { setDetalle(a); setAbierto(false); marcarLeidas(); }}
                className="w-full text-left flex gap-3 px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${PUNTO[nivelDe(a)]}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#402B52] truncate">{a.titulo || "Alerta epidemiológica"}</span>
                    {ts(a) > visto && <span className="bs-pill bg-[#F3ECF8] text-[#A280B9] shrink-0">NUEVA</span>}
                  </span>
                  <span className="block text-xs text-slate-400 line-clamp-2">{a.resumen}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{tiempoRelativo(a.fecha_generacion)}</span>
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => { setAbierto(false); marcarLeidas(); onVerTodas(); }}
            className="w-full py-3.5 text-sm font-bold text-[#7E57C2] hover:bg-[#F3ECF8] border-t border-slate-50">
            Ver todas las alertas
          </button>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-50 w-[min(92vw,340px)] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex gap-3">
          <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${PUNTO[nivelDe(toast)]}`} />
          <button className="text-left flex-1" onClick={() => { setDetalle(toast); setToast(null); marcarLeidas(); }}>
            <span className="bs-label block">Nueva alerta</span>
            <span className="block text-sm font-bold text-[#402B52]">{toast.titulo || "Alerta epidemiológica"}</span>
            <span className="block text-xs text-slate-400 line-clamp-2">{toast.resumen}</span>
          </button>
          <button onClick={() => setToast(null)} aria-label="Cerrar" className="text-slate-400 self-start"><X className="w-4 h-4" /></button>
        </div>
      )}

      {detalle && <AlertDetailModal alerta={detalle} onClose={() => setDetalle(null)} onVerTodas={() => { setDetalle(null); onVerTodas(); }} />}
    </div>
  );
}
