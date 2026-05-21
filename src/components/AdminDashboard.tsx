import { useState, useEffect } from "react";
import { 
  Home, Users, Syringe, Bell, FileText, BarChart3, Settings, Plus, ChevronDown, LogOut 
} from "lucide-react";

// 1. Importamos Supabase
import { supabase } from "../lib/supabase";

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
  
  // 2. Estados para guardar la información real del usuario
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    nombre: string;
    rol: string;
    establecimiento: string;
  } | null>(null);

  // 3. Este useEffect se ejecuta ni bien carga la pantalla
  useEffect(() => {
    async function loadSessionData() {
      try {
        // Pedimos la sesión actual a Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Si no hay sesión, lo pateamos de vuelta al inicio
          window.location.hash = '';
          return;
        }

        // Buscamos el perfil en la tabla usuarios y hacemos un JOIN con establecimientos
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
          // Le decimos a TypeScript que maneje el dato de forma flexible (as any)
          // y cubrimos el caso por si Supabase lo devuelve como arreglo o como objeto
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

  // 4. Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = ''; // Volvemos a la landing page
    window.location.reload();  // Limpiamos los estados de React
  };

  // 5. Función que filtra el menú según el Rol (Control de Accesos / RBAC)
  const getFilteredMenu = () => {
    if (!userData) return [];
    
    const { rol } = userData;
    let allowedTabs: string[] = [];

    switch (rol) {
      case 'AdminEstablecimiento':
      case 'SuperAdmin':
        // Los admins ven todo
        allowedTabs = ["inicio", "pacientes", "vacunacion", "alertas", "reportes", "indicadores", "configuracion"];
        break;
      case 'Medico':
      case 'Enfermero':
        // Médicos no ven configuración ni reportes gerenciales pesados
        allowedTabs = ["inicio", "pacientes", "vacunacion", "alertas"];
        break;
      case 'Farmaceutico':
        // Farmacéuticos (Fast Track) solo ven inicio y registro de vacunación
        allowedTabs = ["inicio", "vacunacion"];
        break;
      default:
        allowedTabs = ["inicio"];
    }

    // Retornamos solo los items permitidos
    return menuItems.filter(item => allowedTabs.includes(item.id));
  };

  const renderView = () => {
    switch (activeTab) {
      case "inicio": return <HomeView />;
      case "pacientes": return <PatientsView />;
      case "vacunacion": return <VaccinationView />;
      case "alertas": return <AlertsView />;
      case "reportes": return <ReportsView />;
      case "indicadores": return <IndicatorsView />;
      case "configuracion": return <SettingsView />;
      default: return <HomeView />;
    }
  };

  // Pantalla de carga mientras trae los datos de la base de datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#726E97]"></div>
      </div>
    );
  }

  // Generamos las iniciales del nombre (ej: "Alison Gomez" -> "AG")
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredMenu = getFilteredMenu();

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex">
      <aside className="w-[260px] bg-[#726E97] text-white hidden md:flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-[#726E97]" />
          </div>
          <span className="text-2xl font-bold tracking-tight">BioSafe</span>
        </div>

        <nav className="space-y-2 flex-1">
          {filteredMenu.map((item) => {
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

        {/* Botón de Cerrar Sesión al final del Sidebar */}
        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
            Establecimiento: <span className="text-slate-800 font-bold">{userData?.establecimiento}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#726E97] flex items-center justify-center text-white text-xs font-bold">
              {userData ? getInitials(userData.nombre) : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">{userData?.nombre}</span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight uppercase tracking-wide">
                {userData?.rol}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
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