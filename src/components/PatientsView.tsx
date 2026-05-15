import { Search, UserPlus, MoreVertical } from "lucide-react";

export default function PatientsView() {
  const patients = [
    { id: "1", name: "María José Lozano", age: "2 años", status: "Al día", lastVax: "10/04/2024" },
    { id: "2", name: "Mateo Arce", age: "6 meses", status: "Pendiente", lastVax: "02/02/2024" },
    { id: "3", name: "Valentina Rojas", age: "4 años", status: "Atrasado", lastVax: "15/11/2023" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#726E97]">Pacientes</h1>
        <button className="bg-[#726E97] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#5f5a82] transition">
          <UserPlus className="w-4 h-4" /> Nuevo Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#726E97]/20" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left p-4 font-medium">Nombre</th>
              <th className="text-left p-4 font-medium">Edad</th>
              <th className="text-left p-4 font-medium">Estado</th>
              <th className="text-left p-4 font-medium">Última Vacuna</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-slate-600">{p.age}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    p.status === 'Al día' ? 'bg-emerald-100 text-emerald-600' : 
                    p.status === 'Pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{p.lastVax}</td>
                <td className="p-4 text-right"><MoreVertical className="w-4 h-4 text-slate-400 inline cursor-pointer" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}