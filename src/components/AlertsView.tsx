import { AlertCircle, Clock, MapPin } from "lucide-react";

export default function AlertsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Alertas del Sistema</h1>
      <div className="space-y-4">
        <div className="flex gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-bold text-red-700">Brote detectado (IA)</h4>
            <p className="text-sm text-red-600">Se ha detectado un incremento anómalo de casos de IRAs en la zona Norte.</p>
            <div className="flex gap-4 mt-2 text-[10px] font-bold text-red-500/70 uppercase">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Cochabamba - Cercado</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hace 2 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}