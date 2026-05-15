export function ReportsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Reportes y Descargas</h1>
      <div className="grid grid-cols-1 gap-3">
        {['Consolidado Mensual', 'Cobertura por Vacuna', 'Pacientes en Mora'].map(report => (
          <div key={report} className="p-4 bg-white border rounded-xl flex justify-between items-center hover:shadow-md transition cursor-pointer">
            <span className="font-medium text-slate-700">{report}</span>
            <button className="text-sm text-[#726E97] font-bold">Descargar PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}