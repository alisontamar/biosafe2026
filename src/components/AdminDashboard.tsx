import { useState, useEffect } from "react";
import { 
  Home, Users, Syringe, Bell, FileText, BarChart3, Settings, ChevronDown, LogOut, Menu, X
} from "lucide-react";

import { supabase } from "../lib/supabase";

import { HomeView } from "./HomeView";
import PatientsView from "./PatientsView";
import VaccinationView from "./VaccinationView";
import AlertsView from "./AlertsView";
import AlertBell from "./AlertBell";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    nombre: string;
    rol: string;
    establecimiento: string;
  } | null>(null);

  useEffect(() => {
    async function loadSessionData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.hash = '';
          return;
        }

        const { data: profile, error } = await supabase
          .from('usuarios')
          .select(`
            nombre_completo,
            rol,
            establecimientos (
              nombre_establecimiento
            )
          `)
          .eq('id_usuario', session.user.id)
          .single();

        if (error) throw error;

        if (profile) {
          const estData = profile.establecimientos as any;
          const nombreEst = Array.isArray(estData) 
            ? estData[0]?.nombre_establecimiento 
            : estData?.nombre_establecimiento;

          setUserData({
            nombre: profile.nombre_completo,
            rol: profile.rol,
            establecimiento: nombreEst || 'Sistema Central'
          });
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSessionData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
    window.location.reload();
  };

  const getFilteredMenu = () => {
    if (!userData) return [];
    
    const { rol } = userData;
    let allowedTabs: string[] = [];

    switch (rol) {
      case 'AdminEstablecimiento':
      case 'SuperAdmin':
        allowedTabs = ["inicio", "pacientes", "vacunacion", "alertas", "reportes", "indicadores", "configuracion"];
        break;
      case 'Medico':
      case 'Enfermero':
        allowedTabs = ["inicio", "pacientes", "vacunacion", "alertas"];
        break;
      case 'Farmaceutico':
        allowedTabs = ["inicio", "vacunacion"];
        break;
      default:
        allowedTabs = ["inicio"];
    }

    return menuItems.filter(item => allowedTabs.includes(item.id));
  };

  const renderView = () => {
    const allowedIds = getFilteredMenu().map(m => m.id);
    const safeTab = allowedIds.includes(activeTab) ? activeTab : 'inicio';

    switch (safeTab) {
      case "inicio": return <HomeView onNavigate={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} />;
      case "pacientes": return <PatientsView />;
      case "vacunacion": return <VaccinationView />;
      case "alertas": return <AlertsView />;
      case "reportes": return <ReportsView />;
      case "indicadores": return <IndicatorsView />;
      case "configuracion": return <SettingsView />;
      default: return <HomeView />;
    }
  };

  // Cierra el drawer y navega
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A280B9]"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredMenu = getFilteredMenu();

  return (
    <div className="h-screen overflow-hidden bg-[#F5F0FA] text-slate-800 flex">

      {/* Overlay para mobile — tapa el fondo cuando el drawer está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fijo en desktop, drawer deslizable en mobile */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[240px] bg-white text-[#553B5E] flex flex-col p-4 z-30
          border-r border-[#EADFF2] shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex md:h-auto md:my-4 md:ml-4 md:rounded-[28px]
          md:border md:shadow-[0_10px_30px_-12px_rgba(114,110,151,0.25)] md:shrink-0
        `}
      >
        {/* Header del sidebar con botón de cierre en mobile */}
        <div className="flex items-center justify-between px-2 mb-8 mt-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#A280B9]">Bio</span>
              <span className="text-[#7698B3]">Safe</span>
            </span>
          </div>
          {/* Botón X solo visible en mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                  ? "bg-[#F1E8F8] text-[#6B4A85] font-semibold"
                  : "text-[#7A6788] hover:bg-[#F8F3FC] hover:text-[#553B5E]"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[#A280B9]" : "opacity-70"}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#A280B9]" />}
              </button>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Cerrar Sesión
        </button>
      </aside>

      {/* Área principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-[72px] flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa — solo visible en mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs font-medium text-[#7A6788] bg-white px-4 py-2 rounded-full border border-[#EADFF2] shadow-sm hidden sm:block">
              Establecimiento: <span className="text-slate-800 font-bold">{userData?.establecimiento}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white border border-[#EADFF2] shadow-sm rounded-full pl-3 pr-4 py-1.5">
            {getFilteredMenu().some((m) => m.id === "alertas") && (
              <AlertBell onVerTodas={() => handleNavClick("alertas")} />
            )}
            <div className="w-8 h-8 rounded-full bg-[#A280B9] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userData ? getInitials(userData.nombre) : 'U'}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold leading-tight">{userData?.nombre}</span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight uppercase tracking-wide">
                {userData?.rol}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1 hidden sm:block" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}