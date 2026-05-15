import { Calendar, Syringe, CheckCircle2 } from "lucide-react";

export default function VaccinationView() {
  const vaccines = [
    { name: "Pentavalente", dose: "3ra Dosis", target: "6 meses", stock: 45 },
    { name: "SRP (Sarampión)", dose: "1ra Dosis", target: "12 meses", stock: 12 },
    { name: "Influenza", dose: "Refuerzo", target: "Todo público", stock: 150 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Control de Vacunación</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vaccines.map((v) => (
          <div key={v.name} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <Syringe className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${v.stock < 20 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                Stock: {v.stock}
              </span>
            </div>
            <h3 className="font-bold text-slate-800">{v.name}</h3>
            <p className="text-sm text-slate-500">{v.dose} • {v.target}</p>
            <button className="mt-4 w-full py-2 border border-[#726E97] text-[#726E97] rounded-lg text-sm font-semibold hover:bg-[#726E97] hover:text-white transition">
              Registrar Aplicación
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}