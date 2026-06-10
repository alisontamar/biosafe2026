import { useState } from "react";
import { FileText, BarChart3, AlertCircle, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../lib/supabase";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// ── shared helpers ─────────────────────────────────────────────────────────────
async function getUserContext(): Promise<{ nombre: string; establecimiento: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { nombre: "", establecimiento: "Sistema Central" };

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre_completo, establecimientos(nombre_establecimiento)")
    .eq("id_usuario", session.user.id)
    .single();

  const estData = profile?.establecimientos as any;
  const nombreEst = Array.isArray(estData)
    ? estData[0]?.nombre_establecimiento
    : estData?.nombre_establecimiento;

  return {
    nombre: profile?.nombre_completo ?? "",
    establecimiento: nombreEst ?? "Sistema Central",
  };
}

function buildHeader(doc: jsPDF, title: string, establecimiento: string, mes: string, anio: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(114, 110, 151);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BIOSAFE", 14, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestión de Vacunación", 14, 18);
  doc.text(`${mes} ${anio}`, w - 14, 11, { align: "right" });
  doc.text(establecimiento, w - 14, 18, { align: "right" });

  doc.setTextColor(60, 60, 80);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 40);
  doc.setDrawColor(114, 110, 151);
  doc.setLineWidth(0.5);
  doc.line(14, 43, w - 14, 43);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 140);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-BO")} — ${establecimiento}`, 14, 49);
}

function buildFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(240, 240, 245);
  doc.rect(0, h - 12, w, 12, "F");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 150);
  doc.setFont("helvetica", "normal");
  doc.text("BIOSAFE 2026 — Documento generado automáticamente. No requiere firma.", 14, h - 4);
  doc.text("Pág. 1", w - 14, h - 4, { align: "right" });
}

// ── component ─────────────────────────────────────────────────────────────────
export function ReportsView() {
  const [mes,  setMes]  = useState(new Date().getMonth());
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState<string | null>(null);

  // ── Reporte 1: Consolidado Mensual ───────────────────────────────────────────
  const generarConsolidado = async () => {
    setLoading("consolidado");
    try {
      const ctx = await getUserContext();
      const start = new Date(anio, mes, 1).toISOString();
      const end   = new Date(anio, mes + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from("dosis_aplicadas")
        .select(`
          fecha_aplicacion, lote, origen_registro,
          cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero )
        `)
        .gte("fecha_aplicacion", start)
        .lte("fecha_aplicacion", end)
        .order("fecha_aplicacion", { ascending: true });

      const doses = data ?? [];

      const grouped = new Map<string, { dosis: string; count: number; lotes: Set<string> }>();
      doses.forEach(d => {
        const vac = d.cat_vacunas_oficiales as any;
        if (!vac) return;
        const key = `${vac.nombre_enfermedad}|||${vac.dosis_numero}`;
        if (!grouped.has(key)) grouped.set(key, { dosis: vac.dosis_numero, count: 0, lotes: new Set() });
        const e = grouped.get(key)!;
        e.count++;
        if (d.lote) e.lotes.add(d.lote);
      });

      const rows = Array.from(grouped.entries()).map(([key, v]) => [
        key.split("|||")[0],
        v.dosis,
        v.count.toString(),
        Array.from(v.lotes).join(", ") || "—",
      ]);

      const doc = new jsPDF();
      buildHeader(doc, "Consolidado Mensual de Dosis Aplicadas", ctx.establecimiento, MONTHS[mes], anio);

      autoTable(doc, {
        startY: 55,
        head: [["Vacuna", "Nro. Dosis", "Aplicadas", "Lotes"]],
        body: rows.length > 0 ? rows : [["Sin registros en el período seleccionado", "", "", ""]],
        headStyles:         { fillColor: [114, 110, 151], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles:         { fontSize: 8, textColor: [60, 60, 80] },
        alternateRowStyles: { fillColor: [245, 244, 252] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: "auto" },
        },
        foot:       [[`Total dosis aplicadas en ${MONTHS[mes]} ${anio}`, "", doses.length.toString(), ""]],
        footStyles: { fillColor: [230, 228, 245], textColor: [60, 60, 80], fontStyle: "bold", fontSize: 8 },
      });

      buildFooter(doc);
      doc.save(`BIOSAFE_Consolidado_${MONTHS[mes]}_${anio}.pdf`);
    } catch (err) {
      console.error("Error generando consolidado:", err);
    } finally {
      setLoading(null);
    }
  };

  // ── Reporte 2: Cobertura por Vacuna ─────────────────────────────────────────
  const generarCobertura = async () => {
    setLoading("cobertura");
    try {
      const ctx = await getUserContext();

      const { count: totalPacientes } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true });
      const nPac = totalPacientes ?? 0;

      const { data } = await supabase
        .from("dosis_aplicadas")
        .select("id_paciente, cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero )");

      const vaccineMap = new Map<string, { dosisNums: Set<string>; patients: Set<string> }>();
      (data ?? []).forEach(d => {
        const vac = d.cat_vacunas_oficiales as any;
        if (!vac) return;
        const name = vac.nombre_enfermedad as string;
        if (!vaccineMap.has(name)) vaccineMap.set(name, { dosisNums: new Set(), patients: new Set() });
        const e = vaccineMap.get(name)!;
        e.dosisNums.add(vac.dosis_numero);
        e.patients.add(d.id_paciente);
      });

      const rows = Array.from(vaccineMap.entries())
        .sort((a, b) => b[1].patients.size - a[1].patients.size)
        .map(([name, v]) => {
          const cov    = nPac > 0 ? Math.min(Math.round((v.patients.size / nPac) * 100), 100) : 0;
          const estado = cov >= 90 ? "Óptima" : cov >= 75 ? "En riesgo" : "Crítica";
          return [name, String(v.dosisNums.size), nPac.toString(), v.patients.size.toString(), `${cov}%`, estado];
        });

      const avgCov = rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + parseInt(r[4]), 0) / rows.length)
        : 0;

      const doc = new jsPDF();
      buildHeader(doc, "Reporte de Cobertura por Vacuna", ctx.establecimiento, MONTHS[mes], anio);

      // Mini KPI boxes
      const kpis = [
        { label: "Cobertura promedio", value: `${avgCov}%` },
        { label: "Total pacientes objetivo", value: nPac.toLocaleString() },
        { label: "Vacunas en catálogo", value: rows.length.toString() },
      ];
      kpis.forEach((k, i) => {
        const x = 14 + i * 62;
        doc.setFillColor(245, 244, 252);
        doc.roundedRect(x, 54, 58, 18, 3, 3, "F");
        doc.setFontSize(7);
        doc.setTextColor(114, 110, 151);
        doc.setFont("helvetica", "bold");
        doc.text(k.label, x + 4, 61);
        doc.setFontSize(14);
        doc.setTextColor(60, 52, 137);
        doc.text(k.value, x + 4, 70);
      });

      autoTable(doc, {
        startY: 78,
        head: [["Vacuna", "Variantes", "Objetivo", "Vacunados", "Cobertura", "Estado"]],
        body: rows.length > 0 ? rows : [["Sin datos disponibles", "", "", "", "", ""]],
        headStyles:         { fillColor: [114, 110, 151], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles:         { fontSize: 8, textColor: [60, 60, 80] },
        alternateRowStyles: { fillColor: [245, 244, 252] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 25, halign: "center" },
          5: { cellWidth: 30, halign: "center" },
        },
        didParseCell: (data) => {
          if (data.column.index === 5 && data.section === "body") {
            const v = data.cell.raw as string;
            if (v === "Crítica")   data.cell.styles.textColor = [162, 45, 45];
            if (v === "En riesgo") data.cell.styles.textColor = [133, 79, 11];
            if (v === "Óptima")    data.cell.styles.textColor = [59, 109, 17];
          }
        },
      });

      buildFooter(doc);
      doc.save(`BIOSAFE_Cobertura_${MONTHS[mes]}_${anio}.pdf`);
    } catch (err) {
      console.error("Error generando cobertura:", err);
    } finally {
      setLoading(null);
    }
  };

  // ── Reporte 3: Pacientes en Mora ─────────────────────────────────────────────
  const generarMora = async () => {
    setLoading("mora");
    try {
      const ctx = await getUserContext();

      const { data } = await supabase
        .from("dosis_aplicadas")
        .select(`
          fecha_vencimiento_proxima,
          pacientes ( nombre_completo, fecha_nacimiento ),
          cat_vacunas_oficiales ( nombre_enfermedad, dosis_numero )
        `)
        .not("fecha_vencimiento_proxima", "is", null)
        .lt("fecha_vencimiento_proxima", new Date().toISOString())
        .order("fecha_vencimiento_proxima", { ascending: true });

      const rows = (data ?? []).map(d => {
        const pac  = d.pacientes as any;
        const vac  = d.cat_vacunas_oficiales as any;
        const venc = new Date(d.fecha_vencimiento_proxima!);
        const diasVencido = Math.floor((Date.now() - venc.getTime()) / 86_400_000);
        const edadAnios   = pac?.fecha_nacimiento
          ? Math.floor((Date.now() - new Date(pac.fecha_nacimiento).getTime()) / (365.25 * 86_400_000))
          : null;
        return [
          pac?.nombre_completo ?? "Desconocido",
          edadAnios !== null ? `${edadAnios} años` : "—",
          vac ? `${vac.nombre_enfermedad} — ${vac.dosis_numero}` : "—",
          venc.toLocaleDateString("es-BO"),
          `${diasVencido} días`,
        ];
      });

      const doc = new jsPDF();
      buildHeader(doc, "Pacientes en Mora — Dosis Vencidas", ctx.establecimiento, MONTHS[mes], anio);

      doc.setFillColor(252, 235, 235);
      doc.roundedRect(14, 54, 180, 14, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(162, 45, 45);
      doc.setFont("helvetica", "bold");
      doc.text(
        rows.length > 0
          ? `${rows.length} paciente(s) con dosis vencidas requieren atención inmediata.`
          : "No se encontraron pacientes en mora.",
        18,
        63,
      );

      autoTable(doc, {
        startY: 74,
        head: [["Paciente", "Edad", "Vacuna / Dosis", "Fecha Venc.", "Días Vencido"]],
        body: rows.length > 0 ? rows : [["Sin pacientes en mora al día de hoy", "", "", "", ""]],
        headStyles:         { fillColor: [114, 110, 151], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles:         { fontSize: 8, textColor: [60, 60, 80] },
        alternateRowStyles: { fillColor: [252, 247, 247] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 18, halign: "center" },
          2: { cellWidth: 62 },
          3: { cellWidth: 28, halign: "center" },
          4: { cellWidth: 25, halign: "center" },
        },
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === "body") {
            const dias = parseInt(data.cell.raw as string);
            data.cell.styles.textColor = dias > 30 ? [162, 45, 45] : [133, 79, 11];
            data.cell.styles.fontStyle = "bold";
          }
        },
        foot:       [["Total", "", "", "", `${rows.length} paciente(s)`]],
        footStyles: { fillColor: [252, 235, 235], textColor: [162, 45, 45], fontStyle: "bold", fontSize: 8 },
      });

      buildFooter(doc);
      doc.save(`BIOSAFE_Mora_${new Date().toLocaleDateString("es-BO").replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error("Error generando mora:", err);
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id:     "consolidado",
      icon:   FileText,
      title:  "Consolidado Mensual",
      desc:   "Resumen de todas las dosis aplicadas en el período, agrupadas por vacuna y número de dosis con lotes.",
      action: generarConsolidado,
      accent: "text-[#726E97] bg-purple-50",
    },
    {
      id:     "cobertura",
      icon:   BarChart3,
      title:  "Cobertura por Vacuna",
      desc:   "Porcentaje de cobertura de cada vacuna frente a la población de pacientes registrada en el sistema.",
      action: generarCobertura,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      id:     "mora",
      icon:   AlertCircle,
      title:  "Pacientes en Mora",
      desc:   "Listado completo de pacientes con dosis vencidas sin aplicar, ordenados por antigüedad del vencimiento.",
      action: generarMora,
      accent: "text-red-500 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-[#726E97]">Reportes y Descargas</h1>

      {/* Period selector */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Período:</span>
        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#726E97]/30"
        >
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#726E97]/30"
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-1">
          Aplica al Consolidado Mensual y Cobertura. Mora siempre refleja el estado actual.
        </span>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map(r => {
          const Icon      = r.icon;
          const isLoading = loading === r.id;
          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-sm transition"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.accent}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
              <button
                onClick={r.action}
                disabled={loading !== null}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 hover:opacity-90"
                style={{ background: "#726E97" }}
              >
                {isLoading
                  ? <><Loader2 size={14} className="animate-spin" />Generando…</>
                  : <><Download size={14} />Generar PDF</>
                }
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Los PDF se generan y descargan directamente en tu dispositivo — no se almacenan en el servidor.
      </p>
    </div>
  );
}

export default ReportsView;
