import { AlertCircle, Clock, MapPin, Wrench } from "lucide-react";

export default function AlertsView() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Alertas del Sistema</h1>

      {/* Próximamente */}
      <div className="flex items-start gap-4 p-5 bg-[#EEEDFE] border border-[#AFA9EC] rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-[#726E97] flex items-center justify-center shrink-0">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-[#3C3489] text-sm">Próximamente — Alertas en tiempo real</p>
          <p className="text-sm text-[#534AB7] mt-1 leading-relaxed">
            Esta sección mostrará las alertas epidemiológicas generadas por el motor de IA,
            incluyendo detección de brotes, anomalías de cobertura y recomendaciones de
            acción por zona geográfica.
          </p>
        </div>
      </div>

      {/* Vista previa deshabilitada */}
      <div className="space-y-3 opacity-40 pointer-events-none select-none">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vista previa</p>
        <div className="flex gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-bold text-red-700">Brote detectado (IA)</h4>
            <p className="text-sm text-red-600">
              Se ha detectado un incremento anómalo de casos de IRAs en la zona Norte.
            </p>
            <div className="flex gap-4 mt-2 text-[10px] font-bold text-red-500/70 uppercase">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Cochabamba - Cercado
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Hace 2 horas
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
