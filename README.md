# BioSafe — Plataforma Web de Gestión de Vacunación

Aplicación web desarrollada en React + Vite para la gestión del esquema de vacunación del PAI Bolivia. Sirve como portal público de información para familias y como panel de gestión para personal de salud y administradores de establecimientos.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Scanner QR | html5-qrcode |
| Mapas | Leaflet (vanilla JS via useRef) |
| Gráficos | Recharts |
| Iconos | Lucide React |

---

## Roles de usuario

| Rol | Descripción |
|---|---|
| `SuperAdmin` | Acceso total. Crea establecimientos y AdminEstablecimiento |
| `AdminEstablecimiento` | Administra su centro de salud y crea personal |
| `Medico` | Escanea QR, registra dosis, accede a expedientes |
| `Enfermero` | Igual que Médico |
| `Farmaceutico` | Igual que Médico |
| `Tutor_PersonaNormal` | Padre/tutor. Creado por admin, usa la app móvil |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── Header.tsx              → Navbar sticky con drawer mobile
│   ├── Hero.tsx                → Hero animado con título letra por letra
│   ├── HowItWorks.tsx          → Sección "¿Qué es BioSafe?" (4 features)
│   ├── AISection.tsx           → Alertas epidemiológicas + mapa Leaflet
│   ├── Network.tsx             → "BioSafe para todos" + CTA descarga app
│   ├── Footer.tsx              → Pie de página con contacto
│   ├── LoginModal.tsx          → Modal de autenticación (Supabase Auth)
│   ├── AdminDashboard.tsx      → Dashboard autenticado con sidebar
│   ├── HomeView.tsx            → Inicio: stats, cobertura, pendientes, alertas IA
│   ├── PatientsView.tsx        → Gestión de pacientes con alta y QR
│   ├── VaccinationView.tsx     → Scanner QR + catálogo PAI + registro de dosis
│   ├── AlertsView.tsx          → Alertas epidemiológicas del sistema
│   ├── ReportsView.tsx         → Descarga de reportes PDF
│   ├── IndicatorsView.tsx      → Gráficos de cobertura por vacuna
│   ├── SettingsView.tsx        → Configuración: establecimientos y personal
│   └── StatCard.tsx            → Tarjeta de estadística reutilizable
├── lib/
│   └── supabase.ts             → Cliente Supabase (normal + admin)
├── App.tsx                     → Enrutamiento hash: #admin → dashboard
└── main.tsx                    → Entry point
```

---

## Funcionalidades por módulo

### Página pública (landing)

Accesible sin autenticación en la ruta raíz `/`.

#### Hero
- Título animado letra por letra con efecto hover por carácter
- Descripción directa de qué es BioSafe para padres y familias
- CTAs: "Descarga la App" y "Portal Profesional"
- Pills de funcionalidades clave (QR, alertas, guías)
- Responsive: centrado vertical en desktop, top-aligned en mobile

#### ¿Qué es BioSafe? (`HowItWorks`)
- 4 tarjetas de funcionalidades principales:
  1. **Carnet QR digital** — QR único por persona, funciona en cualquier centro de salud
  2. **Esquema PAI Bolivia** — 15+ vacunas oficiales con historial de fechas y lotes
  3. **Alertas y recordatorios** — Notificaciones antes de cada dosis y alertas de brotes
  4. **Guías para padres** — Consejos post-vacuna, efectos esperados, señales de alerta
- Hover con sombra y borde de acento por tarjeta
- Pills descriptivos por funcionalidad

#### Alertas epidemiológicas (`AISection`)
- Explicación del sistema de monitoreo preventivo (3 señales: abandono, datos epidemiológicos, clima)
- **Mapa Leaflet real** con 10 puntos de alerta estáticos sobre Bolivia (OpenStreetMap)
- Marcadores con colores por nivel: Rojo (alto) · Naranja (moderado) · Verde (sin alertas)
- Popups en cada marcador con ciudad, tipo y descripción del riesgo
- Botón **"Verificar alertas en mi zona"**:
  - Solicita `navigator.geolocation`
  - Calcula distancia Haversine a cada punto de alerta
  - Vuela el mapa (`flyTo`) a la ubicación del usuario
  - Muestra tarjeta con la alerta más cercana
  - Fallback a La Paz si se deniega la ubicación

#### BioSafe para todos (`Network`)
- 3 tarjetas por audiencia: Padres/Tutores, Personal de Salud, Establecimientos
- Cada tarjeta con descripción y lista de funcionalidades propias
- Banner de descarga con "Próximamente en Google Play y App Store"

---

### Panel de gestión (dashboard autenticado)

Accesible en `/#admin` tras autenticación con Supabase Auth.
Sidebar con 7 secciones, responsive (drawer en mobile).

#### Inicio (`HomeView`)
- Stats globales o por establecimiento según rol:
  - Padres de familia registrados
  - Niños 0-5 años en seguimiento
  - Porcentaje de esquemas completos
  - Alertas activas generadas por IA
- Gráfico de cobertura PAI con indicador circular SVG (meta 90%)
- Tabla de próximas dosis pendientes con fecha de vencimiento
- Widget de alerta epidemiológica más reciente (con gráfico sparkline)
- Acceso rápido a la sección de Vacunación

#### Pacientes (`PatientsView`)
- Lista de todos los pacientes con búsqueda por nombre
- Muestra tutor vinculado a cada paciente
- Modal de alta de nuevo paciente:
  - Nombre, fecha de nacimiento, sexo, correo
  - Indicador de embarazo
  - Crea cuenta en Supabase Auth + registro en `usuarios` + registro en `pacientes` con QR único generado automáticamente

#### Vacunación (`VaccinationView`)
- Dos pestañas: **Registrar dosis** y **Catálogo PAI**
- **Registrar dosis**:
  - Selector de vacuna del catálogo oficial
  - Botón "Escanear QR" abre modal con cámara real (html5-qrcode)
  - Verifica QR contra Supabase (`id_paciente` + `token`)
  - Muestra tarjeta del paciente: nombre, edad, sexo, historial de dosis
  - Permite seleccionar vacuna, ingresar lote, fecha de aplicación y próxima cita
  - Guarda en `dosis_aplicadas` con `origen_registro = 'Validado_En_Establecimiento'`
  - Maneja constraint de dosis duplicada
- **Catálogo PAI**:
  - Lista completa de vacunas agrupadas por enfermedad
  - Muestra dosis y edad ideal por vacuna
  - Filtro de pendientes por edad del paciente

#### Alertas (`AlertsView`)
- Lista de alertas epidemiológicas del sistema
- Estructura lista (contenido dinámico pendiente de datos IA)

#### Reportes (`ReportsView`)
- Descarga de reportes PDF:
  - Consolidado Mensual
  - Cobertura por Vacuna
  - Pacientes en Mora
- Estructura lista (generación de PDF pendiente)

#### Indicadores (`IndicatorsView`)
- Gráfico de barras: cobertura mensual por campaña
- Gráfico de línea: tendencia de cobertura acumulada
- Tabla de cobertura por vacuna del PAI (programados, aplicados, % cobertura, tendencia)
  - Semáforo: alta / baja / crítica según porcentaje
- Donut chart: distribución de esquemas (completos / en proceso / abandonados)
- Gráfico de abandonos por vacuna
- Panel de alertas de gestión con niveles crítico / alerta / ok

#### Configuración (`SettingsView`)
**SuperAdmin:**
- Lista de todos los establecimientos registrados
- Formulario para crear nuevo establecimiento (nombre, ciudad, tipo)
- Al crear establecimiento, crea automáticamente su AdminEstablecimiento en Supabase Auth + `usuarios`

**AdminEstablecimiento:**
- Lista del personal de su establecimiento
- Formulario para crear nuevo usuario con rol (Médico, Enfermero, Farmacéutico)
- Asigna automáticamente el establecimiento del admin al nuevo usuario

---

## Base de datos (Supabase)

### Tablas principales

| Tabla | Descripción |
|---|---|
| `establecimientos` | Centros de salud y farmacias del sistema |
| `usuarios` | Todos los usuarios con rol y establecimiento asignado |
| `pacientes` | Expedientes clínicos con código QR único |
| `cat_vacunas_oficiales` | Catálogo maestro del esquema PAI Bolivia |
| `dosis_aplicadas` | Historial transaccional de vacunación |
| `alertas_epidemiologicas_ia` | Alertas generadas por IA para establecimientos |

### Tipos ENUM

```sql
tipo_establecimiento: 'Centro de Salud' | 'Farmacia'
rol_usuario: 'SuperAdmin' | 'AdminEstablecimiento' | 'Medico' | 'Enfermero' | 'Farmaceutico' | 'Tutor_PersonaNormal'
origen_dosis: 'Validado_En_Establecimiento' | 'Migrado_Cartilla_Fisica'
```

---

## Configuración inicial

### 1. Variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

### 4. Crear SuperAdmin inicial

Ejecutar en el SQL Editor de Supabase después de crear el usuario en Authentication:

```sql
INSERT INTO usuarios (id_usuario, nombre_completo, correo_electronico, rol, password_hash)
VALUES (
  'uuid-del-usuario-en-auth',
  'Nombre del SuperAdmin',
  'correo@ejemplo.com',
  'SuperAdmin',
  ''
);
```

### 5. Política RLS para creación de usuarios por admins

```sql
CREATE POLICY "admins_can_insert_users" ON usuarios
FOR INSERT WITH CHECK (
  id_usuario = auth.uid()
  OR EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = auth.uid()
    AND rol IN ('SuperAdmin', 'AdminEstablecimiento')
  )
);
```

---

## Color principal

`#726E97` — Todos los elementos de acento, botones primarios, sidebar activo y marcadores QR usan este color en toda la plataforma.

---

## Estado del proyecto (junio 2026)

| Módulo | Estado |
|---|---|
| Landing pública (Hero, Features, Mapa, Red) | Completo |
| Autenticación y roles | Completo |
| Dashboard con estadísticas por rol | Completo |
| Gestión de pacientes con QR | Completo |
| Scanner QR + registro de dosis PAI | Completo |
| Catálogo PAI Bolivia | Completo |
| Indicadores y gráficos de cobertura | Completo |
| Configuración de establecimientos y personal | Completo |
| Mapa de alertas epidemiológicas (estático) | Completo |
| Alertas epidemiológicas por IA (dinámico) | Estructura lista — datos IA pendientes |
| Generación de reportes PDF | Estructura lista — generación pendiente |
