import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, ShieldCheck, Bell, Loader2, TrendingDown, Globe, Thermometer } from 'lucide-react';

type RiskLevel = 'alto' | 'moderado' | 'bajo';

interface AlertPoint {
  lat: number;
  lng: number;
  city: string;
  risk: RiskLevel;
  type: string;
  message: string;
}

const alertPoints: AlertPoint[] = [
  { lat: -16.5,  lng: -68.15, city: 'La Paz',      risk: 'alto',     type: 'Frío intenso',       message: 'Temperaturas bajas generan riesgo respiratorio elevado. Revisa que las vacunas de tus hijos estén al día.' },
  { lat: -17.39, lng: -66.16, city: 'Cochabamba',   risk: 'moderado', type: 'Temporada lluviosa',  message: 'Vigilancia activa por enfermedades de transmisión hídrica. Mantén higiene y vacunación al día.' },
  { lat: -17.78, lng: -63.18, city: 'Santa Cruz',   risk: 'moderado', type: 'Calor extremo',       message: 'Temperaturas altas aumentan el riesgo de deshidratación en niños pequeños.' },
  { lat: -11.02, lng: -66.0,  city: 'Trinidad',     risk: 'alto',     type: 'Alerta vectorial',    message: 'Alta actividad de vectores en la zona. Vacuna de Fiebre Amarilla obligatoria para menores.' },
  { lat: -19.58, lng: -65.75, city: 'Potosí',       risk: 'alto',     type: 'Frío severo',         message: 'Temperaturas bajo cero. Infecciones respiratorias en aumento. Protege a los menores de 5 años.' },
  { lat: -21.53, lng: -64.73, city: 'Tarija',       risk: 'bajo',     type: 'Sin alertas activas', message: 'Condiciones normales en la zona. Mantén el calendario de vacunación al día como medida preventiva.' },
  { lat: -17.96, lng: -67.11, city: 'Oruro',        risk: 'alto',     type: 'Frío extremo',        message: 'Semana con temperaturas muy bajas. Alto riesgo de IRA en niños menores de 5 años.' },
  { lat: -13.8,  lng: -65.38, city: 'Rurrenabaque', risk: 'alto',     type: 'Zona tropical',       message: 'Actividad de vectores elevada. Vacunas de Fiebre Amarilla y tropicales recomendadas.' },
  { lat: -18.0,  lng: -63.2,  city: 'San Ignacio',  risk: 'moderado', type: 'Vigilancia activa',   message: 'Monitoreo preventivo en curso. Mantén las vacunas de tus hijos actualizadas.' },
  { lat: -16.28, lng: -63.63, city: 'San Borja',    risk: 'moderado', type: 'Lluvia prolongada',   message: 'Zona con acumulación de agua. Riesgo de enfermedades transmitidas por vectores.' },
];

const riskColor: Record<RiskLevel, string> = {
  alto:     '#ef4444',
  moderado: '#f59e0b',
  bajo:     '#10b981',
};

const riskBg: Record<RiskLevel, string> = {
  alto:     '#fef2f2',
  moderado: '#fffbeb',
  bajo:     '#f0fdf4',
};

const riskLabel: Record<RiskLevel, string> = {
  alto:     'Riesgo Alto',
  moderado: 'Riesgo Moderado',
  bajo:     'Sin Alertas',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Vanilla Leaflet map component ────────────────────────────────────────────
function LeafletMap({ userPos }: { userPos: [number, number] | null }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const map = L.map(divRef.current, {
      center: [-16.5, -64.5],
      zoom: 5,
      scrollWheelZoom: false,
      attributionControl: false,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    alertPoints.forEach(pt => {
      const radius = pt.risk === 'alto' ? 11 : pt.risk === 'moderado' ? 8 : 6;
      const circle = L.circleMarker([pt.lat, pt.lng], {
        color: riskColor[pt.risk],
        fillColor: riskColor[pt.risk],
        fillOpacity: 0.78,
        radius,
        weight: 2,
      }).addTo(map);

      circle.bindPopup(`
        <div style="min-width:170px;font-family:system-ui,sans-serif;">
          <p style="font-weight:700;font-size:0.85rem;margin:0 0 4px;color:#1a1a2e;">${pt.city}</p>
          <span style="display:inline-block;font-size:0.68rem;font-weight:600;color:${riskColor[pt.risk]};background:${riskBg[pt.risk]};border-radius:999px;padding:2px 8px;margin-bottom:6px;">${riskLabel[pt.risk]}</span>
          <p style="font-size:0.78rem;font-weight:500;color:#374151;margin:0 0 4px;">${pt.type}</p>
          <p style="font-size:0.74rem;color:#6b7280;margin:0;line-height:1.5;">${pt.message}</p>
        </div>
      `, { maxWidth: 220 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userPos) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = L.circleMarker(userPos, {
      color: '#7698B3',
      fillColor: '#7698B3',
      fillOpacity: 0.95,
      radius: 9,
      weight: 3,
    })
      .addTo(mapRef.current)
      .bindPopup('<p style="font-size:0.82rem;font-weight:600;margin:0;color:#1a1a2e;">📍 Tu ubicación</p>');

    mapRef.current.flyTo(userPos, 10, { duration: 1.5 });
  }, [userPos]);

  return <div ref={divRef} style={{ height: '100%', width: '100%' }} />;
}

// ── Signals list ─────────────────────────────────────────────────────────────
const signals = [
  { icon: TrendingDown, title: 'Abandono de esquemas',   text: 'Detecta zonas donde los niños no están completando su vacunación.' },
  { icon: Globe,        title: 'Datos epidemiológicos',  text: 'Cruza señales de salud pública oficiales con datos del sistema.' },
  { icon: Thermometer,  title: 'Clima regional',         text: 'Relaciona frío, lluvias y temporada con riesgo preventivo.' },
];

// ── Main section ─────────────────────────────────────────────────────────────
export default function AISection() {
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'found' | 'denied'>('idle');
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [nearest, setNearest] = useState<AlertPoint | null>(null);

  const handleVerify = () => {
    if (geoState === 'found') return;
    setGeoState('loading');

    if (!navigator.geolocation) {
      setNearest(alertPoints[0]);
      setGeoState('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos: [number, number] = [coords.latitude, coords.longitude];
        setUserPos(pos);
        const closest = alertPoints.reduce((prev, curr) =>
          haversineKm(pos[0], pos[1], curr.lat, curr.lng) <
          haversineKm(pos[0], pos[1], prev.lat, prev.lng) ? curr : prev
        );
        setNearest(closest);
        setGeoState('found');
      },
      () => {
        setNearest(alertPoints[0]);
        setGeoState('denied');
      },
      { timeout: 8000 }
    );
  };

  return (
    <section
      id="ia"
      style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(180deg, #fbfbfd 0%, #f8f7fc 50%, #eef2f7 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:-80, right:-60, width:300, height:300, borderRadius:'50%', background:'#726E97', opacity:0.06, filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, left:-40, width:260, height:260, borderRadius:'50%', background:'#7698B3', opacity:0.07, filter:'blur(50px)', pointerEvents:'none' }} />

      <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <span style={{ display:'inline-block', fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.22em', textTransform:'uppercase', color:'#7698B3', marginBottom:'0.75rem' }}>
            Inteligencia preventiva
          </span>
          <h2 style={{ fontSize:'clamp(1.9rem, 4.5vw, 3rem)', fontWeight:700, color:'#1a1a2e', lineHeight:1.15, margin:'0 0 1rem' }}>
            Alertas epidemiológicas{' '}
            <span style={{ color:'#726E97', fontStyle:'italic', fontWeight:300 }}>en tu zona</span>
          </h2>
          <p style={{ color:'#9ca3af', fontWeight:300, fontSize:'0.95rem', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
            BioSafe monitorea señales de salud pública y te notifica si hay un riesgo preventivo
            cerca de tu familia — antes de que el brote se propague.
          </p>
        </div>

        {/* Two-column grid */}
        <div
          className="ai-grid"
          style={{ display:'grid', gridTemplateColumns:'1fr 1.25fr', gap:'2.5rem', alignItems:'start' }}
        >
          {/* LEFT */}
          <div>
            <h3 style={{ fontSize:'1.25rem', fontWeight:700, color:'#1a1a2e', marginBottom:'0.5rem', marginTop:0 }}>
              La app analiza señales reales para protegerte
            </h3>
            <p style={{ fontSize:'0.875rem', fontWeight:300, color:'#6b7280', lineHeight:1.75, marginBottom:'1.75rem' }}>
              El sistema cruza datos de vacunación, condiciones climáticas y alertas sanitarias
              oficiales para generar notificaciones preventivas personalizadas para cada zona del país.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem', marginBottom:'2rem' }}>
              {signals.map(({ icon: Icon, title, text }) => (
                <div key={title} style={{ display:'flex', gap:'0.85rem', alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(114,110,151,0.09)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} style={{ color:'#726E97' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1a1a2e', margin:'0 0 0.2rem' }}>{title}</p>
                    <p style={{ fontSize:'0.82rem', fontWeight:300, color:'#6b7280', lineHeight:1.65, margin:0 }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'1rem 1.25rem', borderLeft:'3px solid #7698B3', background:'rgba(118,152,179,0.06)', borderRadius:'0 12px 12px 0' }}>
              <Bell size={15} style={{ color:'#726E97', marginTop:2, flexShrink:0 }} />
              <p style={{ fontSize:'0.82rem', fontWeight:300, color:'#6b7280', lineHeight:1.65, margin:0 }}>
                Las notificaciones llegan directamente a tu celular. Cuando BioSafe detecta una
                alerta en tu zona, recibes un aviso con recomendaciones específicas para tu familia.
              </p>
            </div>
          </div>

          {/* RIGHT: map */}
          <div>
            <p style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:'#7698B3', marginBottom:'0.6rem', marginTop:0 }}>
              Mapa de alertas activas — Bolivia
            </p>

            {/* Legend */}
            <div style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
              {(['alto','moderado','bajo'] as RiskLevel[]).map(level => (
                <div key={level} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:riskColor[level] }} />
                  <span style={{ fontSize:'0.72rem', color:'#6b7280' }}>{riskLabel[level]}</span>
                </div>
              ))}
            </div>

            {/* Map container */}
            <div style={{ borderRadius:18, overflow:'hidden', border:'1.5px solid rgba(114,110,151,0.15)', boxShadow:'0 4px 24px rgba(114,110,151,0.1)', height:340 }}>
              <LeafletMap userPos={userPos} />
            </div>

            {/* Verify button */}
            <div style={{ marginTop:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <button
                onClick={handleVerify}
                disabled={geoState === 'loading' || geoState === 'found'}
                style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  padding:'0.75rem 1.5rem', borderRadius:12, border:'none',
                  cursor: geoState === 'loading' || geoState === 'found' ? 'default' : 'pointer',
                  background: geoState === 'found'
                    ? 'rgba(114,110,151,0.1)'
                    : 'linear-gradient(135deg, #726E97, #7698B3)',
                  color: geoState === 'found' ? '#726E97' : '#fff',
                  fontSize:'0.875rem', fontWeight:600,
                  opacity: geoState === 'loading' ? 0.7 : 1,
                  transition:'opacity 0.2s',
                }}
              >
                {geoState === 'loading' && <Loader2 size={16} className="spin-icon" />}
                {(geoState === 'idle' || geoState === 'denied') && <MapPin size={16} />}
                {geoState === 'found' && <ShieldCheck size={16} />}

                {geoState === 'idle'    && 'Verificar alertas en mi zona'}
                {geoState === 'loading' && 'Obteniendo ubicación…'}
                {geoState === 'found'   && 'Alerta más cercana encontrada'}
                {geoState === 'denied'  && 'Verificar alertas en mi zona'}
              </button>

              {/* Result card */}
              {(geoState === 'found' || geoState === 'denied') && nearest && (
                <div
                  style={{
                    borderRadius:14, padding:'1.1rem 1.25rem',
                    background: riskBg[nearest.risk],
                    border:`1.5px solid ${riskColor[nearest.risk]}35`,
                    display:'flex', gap:'0.85rem', alignItems:'flex-start',
                    animation:'fadeUp 0.35s ease both',
                  }}
                >
                  <AlertTriangle size={18} style={{ color:riskColor[nearest.risk], marginTop:1, flexShrink:0 }} />
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#1a1a2e' }}>{nearest.city}</span>
                      <span style={{ fontSize:'0.7rem', fontWeight:600, color:riskColor[nearest.risk], background:`${riskColor[nearest.risk]}18`, borderRadius:999, padding:'0.15rem 0.55rem' }}>
                        {riskLabel[nearest.risk]}
                      </span>
                      <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>· {nearest.type}</span>
                    </div>
                    <p style={{ fontSize:'0.8rem', fontWeight:300, color:'#374151', lineHeight:1.6, margin:0 }}>
                      {nearest.message}
                    </p>
                    {geoState === 'denied' && (
                      <p style={{ fontSize:'0.71rem', color:'#9ca3af', margin:'0.4rem 0 0', fontStyle:'italic' }}>
                        Ubicación no disponible — mostrando La Paz como ejemplo.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius:12px !important; box-shadow:0 4px 20px rgba(0,0,0,0.12) !important; }
        .leaflet-popup-tip { display:none !important; }
        @media (max-width: 768px) {
          .ai-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
