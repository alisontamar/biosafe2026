export function IndicatorsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Indicadores y Métricas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border rounded-xl">
          <h3 className="font-semibold text-slate-700 mb-4">Cobertura de Vacunación</h3>
          <div className="text-3xl font-bold text-[#726E97]">87%</div>
          <p className="text-sm text-slate-500 mt-2">Meta: 90%</p>
        </div>
        <div className="p-6 bg-white border rounded-xl">
          <h3 className="font-semibold text-slate-700 mb-4">Tasa de Cumplimiento</h3>
          <div className="text-3xl font-bold text-[#726E97]">92%</div>
          <p className="text-sm text-slate-500 mt-2">Promedio mensual</p>
        </div>
      </div>
    </div>
  );
}