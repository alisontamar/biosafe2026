import { useState, useRef, useEffect } from "react";
import { UserRound, Baby, ShieldCheck, AlertTriangle, QrCode, TrendingUp, MapPin, Activity } from "lucide-react";

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, detail, color }: {
  icon: React.ElementType; title: string; value: string; detail: string; color: string;
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

// ── QRScanner ─────────────────────────────────────────────────────────────────
function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScan = async () => {
    setResult(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setError("No se pudo acceder a la cámara. Verifique los permisos.");
    }
  };

  const stopScan = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  // Simulate a QR detection after 3 s for demo purposes
  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => {
      stopScan();
      setResult("Esquema validado ✓  –  Mateo A. | Neumococo 2 | 16/05/2025");
    }, 3000);
    return () => clearTimeout(timer);
  }, [scanning]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#726E97]">
          <QrCode size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Validación QR</h2>
          <p className="text-xs text-slate-400">Escanea el código para validar esquema y dosis aplicadas</p>
        </div>
      </div>

      {/* Camera / placeholder */}
      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
        {scanning ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border-2 border-[#726E97] rounded-lg relative">
                <span className="absolute -top-px -left-px w-5 h-5 border-t-4 border-l-4 border-[#726E97] rounded-tl" />
                <span className="absolute -top-px -right-px w-5 h-5 border-t-4 border-r-4 border-[#726E97] rounded-tr" />
                <span className="absolute -bottom-px -left-px w-5 h-5 border-b-4 border-l-4 border-[#726E97] rounded-bl" />
                <span className="absolute -bottom-px -right-px w-5 h-5 border-b-4 border-r-4 border-[#726E97] rounded-br" />
                {/* animated scan line */}
                <div className="absolute left-0 right-0 h-0.5 bg-[#726E97] opacity-70 animate-[scanline_1.5s_ease-in-out_infinite]" style={{ animation: "scanline 1.5s ease-in-out infinite" }} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <QrCode size={56} />
            <p className="text-xs">Cámara inactiva</p>
          </div>
        )}
      </div>

      {/* Result / error */}
      {result && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-medium">
          ✓ {result}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Button */}
      {scanning ? (
        <button
          onClick={stopScan}
          className="w-full py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-300 transition"
        >
          Cancelar
        </button>
      ) : (
        <button
          onClick={startScan}
          className="w-full py-3 rounded-lg bg-[#726E97] text-white font-semibold text-sm hover:opacity-90 transition"
        >
          Escanear QR
        </button>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 0%; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── RiskInsights ──────────────────────────────────────────────────────────────
const riskData = [
  { zone: "Cercado",    risk: "ALTO",  cases: 142, change: +18, pct: 85 },
  { zone: "Quillacollo", risk: "ALTO", cases: 97,  change: +12, pct: 72 },
  { zone: "Sacaba",     risk: "MEDIO", cases: 64,  change: +5,  pct: 50 },
  { zone: "Tiquipaya",  risk: "BAJO",  cases: 28,  change: -3,  pct: 30 },
];

const riskColor: Record<string, string> = {
  ALTO:  "bg-red-100 text-red-600",
  MEDIO: "bg-amber-100 text-amber-600",
  BAJO:  "bg-emerald-100 text-emerald-600",
};

const barColor: Record<string, string> = {
  ALTO:  "bg-red-400",
  MEDIO: "bg-amber-400",
  BAJO:  "bg-emerald-400",
};

function RiskInsights() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#726E97]">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Insights de riesgo <span className="text-[#726E97]">(IA)</span></h2>
            <p className="text-xs text-slate-400">Análisis epidemiológico en tiempo real</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-200 font-bold uppercase">
          Alerta
        </span>
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-red-50 border border-red-100 p-3">
        <p className="text-xs text-red-700 leading-relaxed">
          <strong>Aumento de casos de IRAs</strong> en menores de 5 años en Cercado y Quillacollo. Reforzar vigilancia y esquema de vacunación.
        </p>
      </div>

      {/* Zone breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <MapPin size={12} /> Distribución por zona
        </div>
        {riskData.map(z => (
          <div key={z.zone} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">{z.zone}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{z.cases} casos</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${riskColor[z.risk]}`}>{z.risk}</span>
                <span className={`text-[10px] font-semibold ${z.change > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {z.change > 0 ? `+${z.change}` : z.change}%
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor[z.risk]} transition-all duration-700`}
                style={{ width: `${z.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><TrendingUp size={12} /> Acciones recomendadas</p>
        <ul className="text-xs text-slate-600 space-y-1.5">
          {[
            "Reforzar campaña de Neumococo en Cercado y Quillacollo",
            "Aumentar frecuencia de controles en < 5 años",
            "Notificar a centros de salud de zonas ALTO riesgo",
          ].map(a => (
            <li key={a} className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#726E97] flex-shrink-0" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <button className="w-full py-3 rounded-lg bg-[#726E97] text-white font-semibold text-sm hover:opacity-90 transition">
        Ver recomendaciones completas
      </button>
    </div>
  );
}

// ── HomeView (main) ───────────────────────────────────────────────────────────
export function HomeView() {
  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold text-[#726E97]">Resumen general</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={UserRound}    title="Padres de familia registrados" value="1.248" detail="+8% vs mes anterior"       color="purple" />
        <StatCard icon={Baby}         title="Niños(as) 0-5 años"            value="2.856" detail="+5% vs mes anterior"       color="green"  />
        <StatCard icon={ShieldCheck}  title="Esquemas Completos"            value="78,6%" detail="+6,2 p.p. vs mes anterior" color="blue"   />
        <StatCard icon={AlertTriangle} title="Alertas Activas"              value="24"    detail="Ver detalles"              color="red"    />
      </div>

      {/* Vaccination tracking + epidemiological alert */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5">Seguimiento de vacunación</h2>
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-center">
            {/* Donut */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#726E97" strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.786} ${2 * Math.PI * 40 * 0.214}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[9px] text-slate-400 leading-none">Cobertura</p>
                  <p className="text-xl font-bold text-[#726E97] leading-tight">78,6%</p>
                  <p className="text-[9px] text-slate-400 leading-none">Meta: 90%</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Vacuna</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold text-slate-700 mb-3">Próximas dosis pendientes</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b">
                    <th className="pb-2 font-medium">Paciente</th>
                    <th className="pb-2 font-medium">Vacuna / Dosis</th>
                    <th className="pb-2 font-medium text-right">Vence</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {[
                    { name: "María José L.", vaccine: "Pentavalente 3", date: "15/05" },
                    { name: "Mateo A.",       vaccine: "Neumococo 2",   date: "16/05" },
                    { name: "Valentina R.",   vaccine: "SRP 1",         date: "18/05" },
                  ].map(r => (
                    <tr key={r.name} className="border-b border-slate-50">
                      <td className="py-2.5">{r.name}</td>
                      <td className="py-2.5">{r.vaccine}</td>
                      <td className="py-2.5 text-right text-red-500 font-medium">Vence: {r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Epidemiological alert */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-red-600 text-sm">Alertas epidemiológicas (IA)</h2>
              <span className="text-[10px] px-2 py-1 rounded-full bg-white text-red-500 border border-red-200 font-bold">ALERTA</span>
            </div>
            <p className="text-xs text-red-500 font-semibold text-right">Riesgo ALTO de IRAs<br /><span className="font-normal">en Cochabamba</span></p>
          </div>
          {/* Mini sparkline */}
          <svg viewBox="0 0 200 60" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,45 L25,38 L50,42 L75,30 L100,35 L125,20 L150,28 L175,15 L200,22"
              fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0,45 L25,38 L50,42 L75,30 L100,35 L125,20 L150,28 L175,15 L200,22 L200,60 L0,60 Z"
              fill="url(#spark)" />
          </svg>
          <button className="w-full py-3 rounded-lg bg-[#726E97] text-white font-semibold text-sm hover:opacity-90 transition">
            Ver recomendaciones
          </button>
        </div>
      </div>

      {/* QR + Risk Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QRScanner />
        <RiskInsights />
      </div>
    </div>
  );
}

export default HomeView;