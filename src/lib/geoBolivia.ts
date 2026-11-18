// Coordenadas de referencia (departamentos y ciudades/municipios principales de Bolivia)
// usadas para ubicar alertas epidemiológicas que solo traen texto de zona.
export interface Lugar { nombre: string; lat: number; lng: number }

export const LUGARES: Lugar[] = [
  // Municipios / ciudades (más específicos primero)
  { nombre: "El Alto", lat: -16.504, lng: -68.163 },
  { nombre: "Cercado", lat: -17.3935, lng: -66.157 },
  { nombre: "Quillacollo", lat: -17.397, lng: -66.278 },
  { nombre: "Sacaba", lat: -17.397, lng: -66.04 },
  { nombre: "Montero", lat: -17.34, lng: -63.25 },
  { nombre: "Yacuiba", lat: -22.016, lng: -63.677 },
  { nombre: "Villazon", lat: -22.088, lng: -65.595 },
  { nombre: "Riberalta", lat: -11.0, lng: -66.06 },
  { nombre: "Rurrenabaque", lat: -14.44, lng: -67.53 },
  { nombre: "San Borja", lat: -14.82, lng: -66.85 },
  { nombre: "San Ignacio", lat: -16.38, lng: -60.96 },
  { nombre: "Cobija", lat: -11.03, lng: -68.77 },
  { nombre: "Trinidad", lat: -14.83, lng: -64.9 },
  { nombre: "Camiri", lat: -20.05, lng: -63.52 },
  { nombre: "Tupiza", lat: -21.44, lng: -65.72 },
  { nombre: "Uyuni", lat: -20.46, lng: -66.83 },
  // Capitales
  { nombre: "La Paz", lat: -16.4897, lng: -68.1193 },
  { nombre: "Cochabamba", lat: -17.3895, lng: -66.1568 },
  { nombre: "Santa Cruz", lat: -17.7833, lng: -63.1821 },
  { nombre: "Oruro", lat: -17.9647, lng: -67.1061 },
  { nombre: "Potosi", lat: -19.5836, lng: -65.7531 },
  { nombre: "Sucre", lat: -19.0196, lng: -65.2619 },
  { nombre: "Chuquisaca", lat: -19.0196, lng: -65.2619 },
  { nombre: "Tarija", lat: -21.5355, lng: -64.7296 },
  { nombre: "Beni", lat: -14.83, lng: -64.9 },
  { nombre: "Pando", lat: -11.03, lng: -68.77 },
];

export const normalizar = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Devuelve coordenadas de una alerta: columnas lat/lng o búsqueda por nombre de lugar. */
export function ubicar(a: Record<string, any>): { lat: number; lng: number; lugar: string } | null {
  const lat = Number(a.latitud ?? a.lat);
  const lng = Number(a.longitud ?? a.lng ?? a.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (a.latitud ?? a.lat) != null) {
    return { lat, lng, lugar: [a.municipio, a.departamento, a.zona].filter(Boolean).join(" - ") || "Ubicación" };
  }
  const campos = [a.municipio, a.zona, a.departamento, a.region, a.ubicacion, a.titulo, a.resumen];
  for (const c of campos) {
    const t = normalizar(c);
    if (!t) continue;
    const hit = LUGARES.find((l) => t.includes(normalizar(l.nombre)));
    if (hit) return { lat: hit.lat, lng: hit.lng, lugar: hit.nombre };
  }
  return null;
}
