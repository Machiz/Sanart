# Sanart — Plataforma de Bienestar & RAG Clínico INSN San Borja

**Sanart** es una plataforma integral de bienestar laboral, contención emocional y evaluación diagnóstica del Síndrome de Burnout diseñada específicamente para el personal médico, de enfermería y asistencial del **Instituto Nacional de Salud del Niño San Borja (INSN San Borja)**.

La aplicación combina técnicas guiadas de autocuidado, pausas activas, gamificación clínica y a **Kusito**, un asistente de inteligencia artificial con motor **RAG (Retrieval-Augmented Generation)** y evaluación multiturno basado en la normativa sanitaria oficial del MINSA e INSN San Borja.

---

## 🌟 Características Principales

### 🤖 1. Kusito — Asistente IA de Bienestar & Coach Clínico
- **Avatar Animado e Interactivo**: Robot coach con múltiples modos de movimiento (saludo, respiración guiada, meditación zen, estiramiento, escucha activa y celebración).
- **Presencia en Todo el Flujo**: Acompaña al usuario en la pantalla de bienvenida, página de inicio, barra de navegación y sesiones de pausa activa.
- **Interacción Empática**: Respuestas adaptadas al contexto hospitalario y turnos de guardia, con aperturas y preguntas diagnósticas humanizadas.

### 🧠 2. Módulo Sanart RAG & Evaluación Multiturno de Burnout
- **Base de Conocimiento Normativo RAG**: Repositorio indexado con las directivas sanitarias del INSN San Borja y normativas MINSA:
  - *DS-092-MINSA/INSN-SB-2026*: Directiva Sanitaria de Prevención y Manejo del Síndrome de Burnout.
  - *Guía Técnica RM 180-2020-MINSA*: Cuidado de la Salud Mental del Personal de la Salud.
  - *Resolución Directoral N° 045-2025-INSN-SB*: Protocolo de Clima Laboral y Autocuidado Hospitalario.
  - *Manual de Prevención de Fatiga en Guardias Hospitalarias 2026*.
- **Evaluador Multiturno Acumulativo**: Analiza el discurso del usuario a lo largo de los turnos de conversación para detectar señales en las 3 dimensiones del Burnout:
  - ⚡ *Agotamiento Emocional* (sobrecarga física/mental, falta de descanso tras guardias).
  - ❄️ *Despersonalización / Cinismo* (distanciamiento afectivo, trato impersonal).
  - 📉 *Frustración Profesional / Baja Realización Personal* (sensación de estancamiento o ineficacia).
- **Protocolo de Cuestionario MBI Escalonado**: Ante la detección de riesgo moderado (`[AMARILLO]`), activa preguntas breves del *Maslach Burnout Inventory* de forma secuencial.
- **Generación de Informe Diagnóstico Final**: Al escribir palabras clave de cierre (*"gracias"*, *"fin"*, *"terminar"*, *"salir"*) o usar el botón rápido, genera un resumen estructurado con:
  - 🆔 ID de Sesión Anónimo
  - 🏷️ Semáforo y Nivel de Riesgo (`[VERDE]`, `[AMARILLO]`, `[ROJO]`)
  - 🧩 Dimensiones afectadas y severidad en puntos
  - 📝 Diagnóstico rápido y recomendaciones personalizadas
  - 📚 Citas y artículos normativos aplicables

### 🔒 3. Privacidad y Anonimización Avanzada (`PrivacyScrubber`)
- **Enmascaramiento Automático**: Todo texto ingresado al chat es saneado en tiempo real eliminando nombres propios, correos electrónicos, DNI, números de teléfono, fechas exactas y números de colegiatura médica (CMP / CEP).
- **Arquitectura Local-First**: Las preferencias, notas personales y registros de bienestar se almacenan localmente en el navegador del usuario sin enviar datos personales identificables a servidores externos.

### 🌿 4. Actividades de Autocuidado y Pausas Clínicas
- **Respiración Guiada**: Técnicas 4-4, 4-7-8 y Coherencia Cardíaca con guía visual animada y cadencias de tiempo.
- **Paisajes Sonoros Relajantes**: Reproductor de frecuencias de bienestar (lluvia suave, cuencos tibetanos 432 Hz, olas de mar, bosque y ruido blanco).
- **Pausas Activas y Estiramientos**: Secuencias guiadas paso a paso para cuello, hombros, espalda y piernas adaptadas al entorno de trabajo.
- **Minijuegos de Desconexión Cognitiva**: Ejercicios breves de memoria, atención plena y relajación mental para despejar la mente entre procedimientos.

### 🚨 5. Botón de Agotamiento & Protocolo de Soporte Urgente
- **Activación Rápida de Apoyo**: En situaciones de sobrecarga aguda, permite solicitar atención confidencial agendada en el **próximo tiempo libre detectado** según el rol y turno del personal.
- **Directorio de Líneas Oficiales**: Enlace directo a la Línea 113 opción 5 del MINSA y al Servicio de Salud Ocupacional y Psicología del INSN San Borja.

### ✨ 6. Frases Motivadoras e Inspiración del Turno
- **Widget de Reflexión Positiva**: Frases enfocadas en el valor del autocuidado del personal de salud, con opción de alternar citas inspiradoras y sonido armónico de campana (*chime*).

### 🏆 7. Gamificación y Seguimiento de Hábitos
- **Rachas y Puntos de Bienestar**: Contador de días consecutivos de pausas activas.
- **Medallas y Logros**: Reconocimientos por minutos acumulados de autocuidado, técnicas completadas y constancia.

### 📊 8. Panel de Gestión y Administración Institucional
- **Dashboard de Tendencias**: Métricas agregadas y anónimas del estado emocional del personal por servicios (UCI Pediátrica, Cirugía, Emergencia, Hospitalización, etc.).
- **Gestión de Talleres y Eventos**: Programación y confirmación de asistencia (RSVP) a actividades presenciales y virtuales de bienestar laboral.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Next.js](https://nextjs.org/) / React 18+ con TypeScript
- **Estilos**: Tailwind CSS & CSS Custom Properties con paleta cromática hospitalaria relajante (`#005269`, `#CCF4FF`, `#0B2C36`)
- **Animaciones**: `motion/react` y animaciones CSS optimizadas por GPU
- **Iconografía**: `lucide-react`
- **Audio Sintetizado**: Web Audio API para campanas harmónicas y generador de audio procedural para paisajes sonoros

---

## 🚀 Instalación y Desarrollo Local

### Requisitos Previos
- Node.js 18.0 o superior (recomendado Node.js 22.x)
- npm 9+ o pnpm

### Pasos de Instalación

1. Clonar el repositorio o descargar el proyecto:
   ```bash
   git clone <url-del-repositorio>
   cd sanart-insn-sanborja
   ```

2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

4. Ejecutar el linter para validación de código:
   ```bash
   npm run lint
   ```

5. Generar la compilación optimizada para producción:
   ```bash
   npm run build
   ```

---

## 📋 Estructura del Proyecto

```text
├── app/
│   ├── components/
│   │   ├── RagKnowledgeSection.tsx   # Interfaz del chat RAG y buscador documental
│   │   ├── RobotCoach.tsx            # Componente animado interactivo de Kusito
│   │   ├── PauseVisuals.tsx          # Visualizadores de pausas y respiración
│   │   ├── AreaDetailModal.tsx       # Detalle de áreas para el panel administrativo
│   │   ├── ClinicalScenarioTrainer.tsx # Simulador de entrenamiento clínico
│   │   └── ui/                       # Componentes base reutilizables
│   ├── globals.css                   # Estilos globales y diseño responsivo
│   ├── layout.tsx                    # Layout principal de la aplicación
│   └── page.tsx                      # Orquestador principal y pantallas del sistema
├── lib/
│   ├── ragKnowledge.ts               # Motor RAG, evaluador multiturno de Burnout y PrivacyScrubber
│   ├── mockData.ts                   # Datos iniciales estructurados y normativas
│   ├── clinicalSimulatorData.ts      # Escenarios y casos de estudio clínicos
│   └── utils.ts                      # Utilidades de formato y ayuda
├── public/                           # Recursos gráficos y estáticos
├── package.json                      # Dependencias y scripts
└── README.md                         # Documentación del proyecto
```

---

## 🏥 Compromiso Institucional y Confidencialidad

Sanart ha sido concebido bajo el principio de que **cuidar a quienes cuidan es la base de una atención pediátrica de excelencia**. 

Todas las evaluaciones interactivas se procesan con estricta confidencialidad médica y respetan los estándares de protección de datos personales.
## Sitio publicado

[bienestar-insn-san-borja.iba-dea](https://sanart.ai.studio)

Los datos personales del prototipo se almacenan localmente en el navegador del usuario.
