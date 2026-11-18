import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ubicar } from "../lib/geoBolivia";
import { nivelDe, type Alerta } from "./AlertsView";

const PESO = { alto: 3, medio: 2, bajo: 1 } as const;
const COLOR = { alto: "#EF4444", medio: "#F59E0B", bajo: "#10B981" } as const;

interface Foco {
  lat: number; lng: number; lugar: string;
  peso: number; nivel: "alto" | "medio" | "bajo"; alertas: Alerta[];
}

/** Mapa de calor: cada foco se dibuja con anillos concéntricos translúcidos (colores planos). */
export default function AlertsHeatMap({ alertas, onSelect }: { alertas: Alerta[]; onSelect: (a: Alerta) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const capaRef = useRef<L.LayerGroup | null>(null);

  const { focos, sinUbicar } = useMemo(() => {
    const mapa = new Map<string, Foco>();
    let sin = 0;
    for (const a of alertas) {
      const u = ubicar(a);
      if (!u) { sin++; continue; }
      const key = `${u.lat.toFixed(2)},${u.lng.toFixed(2)}`;
      const n = nivelDe(a);
      const f = mapa.get(key) ?? { ...u, peso: 0, nivel: "bajo" as const, alertas: [] };
      f.peso += PESO[n];
      if (PESO[n] > PESO[f.nivel]) f.nivel = n;
      f.alertas.push(a);
      mapa.set(key, f);
    }
    return { focos: [...mapa.values()], sinUbicar: sin };
  }, [alertas]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { center: [-16.8, -64.6], zoom: 5, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    capaRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; capaRef.current = null; };
  }, []);

  useEffect(() => {
    const capa = capaRef.current, map = mapRef.current;
    if (!capa || !map) return;
    capa.clearLayers();
    focos.forEach((f) => {
      const base = 25000 + Math.min(f.peso, 12) * 12000; // metros
      [1, 0.66, 0.36].forEach((k, i) => {
        L.circle([f.lat, f.lng], {
          radius: base * k, stroke: false, fillColor: COLOR[f.nivel], fillOpacity: 0.13 + i * 0.1, interactive: false,
        }).addTo(capa);
      });
      const marker = L.circleMarker([f.lat, f.lng], {
        radius: 7, color: "#fff", weight: 2, fillColor: COLOR[f.nivel], fillOpacity: 1,
      }).addTo(capa);
      const cont = document.createElement("div");
      cont.innerHTML = `<strong style="color:#402B52">${f.lugar}</strong><br/><span style="color:#7698B3;font-size:12px">${f.alertas.length} alerta(s) activa(s)</span>`;
      const ul = document.createElement("div");
      f.alertas.slice(0, 4).forEach((a) => {
        const b = document.createElement("button");
        b.textContent = a.titulo || "Alerta epidemiológica";
        b.style.cssText = "display:block;margin-top:6px;color:#7E57C2;font-weight:600;font-size:12px;text-align:left;cursor:pointer;background:none;border:0;padding:0";
        b.onclick = () => onSelect(a);
        ul.appendChild(b);
      });
      cont.appendChild(ul);
      marker.bindPopup(cont);
    });
    if (focos.length > 0) {
      map.fitBounds(L.latLngBounds(focos.map((f) => [f.lat, f.lng] as [number, number])).pad(0.6), { maxZoom: 8 });
    }
  }, [focos, onSelect]);

  return (
    <div className="bs-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-[17px] text-[#402B52]">Mapa de calor epidemiológico</h2>
          <p className="text-xs text-slate-400">Concentración de alertas activas por zona</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase">
          {(["alto", "medio", "bajo"] as const).map((n) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: COLOR[n] }} />{n}
            </span>
          ))}
        </div>
      </div>
      <div ref={divRef} className="h-[340px] rounded-2xl overflow-hidden border border-slate-100 z-0" />
      {sinUbicar > 0 && (
        <p className="text-xs text-slate-400">{sinUbicar} alerta(s) sin zona reconocible no se muestran en el mapa.</p>
      )}
    </div>
  );
}
