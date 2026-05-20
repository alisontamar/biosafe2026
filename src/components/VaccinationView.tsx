import { useState, useEffect } from "react";
import { Syringe, QrCode, X, CheckCircle2, ChevronDown } from "lucide-react";

const vaccines = [
  { name: "Pentavalente", dose: "3ra Dosis", target: "6 meses", stock: 45 },
  { name: "SRP (Sarampión)", dose: "1ra Dosis", target: "12 meses", stock: 12 },
  { name: "Influenza", dose: "Refuerzo", target: "Todo público", stock: 150 },
];

const vaccineOptions = [
  { value: "penta3", label: "Pentavalente · 3ra Dosis (próxima según esquema)" },
  { value: "srp1", label: "SRP (Sarampión) · 1ra Dosis" },
  { value: "inf", label: "Influenza · Refuerzo anual" },
  { value: "bcg", label: "BCG · Dosis única" },
  { value: "polio", label: "Antipolio · Refuerzo" },
];

const mockHistory = [
  { name: "Pentavalente — 1ra Dosis", date: "12/01/2026", done: true },
  { name: "Pentavalente — 2da Dosis", date: "14/03/2026", done: true },
  { name: "SRP — pendiente", date: "—", done: false },
];

type ScanState = "idle" | "scanning" | "done";

function QRModal({ onClose }: { onClose: () => void }) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function handleScan() {
    if (scanState !== "idle") return;
    setScanState("scanning");
    setTimeout(() => setScanState("done"), 1800);
  }

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(onClose, 1600);
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Registrar aplicación de vacuna</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* QR Zone */}
          <div
            onClick={handleScan}
            className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition
              ${scanState === "idle" ? "border-slate-200 cursor-pointer hover:bg-slate-50" : ""}
              ${scanState === "scanning" ? "border-slate-300 cursor-default" : ""}
              ${scanState === "done" ? "border-green-300 bg-green-50 cursor-default" : ""}
            `}
          >
            {scanState === "idle" && (
              <>
                <QrCode className="w-10 h-10 text-slate-400" />
                <span className="text-sm text-slate-500">Toca para escanear carnet QR del paciente</span>
              </>
            )}
            {scanState === "scanning" && (
              <>
                <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                <span className="text-sm text-slate-500">Escaneando…</span>
                <ScanLine />
              </>
            )}
            {scanState === "done" && (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <span className="text-sm text-green-700 font-medium">QR leído correctamente</span>
              </>
            )}
          </div>

          {/* Patient & vaccine selection */}
          {scanState === "done" && (
            <>
              {/* Person card */}
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#726E97]/15 flex items-center justify-center text-sm font-semibold text-[#726E97] shrink-0">
                  MP
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">María Pérez López</p>
                  <p className="text-xs text-slate-500">CI: 7823041 · 8 meses · Femenino</p>
                </div>
              </div>

              {/* History */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Historial de vacunas</p>
                <div className="space-y-1">
                  {mockHistory.map((h) => (
                    <div key={h.name} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${h.done ? "bg-green-400" : "bg-amber-400"}`} />
                      <span className="text-sm text-slate-700 flex-1">{h.name}</span>
                      <span className="text-xs text-slate-400">{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vaccine selector */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vacuna a aplicar</p>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={confirmed}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#726E97]/30 focus:border-[#726E97]"
                >
                  <option value="">— Seleccionar vacuna —</option>
                  {vaccineOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {confirmed && (
                <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 font-medium">Aplicación registrada correctamente</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || confirmed}
            className="flex-[2] py-2 bg-[#726E97] text-white rounded-lg text-sm font-semibold hover:bg-[#5c5980] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Confirmar registro
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanLine() {
  return (
    <div
      className="absolute left-0 right-0 h-0.5 bg-[#726E97]"
      style={{ animation: "scanMove 1.5s linear infinite" }}
    />
  );
}

export default function VaccinationView() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <style>{`@keyframes scanMove { 0%{top:10%} 100%{top:90%} }`}</style>

      <h1 className="text-2xl font-bold text-[#726E97]">Control de Vacunación</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vaccines.map((v) => (
          <div key={v.name} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#726E97]/10 rounded-lg text-[#726E97]">
                <Syringe className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${v.stock < 20 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                Stock: {v.stock}
              </span>
            </div>
            <h3 className="font-bold text-slate-800">{v.name}</h3>
            <p className="text-sm text-slate-500">{v.dose} • {v.target}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 w-full py-2 border border-[#726E97] text-[#726E97] rounded-lg text-sm font-semibold hover:bg-[#726E97] hover:text-white transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Registrar con QR
            </button>
          </div>
        ))}
      </div>

      {showModal && <QRModal onClose={() => setShowModal(false)} />}
    </div>
  );
}