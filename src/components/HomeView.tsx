import { UserRound, Baby, ShieldCheck, AlertTriangle, QrCode, Gauge } from "lucide-react";
import { StatCard } from "./StatCard";

export function HomeView() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#726E97]">Resumen general</h1>
      
      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={UserRound} title="Padres registrados" value="1.248" detail="+8% vs mes anterior" color="purple" />
        <StatCard icon={Baby} title="Niños(as) 0-5 años" value="2.856" detail="+5% vs mes anterior" color="green" />
        <StatCard icon={ShieldCheck} title="Esquemas Completos" value="78,6%" detail="+6,2 p.p. vs mes anterior" color="blue" />
        <StatCard icon={AlertTriangle} title="Alertas Activas" value="24" detail="Ver detalles" color="red" />
      </div>

      {/* Grid Central: Seguimiento y Alerta IA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5">Seguimiento de vacunación</h2>
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-center">
            <div className="flex justify-center">
              <div className="relative w-28 h-28 rounded-full border-[10px] border-slate-200 flex items-center justify-center">
                <div className="absolute inset-[-10px] rounded-full border-[10px] border-[#726E97] border-r-transparent border-b-transparent rotate-45" />
                <div className="text-center relative z-10">
                  <p className="text-[10px] text-slate-500">Cobertura</p>
                  <p className="text-2xl font-bold text-[#726E97]">78.6%</p>
                  <p className="text-[10px] text-slate-400">Meta: 90%</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b">
                    <th className="pb-3 font-medium">Paciente</th>
                    <th className="pb-3 font-medium">Vacuna</th>
                    <th className="pb-3 font-medium text-right">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100">
                    <td className="py-3">María José L.</td>
                    <td className="py-3">Pentavalente 3</td>
                    <td className="py-3 text-right text-red-500">15/05</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-red-600 text-sm">Alertas epidemiológicas IA</h2>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white text-red-500 border border-red-200 font-bold">ALERTA</span>
          </div>
          <p className="text-xs text-red-500 text-right mb-5 font-medium">Riesgo ALTO de IRAs en Cochabamba</p>
          <button className="w-full py-3 rounded-lg bg-[#726E97] text-white font-semibold text-sm hover:opacity-90 transition">
            Ver recomendaciones
          </button>
        </div>
      </div>
    </div>
  );
}