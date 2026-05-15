import { useState } from "react";
import { 
  Home, Users, Syringe, Bell, FileText, BarChart3, Settings, Plus, ChevronDown 
} from "lucide-react";

// Importación de las vistas creadas arriba
import { HomeView } from "./HomeView";
import PatientsView from "./PatientsView";
import VaccinationView from "./VaccinationView";
import AlertsView from "./AlertsView";
import { ReportsView } from "./ReportsView";
import SettingsView from "./SettingsView";
import { IndicatorsView } from "./IndicatorsView";

const menuItems = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "pacientes", label: "Pacientes", icon: Users },
  { id: "vacunacion", label: "Vacunación", icon: Syringe },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "reportes", label: "Reportes", icon: FileText },
  { id: "indicadores", label: "Indicadores", icon: BarChart3 },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("inicio");

  const renderView = () => {
    switch (activeTab) {
      case "inicio": return <HomeView />;
      case "pacientes": return <PatientsView />;
      case "vacunacion": return <VaccinationView />;
      case "alertas": return <AlertsView />;
      case "reportes": return <ReportsView />;
      case "indicadores": return <IndicatorsView />; // Similar a Home pero con más gráficos
      case "configuracion": return <SettingsView />; // Formulario de perfil/clínica
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex">
      {/* Sidebar - Basado exactamente en tu imagen */}
      <aside className="w-[260px] bg-[#726E97] text-white hidden md:flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-[#726E97]" />
          </div>
          <span className="text-2xl font-bold tracking-tight">BioSafe</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                  ? "bg-white/20 text-white shadow-inner" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
            Establecimiento: <span className="text-slate-800 font-bold">Centro de Salud Central</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#726E97] flex items-center justify-center text-white text-xs font-bold">AD</div>
            <span className="text-sm font-semibold">Administrador</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F4F6F8]">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}