import { useState, useEffect, useRef } from "react";
import {
  Syringe, QrCode, X, CheckCircle2, AlertCircle, Plus,
  ChevronRight, Users, Clock, BookOpen,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Tab = "registrar" | "catalogo";
type ModalPhase = "scan" | "patient" | "saved";
type ScanState = "idle" | "active" | "processing";

interface VaccineGroup {
  nombre_enfermedad: string;
  doses: { id_vacuna: string; dosis_numero: string; edad_meses_ideal: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcAgeMonths(fechaNac: string) {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  return (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
}

function formatAge(months: number) {
  if (months < 24) return `${months} meses`;
  const yrs = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${yrs} años ${m}m` : `${yrs} años`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function formatFecha(f: string) {
  const d = new Date(f);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

// ── Modal QR ───────────────────────────────────────────────────────────────────
function QRModal({
  onClose,
  preselectedVaccineId,
}: {
  onClose: () => void;
  preselectedVaccineId?: string;
}) {
  const [phase, setPhase] = useState<ModalPhase>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [paciente, setPaciente] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [selectedVaccineId, setSelectedVaccineId] = useState(preselectedVaccineId ?? "");
  const [lote, setLote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    loadVaccines();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const loadVaccines = async () => {
    const { data } = await supabase
      .from("cat_vacunas_oficiales")
      .select("id_vacuna, nombre_enfermedad, dosis_numero, edad_meses_ideal")
      .order("nombre_enfermedad");
    if (data) setVaccines(data);
  };

  const startScan = async () => {
    setError("");
    setScanState("active");
    try {
      const qr = new Html5Qrcode("qr-reader-modal");
      scannerRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
        },
        async (decodedText) => {
          await qr.stop();
          scannerRef.current = null;
          setScanState("processing");
          await lookupPatient(decodedText);
        },
        () => {}
      );
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
      setScanState("idle");
    }
  };

  const stopScan = async () => {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanState("idle");
  };

  const lookupPatient = async (decodedText: string) => {
    try {
      let id_paciente: string;
      let token: string;
      try {
        const parsed = JSON.parse(decodedText);
        id_paciente = parsed.id_paciente;
        token = parsed.token;
        if (!id_paciente || !token) throw new Error("Campos faltantes");
      } catch {
        setError(`Formato de QR no reconocido. Contenido: ${decodedText.slice(0, 60)}`);
        setScanState("idle");
        return;
      }

      const { data: pac, error: errPac } = await supabase
        .from("pacientes")
        .select("id_paciente, nombre_completo, fecha_nacimiento, sexo")
        .eq("id_paciente", id_paciente)
        .eq("codigo_qr_token", token)
        .single();

      if (errPac) {
        setError(`Error de base de datos: ${errPac.message} (código: ${errPac.code})`);
        setScanState("idle");
        return;
      }
      if (!pac) {
        setError(`Paciente no encontrado. Verifica que el QR corresponde a un paciente registrado en este sistema.`);
        setScanState("idle");
        return;
      }

      const { data: hist } = await supabase
        .from("dosis_aplicadas")
        .select("id_registro, fecha_aplicacion, lote, cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero )")
        .eq("id_paciente", pac.id_paciente)
        .order("fecha_aplicacion", { ascending: false });

      setPaciente(pac);
      setHistory(hist ?? []);
      setScanState("idle");
      setPhase("patient");
    } catch {
      setError("Error de conexión al validar el QR.");
      setScanState("idle");
    }
  };

  const handleSave = async () => {
    if (!selectedVaccineId || !paciente) return;
    setSaving(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: errIns } = await supabase.from("dosis_aplicadas").insert({
        id_paciente: paciente.id_paciente,
        id_vacuna: selectedVaccineId,
        id_usuario_atendedor: session?.user.id ?? null,
        fecha_aplicacion: new Date().toISOString(),
        lote: lote.trim() || null,
        origen_registro: "Validado_En_Establecimiento",
      });
      if (errIns) throw errIns;
      setPhase("saved");
      setTimeout(onClose, 2000);
    } catch {
      setError("Error al guardar el registro. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#726E97]" />
            <h2 className="text-sm font-semibold text-slate-800">
              {phase === "scan" ? "Escanear carnet QR"
                : phase === "patient" ? "Registrar vacuna"
                : "Dosis registrada"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {phase === "scan" && (
            <>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative flex items-center justify-center">
                <div id="qr-reader-modal" className={`w-full h-full ${scanState === "active" ? "block" : "hidden"}`} />
                {scanState === "active" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-52 h-52 border-2 border-[#726E97] rounded-lg relative">
                      <span className="absolute -top-px -left-px w-5 h-5 border-t-4 border-l-4 border-[#726E97] rounded-tl" />
                      <span className="absolute -top-px -right-px w-5 h-5 border-t-4 border-r-4 border-[#726E97] rounded-tr" />
                      <span className="absolute -bottom-px -left-px w-5 h-5 border-b-4 border-l-4 border-[#726E97] rounded-bl" />
                      <span className="absolute -bottom-px -right-px w-5 h-5 border-b-4 border-r-4 border-[#726E97] rounded-br" />
                    </div>
                  </div>
                )}
                {scanState !== "active" && (
                  <div className="flex flex-col items-center gap-3">
                    {scanState === "processing" ? (
                      <>
                        <div className="w-8 h-8 border-2 border-[#726E97] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-slate-400">Buscando paciente…</p>
                      </>
                    ) : (
                      <>
                        <QrCode size={48} className="text-slate-300" />
                        <p className="text-xs text-slate-300">Cámara inactiva</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              {scanState === "active" ? (
                <button onClick={stopScan} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition">
                  Cancelar escaneo
                </button>
              ) : (
                <button onClick={startScan} disabled={scanState === "processing"} className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50" style={{ background: "#726E97" }}>
                  {scanState === "processing" ? "Buscando..." : "Activar cámara"}
                </button>
              )}
              <style>{`
                #qr-reader-modal { border: none !important; }
                #qr-reader-modal img { display: none !important; }
                #qr-reader-modal__dashboard_section_csr span { display: none !important; }
                #qr-reader-modal__dashboard_section_swaplink { display: none !important; }
              `}</style>
            </>
          )}

          {phase === "patient" && paciente && (
            <>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "#726E97" }}>
                  {getInitials(paciente.nombre_completo)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{paciente.nombre_completo}</p>
                  <p className="text-xs text-slate-500">
                    {formatAge(calcAgeMonths(paciente.fecha_nacimiento))} · {paciente.sexo === "M" ? "Masculino" : "Femenino"}
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Historial de vacunas</p>
                {history.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {history.map((h) => (
                      <div key={h.id_registro} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-xs text-slate-700 flex-1">
                          {(h.cat_vacunas_oficiales as any)?.nombre_enfermedad} — {(h.cat_vacunas_oficiales as any)?.dosis_numero}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatFecha(h.fecha_aplicacion)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2.5 bg-slate-50 rounded-lg">Sin vacunas registradas</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Vacuna a aplicar</p>
                <select
                  value={selectedVaccineId}
                  onChange={(e) => setSelectedVaccineId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-[#726E97]"
                >
                  <option value="">— Seleccionar vacuna —</option>
                  {vaccines.map((v) => (
                    <option key={v.id_vacuna} value={v.id_vacuna}>
                      {v.nombre_enfermedad} · {v.dosis_numero} ({v.edad_meses_ideal}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Número de lote <span className="normal-case font-normal">(opcional)</span>
                </p>
                <input
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Ej: LOT-2026-A4"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 bg-white focus:outline-none focus:border-[#726E97]"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </>
          )}

          {phase === "saved" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">Dosis registrada</p>
                <p className="text-sm text-slate-400 mt-1">La vacuna fue guardada en el expediente del paciente.</p>
              </div>
            </div>
          )}
        </div>

        {phase === "patient" && (
          <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedVaccineId || saving}
              className="flex-[2] py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ background: "#726E97" }}
            >
              {saving ? "Guardando..." : "Confirmar registro"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal agregar vacuna al catálogo ──────────────────────────────────────────
function AddVaccineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ nombre_enfermedad: "", dosis_numero: "", edad_min: "", edad_max: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.nombre_enfermedad || !form.dosis_numero || !form.edad_min) {
      setError("Completa los campos obligatorios.");
      return;
    }
    const minVal = parseInt(form.edad_min);
    if (isNaN(minVal) || minVal < 0) {
      setError("La edad mínima debe ser un número válido.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("cat_vacunas_oficiales").insert({
      nombre_enfermedad: form.nombre_enfermedad.trim(),
      dosis_numero: form.dosis_numero.trim(),
      edad_meses_ideal: minVal,
    });
    setSaving(false);
    if (err) { setError("Error al guardar. Intenta de nuevo."); return; }
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#726E97]" />
            <h2 className="text-sm font-semibold text-slate-800">Agregar al catálogo</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 tracking-widest uppercase">
              Enfermedad / nombre de la vacuna *
            </label>
            <input
              type="text"
              value={form.nombre_enfermedad}
              onChange={(e) => setForm({ ...form, nombre_enfermedad: e.target.value })}
              placeholder="Ej: Pentavalente, SRP, BCG, Influenza"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#726E97]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 tracking-widest uppercase">
              Número de dosis *
            </label>
            <input
              type="text"
              value={form.dosis_numero}
              onChange={(e) => setForm({ ...form, dosis_numero: e.target.value })}
              placeholder="Ej: Dosis 1 · Dosis 2 · Refuerzo · Dosis única"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#726E97]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 tracking-widest uppercase">
              Rango de edad objetivo (meses) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={form.edad_min}
                onChange={(e) => setForm({ ...form, edad_min: e.target.value })}
                placeholder="Desde"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#726E97]"
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="number"
                min="0"
                value={form.edad_max}
                onChange={(e) => setForm({ ...form, edad_max: e.target.value })}
                placeholder="Hasta"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#726E97]"
              />
            </div>
            <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-[10px] text-slate-400 space-y-0.5">
              <p>Referencia rápida:</p>
              <p>1 año = 12m · 4 años = 48m · 18 años = 216m · 20 años = 240m</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: "#726E97" }}
          >
            {saving ? "Guardando..." : "Agregar al catálogo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────
export default function VaccinationView() {
  const [activeTab, setActiveTab] = useState<Tab>("registrar");
  const [vaccineGroups, setVaccineGroups] = useState<VaccineGroup[]>([]);
  const [loadingVaccines, setLoadingVaccines] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | undefined>();
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Panel de pendientes
  const [selectedDose, setSelectedDose] = useState<{ id_vacuna: string; nombre_enfermedad: string; dosis_numero: string; edad_meses_ideal: number } | null>(null);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [pendingPatients, setPendingPatients] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  useEffect(() => {
    loadVaccineGroups();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("usuarios").select("rol").eq("id_usuario", session.user.id).single();
    if (data) setUserRole(data.rol);
  };

  const loadVaccineGroups = async () => {
    setLoadingVaccines(true);
    const { data } = await supabase
      .from("cat_vacunas_oficiales")
      .select("id_vacuna, nombre_enfermedad, dosis_numero, edad_meses_ideal")
      .order("nombre_enfermedad");

    if (data) {
      const groups: Record<string, VaccineGroup> = {};
      for (const v of data) {
        if (!groups[v.nombre_enfermedad]) {
          groups[v.nombre_enfermedad] = { nombre_enfermedad: v.nombre_enfermedad, doses: [] };
        }
        groups[v.nombre_enfermedad].doses.push({
          id_vacuna: v.id_vacuna,
          dosis_numero: v.dosis_numero,
          edad_meses_ideal: v.edad_meses_ideal,
        });
      }
      setVaccineGroups(Object.values(groups));
    }
    setLoadingVaccines(false);
  };

  const canManageCatalog = userRole === "SuperAdmin" || userRole === "AdminEstablecimiento" || userRole === "Medico";

  const openModal = (vaccineId?: string) => {
    setPreselectedId(vaccineId);
    setModalOpen(true);
  };

  const handleSelectDose = (dose: typeof selectedDose) => {
    if (!dose) return;
    setSelectedDose(dose);
    // Rango por defecto: desde la edad mínima hasta +48 meses (4 años de ventana)
    setAgeMin(String(dose.edad_meses_ideal));
    setAgeMax(String(dose.edad_meses_ideal + 48));
    setPendingPatients([]);
    setPendingLoaded(false);
  };

  const loadPendingPatients = async () => {
    if (!selectedDose) return;
    setLoadingPending(true);
    setPendingLoaded(false);

    const min = Math.max(0, parseInt(ageMin) || 0);
    const max = parseInt(ageMax) || 9999;

    // Todos los pacientes
    const { data: allPatients } = await supabase
      .from("pacientes")
      .select("id_paciente, nombre_completo, fecha_nacimiento, sexo");

    // Pacientes que ya tienen esta dosis
    const { data: vaccinated } = await supabase
      .from("dosis_aplicadas")
      .select("id_paciente")
      .eq("id_vacuna", selectedDose.id_vacuna);

    const vaccinatedIds = new Set((vaccinated ?? []).map((v: any) => v.id_paciente));

    const hoy = new Date();
    const pending = (allPatients ?? []).filter((p) => {
      const ageMonths = calcAgeMonths(p.fecha_nacimiento);
      return ageMonths >= min && ageMonths <= max && !vaccinatedIds.has(p.id_paciente);
    });

    // Ordenar por edad (más urgente primero = más viejo en el rango)
    pending.sort((a, b) => new Date(a.fecha_nacimiento).getTime() - new Date(b.fecha_nacimiento).getTime());

    setPendingPatients(pending);
    setLoadingPending(false);
    setPendingLoaded(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#726E97]">Control de Vacunación</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registro de dosis y gestión del esquema vacunal
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: "#726E97" }}
        >
          <Plus className="w-4 h-4" />
          Nuevo registro
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["registrar", "catalogo"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t ? "bg-white text-[#726E97] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "registrar" ? "Registrar dosis" : "Catálogo y pendientes"}
          </button>
        ))}
      </div>

      {/* ── Pestaña: Registrar dosis ── */}
      {activeTab === "registrar" && (
        loadingVaccines ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#726E97]" />
          </div>
        ) : vaccineGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
            <Syringe className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-3">No hay vacunas en el catálogo.</p>
            <button onClick={() => setActiveTab("catalogo")} className="text-xs text-[#726E97] font-semibold hover:underline">
              Ir al catálogo para agregar →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vaccineGroups.map((group) => (
              <div key={group.nombre_enfermedad} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97] shrink-0">
                    <Syringe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{group.nombre_enfermedad}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{group.doses.length} dosis en el esquema</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.doses.map((d) => (
                    <span key={d.id_vacuna} className="text-[10px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                      {d.dosis_numero} · {d.edad_meses_ideal}m
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => openModal(group.doses[0]?.id_vacuna)}
                  className="mt-auto w-full py-2 border border-[#726E97] text-[#726E97] rounded-lg text-sm font-semibold hover:bg-[#726E97] hover:text-white transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Registrar aplicación
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Pestaña: Catálogo y pendientes ── */}
      {activeTab === "catalogo" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* Columna izquierda: catálogo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Vacunas registradas</h2>
              {canManageCatalog && (
                <button
                  onClick={() => setShowAddVaccine(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition"
                  style={{ background: "#726E97" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar vacuna
                </button>
              )}
            </div>

            {loadingVaccines ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#726E97]" />
              </div>
            ) : vaccineGroups.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
                <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Catálogo vacío.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vaccineGroups.map((group) => (
                  <div key={group.nombre_enfermedad} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Header del grupo */}
                    <div className="px-4 py-3 flex items-center gap-3 bg-slate-50 border-b border-slate-100">
                      <div className="p-1.5 bg-[#726E97]/10 rounded-lg text-[#726E97] shrink-0">
                        <Syringe className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 flex-1">{group.nombre_enfermedad}</p>
                      <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {group.doses.length} dosis
                      </span>
                    </div>

                    {/* Filas de dosis */}
                    {group.doses.map((dose) => {
                      const isSelected = selectedDose?.id_vacuna === dose.id_vacuna;
                      return (
                        <button
                          key={dose.id_vacuna}
                          onClick={() => handleSelectDose({ ...dose, nombre_enfermedad: group.nombre_enfermedad })}
                          className={`w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition text-left ${
                            isSelected ? "bg-[#726E97]/5 border-l-2 border-l-[#726E97]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-[#726E97]" : "bg-slate-300"}`} />
                            <span className="text-xs font-medium text-slate-700">{dose.dosis_numero}</span>
                            <span className="text-[10px] text-slate-400">desde {dose.edad_meses_ideal} meses</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#726E97]">
                            <Users className="w-3 h-3" />
                            <span>Pendientes</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: panel de pendientes */}
          <div>
            {!selectedDose ? (
              <div className="bg-white rounded-xl border border-slate-100 border-dashed p-10 flex flex-col items-center justify-center gap-3">
                <Users className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400 text-center leading-relaxed">
                  Selecciona una dosis del catálogo para ver qué pacientes tienen esta vacuna pendiente
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header del panel */}
                <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: "#726E97" }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedDose.nombre_enfermedad}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">{selectedDose.dosis_numero}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedDose(null); setPendingPatients([]); setPendingLoaded(false); }}
                    className="text-white/60 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filtro de rango de edad */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    Buscar pacientes en rango de edad
                  </p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Desde (meses)</label>
                      <input
                        type="number"
                        min="0"
                        value={ageMin}
                        onChange={(e) => setAgeMin(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#726E97]"
                      />
                    </div>
                    <span className="text-slate-400 text-xs mb-2">—</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Hasta (meses)</label>
                      <input
                        type="number"
                        min="0"
                        value={ageMax}
                        onChange={(e) => setAgeMax(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#726E97]"
                      />
                    </div>
                    <button
                      onClick={loadPendingPatients}
                      disabled={loadingPending}
                      className="px-3 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
                      style={{ background: "#726E97" }}
                    >
                      {loadingPending ? "..." : "Buscar"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    12m = 1 año · 48m = 4 años · 240m = 20 años
                  </p>
                </div>

                {/* Lista de pendientes */}
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {loadingPending && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#726E97]" />
                    </div>
                  )}

                  {!loadingPending && !pendingLoaded && (
                    <p className="text-xs text-slate-400 text-center py-8">
                      Ajusta el rango y presiona Buscar
                    </p>
                  )}

                  {pendingLoaded && pendingPatients.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      <p className="text-xs text-emerald-600 font-medium">¡Al día!</p>
                      <p className="text-xs text-slate-400 text-center px-4">
                        Todos los pacientes en este rango ya tienen esta dosis registrada.
                      </p>
                    </div>
                  )}

                  {pendingPatients.map((p) => {
                    const ageMonths = calcAgeMonths(p.fecha_nacimiento);
                    const overdue = ageMonths > parseInt(ageMax || "9999");
                    return (
                      <div key={p.id_paciente} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-xs font-bold shrink-0">
                          {getInitials(p.nombre_completo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{p.nombre_completo}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatAge(ageMonths)} · {p.sexo === "M" ? "Masculino" : "Femenino"}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1 ${
                          overdue
                            ? "bg-red-50 border border-red-200 text-red-500"
                            : "bg-amber-50 border border-amber-200 text-amber-600"
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          {overdue ? "Vencido" : "Pendiente"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {pendingLoaded && pendingPatients.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-700">{pendingPatients.length}</strong>{" "}
                      paciente{pendingPatients.length !== 1 ? "s" : ""} sin esta dosis en el rango seleccionado
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <QRModal onClose={() => setModalOpen(false)} preselectedVaccineId={preselectedId} />
      )}
      {showAddVaccine && (
        <AddVaccineModal onClose={() => setShowAddVaccine(false)} onSaved={loadVaccineGroups} />
      )}
    </div>
  );
}
