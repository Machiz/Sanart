"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Screen =
  | "welcome"
  | "profile-setup"
  | "schedule-setup"
  | "interests-setup"
  | "assessment"
  | "assessment-done"
  | "home"
  | "need-choice"
  | "recommendation"
  | "activities"
  | "activity-run"
  | "activity-result"
  | "wellbeing"
  | "checkin"
  | "checkin-result"
  | "events"
  | "event-detail"
  | "agenda"
  | "profile"
  | "notifications"
  | "support"
  | "privacy"
  | "admin-login"
  | "admin-dashboard"
  | "admin-trends"
  | "admin-areas"
  | "admin-events"
  | "admin-reports"
  | "admin-settings";

type Activity = {
  name: string;
  duration: number;
  category: string;
  energy: string;
  description: string;
  tone: string;
};

type EventItem = {
  id: number;
  title: string;
  day: string;
  date: string;
  time: string;
  duration: string;
  place: string;
  area: string;
  mode: string;
};

type Reminder = {
  id: number;
  kind: "Descanso" | "Taller";
  title: string;
  schedule: string;
  detail: string;
  enabled: boolean;
};

type UsageStats = {
  activities: number;
  pauses: number;
  events: number;
  checkins: number;
  respiration: number;
  movement: number;
  games: number;
};

const interests = ["Respiración", "Pausas activas", "Juegos cortos", "Relajación", "Música / audio", "Aprendizaje", "Actividades sociales", "Mindfulness"];

const motivationalPhrases = [
  "Hoy no tienes que hacerlo todo: una pausa también es avanzar.",
  "Cuidarte también forma parte de cuidar bien.",
  "Una pausa breve puede abrir espacio para volver con más claridad.",
  "Respirar, bajar el ritmo y continuar también cuenta.",
  "Tu energía merece atención, incluso en los días ocupados.",
  "No todo tiene que resolverse ahora. Puedes empezar por una pausa.",
  "Reconocer cómo estás es una forma de cuidarte.",
];

const activities: Activity[] = [
  { name: "Respiración 4-4", duration: 5, category: "Respiración", energy: "Suave", description: "Una guía breve para soltar tensión y volver al presente.", tone: "mint" },
  { name: "Pausa activa de escritorio", duration: 5, category: "Movimiento", energy: "Media", description: "Cinco movimientos simples que puedes hacer junto a tu puesto.", tone: "blue" },
  { name: "Desconecta", duration: 4, category: "Juegos", energy: "Suave", description: "Cambia el foco de atención con una búsqueda visual breve.", tone: "amber" },
  { name: "Jardín de calma", duration: 10, category: "Juegos", energy: "Muy suave", description: "Haz florecer un jardín sereno, sin prisa ni puntuaciones, para soltar tensión.", tone: "violet" },
  { name: "Reto de atención", duration: 3, category: "Juegos", energy: "Media", description: "Recuerda una secuencia sencilla y dale un descanso a tu mente.", tone: "coral" },
  { name: "Estiramiento express", duration: 2, category: "Movimiento", energy: "Media", description: "Libera hombros, cuello y brazos sin interrumpir tu jornada.", tone: "teal" },
];

const emptyUsageStats: UsageStats = { activities: 0, pauses: 0, events: 0, checkins: 0, respiration: 0, movement: 0, games: 0 };

const disconnectLevels = [
  { target: "◇", shapes: ["○", "△", "◇", "□", "○", "△", "□", "◇", "○", "△", "◇", "□"] },
  { target: "○", shapes: ["□", "○", "△", "◇", "○", "□", "△", "◇", "□", "○", "△", "◇"] },
  { target: "△", shapes: ["◇", "□", "△", "○", "□", "△", "◇", "○", "△", "□", "◇", "○"] },
  { target: "□", shapes: ["△", "◇", "○", "□", "△", "○", "□", "◇", "○", "△", "◇", "□"] },
  { target: "✦", shapes: ["○", "✦", "◇", "△", "□", "○", "△", "✦", "◇", "□", "✦", "○"] },
];

const attentionSequences = [
  ["○", "△", "□"],
  ["□", "○", "◇", "△"],
  ["△", "◇", "○", "□", "△"],
  ["◇", "□", "○", "△", "◇", "○"],
  ["○", "◇", "△", "□", "○", "△", "◇"],
];

const initialEvents: EventItem[] = [
  { id: 1, title: "Pausa activa grupal", day: "Miércoles", date: "19 AGO", time: "12:30", duration: "5 min", place: "Patio central", area: "Todas las áreas", mode: "Presencial" },
  { id: 2, title: "Taller: manejo del estrés", day: "Jueves", date: "20 AGO", time: "13:00", duration: "30 min", place: "Auditorio 2", area: "Personal asistencial", mode: "Presencial" },
  { id: 3, title: "Campaña de bienestar", day: "Viernes", date: "21 AGO", time: "Todo el día", duration: "Jornada", place: "Hall principal", area: "Todas las áreas", mode: "Mixta" },
];

const userNav = [
  ["home", "Inicio", "⌂"],
  ["wellbeing", "Bienestar", "◔"],
  ["activities", "Actividades", "△"],
  ["events", "Eventos", "□"],
  ["profile", "Perfil", "○"],
] as const;

const adminNav = [
  ["admin-dashboard", "Dashboard", "⌂"],
  ["admin-trends", "Bienestar", "◔"],
  ["admin-trends", "Participación", "↗"],
  ["admin-events", "Eventos", "□"],
  ["admin-areas", "Áreas", "◎"],
  ["admin-reports", "Reportes", "▤"],
  ["admin-settings", "Configuración", "⚙"],
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Bienestar INSN San Borja">
      <span className="brand-mark"><i /><i /><i /></span>
      {!compact && <span><strong>Bienestar</strong><small>INSN San Borja</small></span>}
    </div>
  );
}

function Button({ children, secondary = false, ghost = false, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; ghost?: boolean }) {
  return <button className={`btn ${secondary ? "secondary" : ""} ${ghost ? "ghost" : ""} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Stepper({ current, total = 5 }: { current: number; total?: number }) {
  return <div className="stepper" aria-label={`Paso ${current} de ${total}`}>{Array.from({ length: total }, (_, i) => <span key={i} className={i < current ? "active" : ""} />)}</div>;
}

function Scale({ value, onChange, labels = false }: { value: number; onChange: (n: number) => void; labels?: boolean }) {
  return (
    <div>
      <div className="scale" role="group" aria-label="Escala del 1 al 5">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} className={value === n ? "selected" : ""} onClick={() => onChange(n)}>{n}</button>)}
      </div>
      {labels && <div className="scale-labels"><span>Muy baja</span><span>Muy alta</span></div>}
    </div>
  );
}

function MoodSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const moods = [[1, "Muy difícil", "⌢"], [2, "Difícil", "⌣"], [3, "Neutral", "—"], [4, "Bien", "⌒"], [5, "Muy bien", "◡"]] as const;
  return (
    <div className="mood-row" role="group" aria-label="¿Cómo estás hoy?">
      {moods.map(([n, label, face]) => <button key={n} className={value === n ? "selected" : ""} aria-label={label} onClick={() => onChange(n)}><span>{face}</span><small>{label}</small></button>)}
    </div>
  );
}

function ChipRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="chips">{options.map((option) => <button key={option} className={value === option ? "selected" : ""} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  );
}

function AppShell({ screen, go, children }: { screen: Screen; go: (s: Screen) => void; children: ReactNode }) {
  const active = screen === "agenda" ? "events" : screen;
  return (
    <div className="app-shell">
      <aside className="sidebar user-sidebar">
        <Brand />
        <nav>{userNav.map(([id, label, icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => go(id)}><span>{icon}</span>{label}</button>)}</nav>
        <button className="support-link" onClick={() => go("support")}><span>?</span><div><strong>¿Necesitas apoyo?</strong><small>Consulta recursos disponibles</small></div></button>
        <div className="user-mini"><span>MI</span><div><strong>Mi perfil</strong><small>Datos personales</small></div></div>
      </aside>
      <div className="app-body">
        <div className="mobile-top"><Brand /><button aria-label="Notificaciones" onClick={() => go("notifications")}>♢<i /></button></div>
        <main>{children}</main>
        <nav className="bottom-nav">{userNav.map(([id, label, icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => go(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>
      </div>
    </div>
  );
}

function AdminShell({ screen, go, children }: { screen: Screen; go: (s: Screen) => void; children: ReactNode }) {
  return (
    <div className="app-shell admin-shell">
      <aside className="sidebar admin-sidebar">
        <Brand />
        <span className="admin-label">Panel institucional</span>
        <nav>{adminNav.map(([id, label, icon], index) => <button key={`${id}-${index}`} className={screen === id ? "active" : ""} onClick={() => go(id)}><span>{icon}</span>{label}</button>)}</nav>
        <button className="exit-admin" onClick={() => go("home")}>← Volver a la app</button>
        <div className="user-mini"><span>CM</span><div><strong>Carla Mendoza</strong><small>Administradora</small></div></div>
      </aside>
      <div className="app-body"><div className="admin-mobile-top"><Brand /><button onClick={() => go("home")}>Salir</button></div><main>{children}</main></div>
    </div>
  );
}

function OnboardingCard({ step, children }: { step?: number; children: ReactNode }) {
  return <div className="onboarding"><div className="onboarding-top"><Brand />{step && <Stepper current={step} />}</div><div className="onboarding-card">{children}</div><p className="privacy-note">Tus respuestas se usan para personalizar tu experiencia. Este prototipo usa datos ficticios.</p></div>;
}

function MetricRing({ value, label, color = "#2e766e" }: { value: number; label: string; color?: string }) {
  return <div className="metric-ring-wrap"><div className="metric-ring" style={{ "--value": `${value * 3.6}deg`, "--ring": color } as React.CSSProperties}><span><strong>{value}%</strong></span></div><small>{label}</small></div>;
}

function MiniBars({ values, labels, color = "teal" }: { values: number[]; labels?: string[]; color?: string }) {
  return <div className={`mini-bars ${color}`}>{values.map((v, i) => <div key={i}><span style={{ height: `${v}%` }} /><small>{labels?.[i] ?? ["L", "M", "M", "J", "V", "S", "D"][i]}</small></div>)}</div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [history, setHistory] = useState<Screen[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("Hospitalización");
  const [staffType, setStaffType] = useState("Asistencial");
  const [shift, setShift] = useState("Turno mañana");
  const [usualTime, setUsualTime] = useState("5-10 min");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [assessment, setAssessment] = useState([3, 3, 3, 3]);
  const [favoritePastime, setFavoritePastime] = useState("");
  const [customPastime, setCustomPastime] = useState("");
  const [mood, setMood] = useState(0);
  const [selectedTime, setSelectedTime] = useState("5 min");
  const [selectedNeed, setSelectedNeed] = useState("Despejarme");
  const [activity, setActivity] = useState<Activity>(activities[2]);
  const [activityStep, setActivityStep] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [gameLevel, setGameLevel] = useState(1);
  const [attentionLevel, setAttentionLevel] = useState(1);
  const [attentionInput, setAttentionInput] = useState<string[]>([]);
  const [attentionShowing, setAttentionShowing] = useState(true);
  const [calmFound, setCalmFound] = useState<number[]>([]);
  const [breathElapsed, setBreathElapsed] = useState(0);
  const [sessionLogged, setSessionLogged] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackCompleted, setFeedbackCompleted] = useState(false);
  const [checkin, setCheckin] = useState([3, 4, 3]);
  const [usageStats, setUsageStats] = useState<UsageStats>(emptyUsageStats);
  const [activityFilter, setActivityFilter] = useState("Todos");
  const [eventFilter, setEventFilter] = useState("Todos");
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState(initialEvents[0]);
  const [rsvp, setRsvp] = useState<number[]>([]);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [remindersOn, setRemindersOn] = useState(true);
  const [toast, setToast] = useState("");
  const [eventModal, setEventModal] = useState(false);
  const [showMotivation, setShowMotivation] = useState(true);
  const [motivationIndex, setMotivationIndex] = useState(0);
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState<Reminder["kind"]>("Descanso");
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, kind: "Descanso", title: "Pausa de recuperación", schedule: "Hoy · 10:30", detail: "5 min · Lunes a viernes", enabled: true },
    { id: 2, kind: "Taller", title: "Taller: manejo del estrés", schedule: "Jueves · 12:45", detail: "15 min antes · Auditorio 2", enabled: true },
    { id: 3, kind: "Descanso", title: "Pausa de media tarde", schedule: "Hoy · 15:30", detail: "2 min · Solo en turno", enabled: false },
  ]);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem("bienestar-insn-profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.completed) {
          setName(profile.name || "");
          setArea(profile.area || "Hospitalización");
          setStaffType(profile.staffType || "Asistencial");
          setShift(profile.shift || "Turno mañana");
          setUsualTime(profile.usualTime || "5-10 min");
          setSelectedInterests(profile.selectedInterests || []);
          setFavoritePastime(profile.favoritePastime || "");
          setCustomPastime(profile.customPastime || "");
          setSelectedTime(profile.usualTime === "2-5 min" ? "2 min" : profile.usualTime === "10-20 min" ? "10 min" : profile.usualTime === "Más de 20 min" ? "20+ min" : "5 min");
          setScreen("home");
        }
      }
      const savedUsage = window.localStorage.getItem("bienestar-insn-usage");
      if (savedUsage) setUsageStats({ ...emptyUsageStats, ...JSON.parse(savedUsage) });
      setFeedbackCompleted(window.localStorage.getItem("bienestar-insn-feedback-complete") === "true");
    } catch {
      // Si el almacenamiento del navegador no está disponible, la app sigue funcionando en esta sesión.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (screen !== "activity-run" || activity.name !== "Respiración 4-4") return;
    const timer = window.setInterval(() => setBreathElapsed((value) => Math.min(32, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen, activity.name]);

  const go = (next: Screen) => {
    setHistory((items) => [...items.slice(-12), screen]);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    const previous = history.at(-1) ?? "home";
    setHistory((items) => items.slice(0, -1));
    setScreen(previous);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const persistProfile = (timeValue = usualTime) => {
    window.localStorage.setItem("bienestar-insn-profile", JSON.stringify({ completed: true, name: name.trim(), area, staffType, shift, usualTime: timeValue, selectedInterests, favoritePastime, customPastime }));
  };
  const updateUsage = (changes: Partial<UsageStats>) => {
    setUsageStats((current) => {
      const next = { ...current };
      (Object.keys(changes) as (keyof UsageStats)[]).forEach((key) => { next[key] = current[key] + (changes[key] || 0); });
      window.localStorage.setItem("bienestar-insn-usage", JSON.stringify(next));
      return next;
    });
  };
  const completeOnboarding = () => {
    persistProfile();
    setHistory([]);
    setScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const recommendation = useMemo(() => {
    if (selectedNeed === "Moverme") return activities[1];
    if (selectedNeed === "Relajarme") return activities[0];
    if (selectedNeed === "Recuperar energía") return activities[5];
    if (selectedNeed === "Desconectarme" || selectedNeed === "Despejarme") return activities[2];
    return activities[4];
  }, [selectedNeed]);
  const beginActivity = (item: Activity) => {
    setActivity(item);
    setActivityStep(0);
    setFound([]);
    setGameLevel(1);
    setAttentionLevel(1);
    setAttentionInput([]);
    setAttentionShowing(true);
    setCalmFound([]);
    setBreathElapsed(0);
    setSessionLogged(false);
    go("activity-run");
  };
  const finishActivity = () => {
    if (!sessionLogged) {
      const category: keyof UsageStats = activity.category === "Respiración" ? "respiration" : activity.category === "Movimiento" ? "movement" : "games";
      updateUsage({ activities: 1, pauses: 1, [category]: 1 });
      setSessionLogged(true);
    }
    go("activity-result");
  };
  const maxActivityMinutes = usualTime === "2-5 min" ? 5 : usualTime === "5-10 min" ? 10 : usualTime === "10-20 min" ? 20 : usualTime === "Más de 20 min" ? 999 : 10;
  const filteredActivities = activities.filter((item) => item.duration <= maxActivityMinutes && (activityFilter === "Todos" || activityFilter === item.category));
  const energyValue = usageStats.checkins > 0 ? Math.round(checkin[0] * 20) : 0;
  const recoveryValue = usageStats.checkins > 0 ? Math.round((6 - checkin[1]) * 20) : Math.min(100, usageStats.activities * 12);
  const moodValue = mood > 0 ? mood * 20 : usageStats.checkins > 0 ? checkin[2] * 20 : 0;
  const hasUsage = usageStats.activities + usageStats.checkins + usageStats.events > 0;
  const weeklyBars = hasUsage ? [0, 0, 0, 0, 0, Math.min(100, usageStats.activities * 12), Math.max(energyValue, moodValue)] : [0, 0, 0, 0, 0, 0, 0];
  const participationValue = hasUsage ? Math.min(100, (usageStats.activities + usageStats.events + usageStats.checkins) * 5) : 0;
  const adminTrendValues = hasUsage ? [0, 0, 0, 0, 0, 0, 0, 0, Math.max(recoveryValue, moodValue)] : Array(9).fill(0);
  const areaUsage = ["Emergencia", "Hospitalización", "Administración", "Consultorios", "UCI"].map((label) => [label, label === area ? participationValue : 0] as const);
  const nextReminder = reminders.find((item) => item.enabled);
  const createReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || (reminderType === "Descanso" ? "Pausa breve" : "Taller de bienestar"));
    const day = String(data.get("day") || "Hoy");
    const time = String(data.get("time") || "10:30");
    const notice = String(data.get("notice") || "A la hora");
    setReminders((items) => [...items, { id: Date.now(), kind: reminderType, title, schedule: `${day} · ${time}`, detail: reminderType === "Descanso" ? `${notice} · 5 min` : `${notice} · Evento`, enabled: true }]);
    setReminderModal(false);
    showToast("Recordatorio creado y activado");
  };
  const confirmAttendance = () => {
    if (!rsvp.includes(selectedEvent.id)) updateUsage({ events: 1 });
    setRsvp((items) => items.includes(selectedEvent.id) ? items : [...items, selectedEvent.id]);
    setReminders((items) => items.some((reminder) => reminder.title === selectedEvent.title) ? items : [...items, { id: Date.now(), kind: "Taller", title: selectedEvent.title, schedule: `${selectedEvent.day} · ${selectedEvent.time}`, detail: `15 min antes · ${selectedEvent.place}`, enabled: true }]);
    showToast("Asistencia confirmada y recordatorio activado");
  };
  const recordCheckin = () => {
    updateUsage({ checkins: 1 });
    go("checkin-result");
  };
  const finishFirstFeedback = (wouldRepeat: boolean) => {
    window.localStorage.setItem("bienestar-insn-feedback-complete", "true");
    setFeedbackCompleted(true);
    showToast(wouldRepeat ? "Gracias por tu respuesta" : "Buscaremos otras opciones");
  };

  const renderScreen = () => {
    if (!storageReady) return <div className="loading-screen"><Brand /><p>Preparando tu espacio de bienestar…</p></div>;
    if (screen === "welcome") return (
      <div className="welcome-screen">
        <div className="welcome-copy">
          <Brand />
          <span className="eyebrow">Bienestar durante tu jornada</span>
          <h1>Tu bienestar<br />también importa</h1>
          <p>Una herramienta para acompañarte durante tu jornada, ayudarte a aprovechar tus pausas y encontrar recursos de bienestar.</p>
          <div className="welcome-actions"><Button onClick={() => go("profile-setup")}>Comenzar <span>→</span></Button><Button ghost onClick={() => go("home")}>Explorar prototipo</Button></div>
          {showMotivation && <aside className="motivation-widget" aria-label="Frase motivacional para comenzar">
            <div className="motivation-icon" aria-hidden="true">✦</div>
            <div className="motivation-content" aria-live="polite"><span>Una frase para comenzar</span><p>“{motivationalPhrases[motivationIndex]}”</p><button onClick={() => setMotivationIndex((motivationIndex + 1) % motivationalPhrases.length)}>Ver otra frase <i>↻</i></button></div>
            <button className="motivation-close" aria-label="Cerrar frase motivacional" onClick={() => setShowMotivation(false)}>×</button>
          </aside>}
          <button className="admin-entry" onClick={() => go("admin-login")}>Acceso institucional</button>
        </div>
        <div className="welcome-visual" aria-hidden="true">
          <div className="soft-orbit orbit-one" /><div className="soft-orbit orbit-two" />
          <div className="pause-preview"><span className="preview-label">Tu próxima pausa</span><strong>Respira y reinicia</strong><p>5 minutos para volver con más claridad.</p><div className="breath-circle">inhala<br /><small>4 seg</small></div><div className="preview-progress"><i /><i /><i /><i /></div></div>
          <div className="floating-note note-one"><span>◔</span><div><strong>0%</strong><small>Energía esta semana</small></div></div>
          <div className="floating-note note-two"><span>✓</span><div><strong>0 pausas</strong><small>Tiempo para ti</small></div></div>
        </div>
      </div>
    );

    if (screen === "profile-setup") return (
      <OnboardingCard step={1}><span className="eyebrow">Empecemos</span><h1>Cuéntanos un poco sobre ti</h1><p>Solo pedimos lo necesario para adaptar tus recomendaciones.</p>
        <div className="form-grid"><label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pon tu nombre" autoComplete="name" /></label><label>Área<select value={area} onChange={(e) => setArea(e.target.value)}>{["Emergencia", "Hospitalización", "UCI", "Consultorios", "Diagnóstico", "Administración", "Otro"].map((x) => <option key={x}>{x}</option>)}</select></label></div>
        <fieldset><legend>Tipo de personal</legend><div className="choice-cards two">{["Asistencial", "Administrativo"].map((x) => <button key={x} className={staffType === x ? "selected" : ""} onClick={() => setStaffType(x)}><span>{x === "Asistencial" ? "+" : "▤"}</span><strong>Personal {x.toLowerCase()}</strong><small>{x === "Asistencial" ? "Atención clínica y asistencial" : "Gestión y soporte institucional"}</small></button>)}</div></fieldset>
        <div className="form-actions"><Button secondary onClick={back}>Atrás</Button><Button disabled={!name.trim()} onClick={() => go("schedule-setup")}>Continuar →</Button></div>
      </OnboardingCard>
    );

    if (screen === "schedule-setup") return (
      <OnboardingCard step={2}><span className="eyebrow">Tu jornada</span><h1>¿Cómo suele ser tu jornada?</h1><p>Esto nos ayuda a sugerir pausas que sí encajen en tu día.</p>
        <fieldset><legend>Tipo de horario</legend><div className="option-list">{["Turno mañana", "Turno tarde", "Turno noche", "Jornada rotativa", "Horario administrativo"].map((x) => <button key={x} className={shift === x ? "selected" : ""} onClick={() => setShift(x)}>{x}<span>{shift === x ? "●" : "○"}</span></button>)}</div></fieldset>
        <fieldset><legend>¿Cuánto tiempo libre sueles tener durante tu jornada?</legend><ChipRow options={["2-5 min", "5-10 min", "10-20 min", "Más de 20 min", "Es variable"]} value={usualTime} onChange={setUsualTime} /></fieldset>
        <div className="form-actions"><Button secondary onClick={back}>Atrás</Button><Button onClick={() => go("interests-setup")}>Continuar →</Button></div>
      </OnboardingCard>
    );

    if (screen === "interests-setup") return (
      <OnboardingCard step={3}><span className="eyebrow">Tus preferencias</span><h1>¿Qué actividades te interesan?</h1><p>Elige todas las que quieras. Podrás cambiarlas más adelante.</p>
        <div className="interest-grid">{interests.map((x, i) => <button key={x} className={selectedInterests.includes(x) ? "selected" : ""} onClick={() => setSelectedInterests((items) => items.includes(x) ? items.filter((v) => v !== x) : [...items, x])}><span>{["◌", "↟", "◇", "≈", "♫", "▤", "◎", "◉"][i]}</span><strong>{x}</strong><i>{selectedInterests.includes(x) ? "✓" : "+"}</i></button>)}</div>
        <div className="form-actions"><Button secondary onClick={back}>Atrás</Button><Button onClick={() => go("assessment")}>Continuar →</Button></div>
      </OnboardingCard>
    );

    if (screen === "assessment") return (
      <OnboardingCard step={4}><span className="eyebrow">Punto de partida</span><h1>Antes de comenzar, queremos saber cómo te encuentras</h1><p>No hay respuestas correctas. Esta información solo nos ayuda a personalizar la experiencia.</p>
        <div className="question-list">{[
          "¿Cómo sientes tu nivel de energía actualmente?",
          "¿Qué tan agotado/a te has sentido durante los últimos días?",
          "¿Qué tan fácil te resulta desconectarte al terminar tu jornada?",
          "¿Qué tan satisfecho/a estás con tus momentos de descanso?",
        ].map((q, i) => <div className="scale-question" key={q}><strong>{q}</strong><Scale value={assessment[i]} onChange={(n) => setAssessment((items) => items.map((v, ix) => ix === i ? n : v))} labels={i === 0} /></div>)}</div>
        <div className="pastime-question"><div><span className="eyebrow">Pregunta opcional</span><h2>¿Qué disfrutas hacer para recargar fuera del trabajo?</h2><p>Esto nos ayuda a sugerirte actividades que se sientan más cercanas a ti.</p></div><div className="pastime-grid" role="group" aria-label="Actividad favorita en el tiempo libre">{[["Escuchar música", "♫"], ["Caminar o moverme", "↟"], ["Leer o aprender", "▤"], ["Juegos", "◇"], ["Actividades creativas", "✦"], ["Compartir con otras personas", "◎"], ["Descansar en calma", "≈"], ["Otro (escribir)", "+"]].map(([label, icon]) => <button key={label} className={favoritePastime === label ? "selected" : ""} onClick={() => setFavoritePastime(label)}><span>{icon}</span>{label}<i>{favoritePastime === label ? "✓" : ""}</i></button>)}</div>{favoritePastime === "Otro (escribir)" && <label className="pastime-other">Escribe tu hobby o actividad <input value={customPastime} onChange={(event) => setCustomPastime(event.target.value)} placeholder="Ej. cocinar, cuidar plantas, bailar…" /></label>}</div>
        <div className="form-actions"><Button secondary onClick={back}>Atrás</Button><Button onClick={() => go("assessment-done")}>Guardar respuestas →</Button></div>
      </OnboardingCard>
    );

    if (screen === "assessment-done") return (
      <div className="completion-screen"><div className="completion-mark">✓</div><span className="eyebrow">Tu resultado</span><h1>Tu punto de partida está listo</h1><p>Según tus respuestas, te convienen pausas breves, suaves y fáciles de integrar a tu jornada. Empezaremos sin datos inventados y tus indicadores crecerán con el uso.</p><Card className="quiet-card"><span>◌</span><div><strong>Una experiencia a tu ritmo</strong><p>{favoritePastime ? <>Tendremos en cuenta que disfrutas {favoritePastime === "Otro (escribir)" ? (customPastime.trim() || "una actividad personal") : favoritePastime.toLowerCase()} al sugerirte pausas.</> : <>Puedes añadir un hobby más adelante desde tu perfil para afinar tus recomendaciones.</>}</p></div></Card><Button onClick={completeOnboarding}>Ir a inicio →</Button></div>
    );

    if (screen === "home") return (
      <AppShell screen={screen} go={go}>
        <div className="home-topbar"><div><span className="eyebrow">Viernes, 14 de agosto</span><h1>{name.trim() ? `Buenos días, ${name.trim().split(" ")[0]}` : "Buenos días"}</h1><p>¿Cómo estás hoy?</p></div><div className="top-actions"><button onClick={() => go("agenda")} aria-label="Mi agenda">□</button><button onClick={() => go("notifications")} aria-label="Notificaciones">♢<i /></button></div></div>
        <Card className="mood-card"><MoodSelector value={mood} onChange={(n) => { if (mood === 0) updateUsage({ checkins: 1 }); setMood(n); showToast("Tu estado de hoy quedó registrado"); }} /><button className="text-link" onClick={() => go("checkin")}>Hacer check-in completo →</button></Card>
        {remindersOn && nextReminder && <section className="reminder-banner" aria-label="Próximo recordatorio"><span className={`reminder-banner-icon ${nextReminder.kind === "Taller" ? "workshop" : ""}`}>{nextReminder.kind === "Descanso" ? "◷" : "□"}</span><div><small>Próximo recordatorio · {nextReminder.schedule}</small><strong>{nextReminder.title}</strong><p>{nextReminder.kind === "Descanso" ? "Tu pausa estará disponible cuando la necesites." : "Te avisaremos antes para que puedas organizarte."}</p></div><div className="reminder-banner-actions">{nextReminder.kind === "Descanso" && <Button onClick={() => beginActivity(activities[0])}>Iniciar pausa</Button>}<Button secondary onClick={() => showToast("Recordatorio pospuesto 10 minutos")}>Posponer 10 min</Button><button className="text-link" onClick={() => go("notifications")}>Administrar</button></div></section>}
        <div className="home-grid">
          <Card className="home-wellbeing-card"><div className="section-title"><span className="section-icon">◔</span><div><span className="eyebrow">Tu espacio personal</span><h2>Mi bienestar</h2></div></div><p>Los datos empiezan en cero y se actualizan solo cuando usas la app.</p><div className="home-metrics"><div><strong>{energyValue}%</strong><small>Energía</small></div><div><strong>{recoveryValue}%</strong><small>Recuperación</small></div><div><strong>{moodValue}%</strong><small>Ánimo</small></div></div><div className="home-usage"><span>{usageStats.activities} actividades</span><span>{usageStats.checkins} registros</span><span>Pausa habitual: {usualTime}</span></div><Button className="full" onClick={() => go("wellbeing")}>Ver mi bienestar <span>→</span></Button></Card>
          <Card className="recommend-card"><div className="recommend-art"><span className="line-art line-a" /><span className="line-art line-b" /><div className="mini-orb">◌</div><span className="duration-pill">{recommendation.duration} min</span></div><div className="recommend-copy"><span className="eyebrow">Recomendado para ti</span><h2>{recommendation.name === "Desconecta" ? "Respira y reinicia" : recommendation.name}</h2><p>{recommendation.description}</p><div className="activity-meta"><span>{recommendation.category}</span><span>Energía {recommendation.energy.toLowerCase()}</span></div><Button onClick={() => beginActivity(recommendation)}>Comenzar</Button></div></Card>
        </div>
        <div className="section-head"><div><span className="eyebrow">Esta semana</span><h2>Próximos eventos</h2></div><button className="text-link" onClick={() => go("events")}>Ver todos →</button></div>
        <div className="event-strip">{events.map((event) => <button className="event-compact" key={event.id} onClick={() => { setSelectedEvent(event); go("event-detail"); }}><span className="event-date"><strong>{event.date.split(" ")[0]}</strong><small>{event.date.split(" ")[1]}</small></span><div><strong>{event.title}</strong><small>{event.day} · {event.time} · {event.duration}</small></div><i>→</i></button>)}</div>
        <div className="privacy-banner"><span>♢</span><p><strong>Tu bienestar es privado.</strong> Los indicadores institucionales se muestran únicamente de forma agregada.</p><button onClick={() => go("privacy")}>Conocer más</button></div>
      </AppShell>
    );

    if (screen === "need-choice") return (
      <AppShell screen="home" go={go}><div className="focused-page"><button className="back-link" onClick={back}>← Volver</button><span className="focus-time">{selectedTime}</span><span className="eyebrow">Una pausa a tu medida</span><h1>Perfecto. Tienes {selectedTime.replace(" min", " minutos")}.</h1><p>¿Qué necesitas ahora? Elige una opción y encontraremos una actividad compatible con tu momento.</p><div className="need-grid">{["Relajarme", "Despejarme", "Moverme", "Recuperar energía", "Distraerme"].map((item, i) => <button key={item} className={selectedNeed === item ? "selected" : ""} onClick={() => setSelectedNeed(item)}><span>{["≈", "◌", "↟", "✦", "◇"][i]}</span><strong>{item}</strong><small>{["Bajar el ritmo", "Cambiar de foco", "Activar el cuerpo", "Recargar un poco", "Hacer algo ligero"][i]}</small></button>)}</div><Button disabled={!selectedNeed} onClick={() => go("recommendation")}>Ver recomendación →</Button></div></AppShell>
    );

    if (screen === "recommendation") return (
      <AppShell screen="home" go={go}><div className="recommendation-page"><button className="back-link" onClick={back}>← Cambiar necesidad</button><div className="recommend-hero"><div className="recommend-visual"><span className="visual-ring r1" /><span className="visual-ring r2" /><span className="visual-ring r3" /><div>◌</div></div><div><span className="eyebrow">Te recomendamos</span><h1>{recommendation.name}</h1><div className="detail-pills"><span>◷ {recommendation.duration} min</span><span>◇ Mini actividad</span><span>○ {recommendation.category}</span></div><p>{recommendation.description} Está pensada para darte un respiro sin exigirte más.</p><div className="why-box"><span>✦</span><p><strong>¿Por qué esta actividad?</strong> Encaja con el tiempo disponible, tu preferencia por juegos cortos y este momento de la jornada.</p></div><div className="button-row"><Button onClick={() => beginActivity(recommendation)}>Comenzar ahora →</Button><Button secondary onClick={() => { const next = activities.find((a) => a.name !== recommendation.name && a.duration <= 5) ?? activities[0]; setActivity(next); showToast(`Otra opción: ${next.name}`); }}>Ver otra opción</Button></div></div></div></div></AppShell>
    );

    if (screen === "activities") return (
      <AppShell screen={screen} go={go}><PageHeader eyebrow="Explora a tu ritmo" title="Actividades" description="Pausas breves para distintos momentos de tu jornada." action={<Button secondary onClick={() => go("need-choice")}>Ayúdame a elegir</Button>} />
        <div className="filter-block"><div className="availability-filter-note"><span>◷</span><p><strong>Actividades para tu disponibilidad: {usualTime}</strong><small>Usamos la respuesta guardada en tu perfil.</small></p><button className="text-link" onClick={() => go("profile")}>Cambiar</button></div><div className="filter-row"><strong>Categoría</strong><ChipRow options={["Todos", "Movimiento", "Juegos", "Respiración"]} value={activityFilter} onChange={setActivityFilter} /></div></div>
        <div className="activity-grid">{filteredActivities.map((item) => <Card className="activity-card" key={item.name}><div className={`activity-art ${item.tone}`}><span>{item.category === "Movimiento" ? "↟" : item.category === "Juegos" ? "◇" : item.category === "Respiración" ? "◌" : "≈"}</span><i>{item.duration} min</i></div><span className="category-label">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><div className="energy"><span>Nivel de energía</span><strong>{item.energy}</strong></div><Button onClick={() => beginActivity(item)}>Comenzar →</Button></Card>)}</div>
      </AppShell>
    );

    if (screen === "activity-run") {
      const activeSteps = activity.name === "Estiramiento express"
        ? ["Suelta el cuello", "Abre los hombros", "Estira los brazos", "Vuelve al centro"]
        : ["Mueve los hombros", "Estira los brazos", "Respira profundamente", "Levántate y camina", "Regresa lentamente"];
      const activeInstructions = activity.name === "Estiramiento express"
        ? ["Inclina la cabeza suavemente hacia cada lado.", "Lleva los hombros atrás y abre el pecho sin forzar.", "Eleva un brazo, luego el otro, respirando con calma.", "Baja los brazos y nota cómo se siente tu postura."]
        : ["Rota suavemente hacia atrás, sin forzar.", "Lleva ambos brazos al frente y luego arriba.", "Inhala por la nariz y exhala lentamente.", "Si es posible, da unos pasos tranquilos.", "Vuelve a tu postura y nota cómo te sientes."];
      const isMovement = activity.category === "Movimiento";
      const disconnect = disconnectLevels[gameLevel - 1];
      const attentionSequence = attentionSequences[attentionLevel - 1];
      const breathPhase = breathElapsed >= 32 ? "Completado" : breathElapsed % 8 < 4 ? "Inhala" : "Exhala";
      const breathSeconds = breathElapsed >= 32 ? 0 : 4 - (breathElapsed % 4);
      const breathProgress = Math.min(100, (breathElapsed / 32) * 100);
      const pickAttentionShape = (shape: string) => {
        const expected = attentionSequence[attentionInput.length];
        if (shape !== expected) {
          setAttentionInput([]);
          setAttentionShowing(true);
          showToast("La secuencia fue distinta. Obsérvala otra vez con calma.");
          return;
        }
        const next = [...attentionInput, shape];
        setAttentionInput(next);
        if (next.length === attentionSequence.length) {
          if (attentionLevel === attentionSequences.length) window.setTimeout(finishActivity, 450);
          else {
            setAttentionLevel((level) => level + 1);
            setAttentionInput([]);
            setAttentionShowing(true);
            showToast("¡Bien! Pasas al siguiente nivel.");
          }
        }
      };
      return <AppShell screen="activities" go={go}><div className="activity-experience"><div className="activity-run-top"><button className="back-link" onClick={() => go("activities")}>× Salir</button><span>{activity.name}</span><small>◷ {activity.duration}:00</small></div>
        {activity.name === "Desconecta" ? <div className="game-panel"><span className="eyebrow">Nivel {gameLevel} de {disconnectLevels.length}</span><h1>Desconecta</h1><p>Encuentra los tres símbolos <strong>{disconnect.target}</strong>. Sin prisa y sin puntuación.</p><div className="game-status"><span>Encontrados <strong>{found.length}/3</strong></span><span>Progreso <strong>{Math.round(((gameLevel - 1) + found.length / 3) * 20)}%</strong></span></div><div className="find-grid">{disconnect.shapes.map((shape, i) => <button key={`${gameLevel}-${i}`} className={found.includes(i) ? "found" : ""} onClick={() => { if (shape !== disconnect.target) { showToast("Prueba con el símbolo indicado arriba."); return; } if (!found.includes(i)) { const next = [...found, i]; setFound(next); if (next.length === 3) { if (gameLevel === disconnectLevels.length) window.setTimeout(finishActivity, 450); else window.setTimeout(() => { setGameLevel((level) => level + 1); setFound([]); }, 450); } } }}>{found.includes(i) ? "✓" : shape}</button>)}</div><div className="level-progress"><i style={{ width: `${((gameLevel - 1) + found.length / 3) * 20}%` }} /></div><small className="gentle-note">Cinco niveles breves para cambiar de foco.</small></div>
        : activity.name === "Reto de atención" ? <div className="game-panel attention-panel"><span className="eyebrow">Reto de memoria · nivel {attentionLevel} de {attentionSequences.length}</span><h1>Reto de atención</h1><p>Memoriza la secuencia y luego tócala en el mismo orden.</p>{attentionShowing ? <><div className="sequence-display" aria-label="Secuencia a memorizar">{attentionSequence.map((shape, index) => <span key={`${shape}-${index}`}>{shape}</span>)}</div><Button onClick={() => { setAttentionShowing(false); setAttentionInput([]); }}>Ya la memoricé</Button></> : <><div className="sequence-answer" aria-live="polite">{attentionSequence.map((_, index) => <span key={index}>{attentionInput[index] || "·"}</span>)}</div><div className="attention-pad">{["○", "△", "□", "◇"].map((shape) => <button key={shape} onClick={() => pickAttentionShape(shape)}>{shape}</button>)}</div><button className="text-link" onClick={() => { setAttentionInput([]); setAttentionShowing(true); }}>Ver secuencia otra vez</button></>}<small className="gentle-note">No hay tiempo límite. Si te equivocas, simplemente vuelves a mirar.</small></div>
        : activity.name === "Jardín de calma" ? <div className="game-panel calm-panel"><span className="eyebrow">Mini jardín sin prisa</span><h1>Jardín de calma</h1><p>Toca cada piedra para convertirla en una flor. Respira con naturalidad y observa cómo aparece el jardín.</p><div className="calm-garden">{["≈", "○", "◇", "≈", "○", "◇"].map((shape, index) => <button key={index} className={calmFound.includes(index) ? "bloomed" : ""} aria-label={calmFound.includes(index) ? `Flor ${index + 1}` : `Hacer florecer piedra ${index + 1}`} onClick={() => { if (calmFound.includes(index)) return; const next = [...calmFound, index]; setCalmFound(next); if (next.length === 6) window.setTimeout(finishActivity, 650); }}><span>{calmFound.includes(index) ? "✿" : shape}</span></button>)}</div><div className="level-progress"><i style={{ width: `${(calmFound.length / 6) * 100}%` }} /></div><small className="gentle-note">{calmFound.length}/6 flores · Sin puntaje ni errores.</small></div>
        : isMovement ? <div className="guided-panel"><span className="eyebrow">{activity.name} · paso {activityStep + 1} de {activeSteps.length}</span><h1>{activeSteps[activityStep]}</h1><div className="movement-visual"><div className={`move-figure step-${activityStep}`}><i className="head" /><i className="body" /><i className="arm left" /><i className="arm right" /></div><span className="motion-line m1" /><span className="motion-line m2" /></div><p>{activeInstructions[activityStep]}</p><div className="guided-progress"><div><i style={{ width: `${((activityStep + 1) / activeSteps.length) * 100}%` }} /></div><span>{activityStep + 1} / {activeSteps.length}</span></div><div className="guided-actions"><Button secondary disabled={activityStep === 0} onClick={() => setActivityStep((step) => Math.max(0, step - 1))}>← Movimiento anterior</Button><Button onClick={() => activityStep === activeSteps.length - 1 ? finishActivity() : setActivityStep((step) => step + 1)}>{activityStep === activeSteps.length - 1 ? "Finalizar pausa" : "Siguiente movimiento →"}</Button></div></div>
        : <div className="breathing-panel"><span className="eyebrow">Respiración guiada · ciclo {Math.min(4, Math.floor(breathElapsed / 8) + 1)} de 4</span><h1>{activity.name}</h1><p>Sigue el ritmo del círculo. Respira sin esfuerzo.</p><div key={`${Math.floor(breathElapsed / 4)}-${breathPhase}`} className={`breathing-orb ${breathPhase === "Inhala" ? "inhale" : breathPhase === "Exhala" ? "exhale" : "complete"}`}><span>{breathPhase}</span><strong>{breathSeconds}</strong><small>{breathPhase === "Completado" ? "Pausa terminada" : "segundos"}</small></div><div className="breathing-progress"><div><i style={{ width: `${breathProgress}%` }} /></div><span>{Math.round(breathProgress)}%</span></div><Button disabled={breathElapsed < 32} onClick={finishActivity}>{breathElapsed < 32 ? "Sigue el ritmo…" : "Completar pausa"}</Button></div>}
      </div></AppShell>;
    }

    if (screen === "activity-result") return (
      <AppShell screen="activities" go={go}><div className="result-page"><div className="completion-mark">✓</div><span className="eyebrow">Actividad completada</span><h1>Tomaste unos minutos para ti</h1><p>Hiciste una pausa breve para cambiar de foco y recuperar un poco de espacio.</p><div className="pause-registered"><span>◷</span><div><strong>Pausa registrada</strong><small>{activity.name} · {activity.duration} min</small></div></div>{!feedbackCompleted ? <Card className="feedback-card"><span className="eyebrow">Solo te lo preguntaremos esta primera vez</span><h2>¿Cómo te ayudó esta pausa?</h2><div className="feedback-options">{["Mucho", "Un poco", "Nada"].map((x) => <button className={feedback === x ? "selected" : ""} key={x} onClick={() => setFeedback(x)}><span>{x === "Mucho" ? "◡" : x === "Un poco" ? "—" : "⌢"}</span>{x}</button>)}</div><h3>¿La volverías a hacer?</h3><div className="button-row compact"><Button secondary disabled={!feedback} onClick={() => finishFirstFeedback(true)}>Sí</Button><Button secondary disabled={!feedback} onClick={() => finishFirstFeedback(false)}>No</Button></div></Card> : <div className="feedback-saved"><span>✓</span><p><strong>Tu pausa quedó guardada.</strong> La encuesta inicial ya fue respondida y no volverá a interrumpirte.</p></div>}<div className="button-row"><Button onClick={() => go("home")}>Volver al inicio</Button><Button ghost onClick={() => go("activities")}>Explorar actividades</Button></div></div></AppShell>
    );

    if (screen === "wellbeing") return (
      <AppShell screen={screen} go={go}><PageHeader eyebrow="Tu espacio personal" title="Mi bienestar" description="Una mirada privada a tus registros y momentos de recuperación." action={<Button onClick={() => go("checkin")}>Hacer check-in</Button>} />
        <div className="wellbeing-summary"><Card className="metric-card wide"><div className="card-head"><div><span className="eyebrow">Esta semana</span><h2>Tu resumen</h2></div><span className="live-data-badge">Datos de tu uso</span></div><div className="rings"><MetricRing value={energyValue} label="Energía" /><MetricRing value={recoveryValue} label="Recuperación" color="#547da0" /><MetricRing value={moodValue} label="Estado de ánimo" color="#b9785d" /></div></Card><Card className="trend-card"><span className={hasUsage ? "trend-up" : "trend-flat"}>{hasUsage ? "↗" : "○"}</span><span className="eyebrow">Tendencia reciente</span><h2>{hasUsage ? "Tu resumen ya empezó a tomar forma" : "Aún no hay actividad registrada"}</h2><p>{hasUsage ? "Cada pausa y check-in actualiza esta vista con tus propios datos." : "Completa una actividad o un check-in para comenzar. Todos los indicadores parten de cero."}</p></Card></div>
        <div className="wellbeing-grid"><Card className="chart-card"><div className="card-head"><div><span className="eyebrow">Últimos 7 días</span><h2>Energía y recuperación</h2></div><select aria-label="Periodo"><option>Esta semana</option></select></div><MiniBars values={weeklyBars} /><div className="chart-legend"><span><i className="teal-dot" />Registros propios</span></div></Card><Card><span className="eyebrow">Tu participación</span><h2>{usageStats.activities} actividades</h2><div className="participation-list"><div><span>Respiración</span><i><b style={{ width: `${usageStats.activities ? (usageStats.respiration / usageStats.activities) * 100 : 0}%` }} /></i><strong>{usageStats.respiration}</strong></div><div><span>Movimiento</span><i><b style={{ width: `${usageStats.activities ? (usageStats.movement / usageStats.activities) * 100 : 0}%` }} /></i><strong>{usageStats.movement}</strong></div><div><span>Juegos</span><i><b style={{ width: `${usageStats.activities ? (usageStats.games / usageStats.activities) * 100 : 0}%` }} /></i><strong>{usageStats.games}</strong></div></div><button className="text-link" onClick={() => go("activities")}>Explorar actividades →</button></Card></div>
        <Card className="support-callout"><span>♡</span><div><h3>Si necesitas apoyo adicional</h3><p>Puedes consultar los canales y recursos disponibles en el INSN. Pedir apoyo también es parte del bienestar.</p></div><Button secondary onClick={() => go("support")}>Ver recursos de apoyo</Button></Card>
      </AppShell>
    );

    if (screen === "checkin") return (
      <AppShell screen="wellbeing" go={go}><div className="checkin-page"><button className="back-link" onClick={back}>← Volver</button><span className="eyebrow">Check-in diario · 1 minuto</span><h1>¿Cómo estás hoy?</h1><p>Responde según cómo te sientes ahora. No hay respuestas correctas.</p><Card>{["¿Cómo está tu energía?", "¿Qué tan agotado/a te sientes?", "¿Cómo está tu ánimo?"].map((q, i) => <div className="checkin-question" key={q}><div><span>{["✦", "≈", "◡"][i]}</span><strong>{q}</strong></div><Scale value={checkin[i]} onChange={(n) => setCheckin((items) => items.map((v, ix) => ix === i ? n : v))} /></div>)}</Card><Button onClick={recordCheckin}>Guardar check-in →</Button><small>Tus registros personales son privados.</small></div></AppShell>
    );

    if (screen === "checkin-result") return (
      <AppShell screen="wellbeing" go={go}><div className="result-page checkin-complete"><div className="completion-mark">✓</div><span className="eyebrow">Gracias por registrarlo</span><h1>Hoy parece que necesitas una pausa de recuperación</h1><p>Una actividad breve y suave podría ayudarte a continuar tu jornada con un poco más de espacio.</p><Card className="recommend-inline"><div className="activity-art mint"><span>◌</span><i>5 min</i></div><div><span className="eyebrow">Recomendación para hoy</span><h2>Respiración 4-4</h2><p>Una guía breve para soltar tensión y volver al presente.</p><Button onClick={() => beginActivity(activities[0])}>Comenzar ahora</Button></div></Card><div className="notice-soft"><span>i</span><p><strong>Recuerda:</strong> estas recomendaciones acompañan tu bienestar y no constituyen un diagnóstico.</p></div><Button ghost onClick={() => go("wellbeing")}>Volver a mi bienestar</Button></div></AppShell>
    );

    if (screen === "events") return (
      <AppShell screen={screen} go={go}><PageHeader eyebrow="Conecta y participa" title="Eventos" description="Actividades de bienestar para compartir durante la jornada." action={<Button secondary onClick={() => go("agenda")}>□ Mi agenda</Button>} /><ChipRow options={["Todos", "Hoy", "Esta semana", "Mi área"]} value={eventFilter} onChange={setEventFilter} />
        <div className="featured-event"><div><span className="eyebrow">Evento destacado</span><h2>Semana del bienestar</h2><p>Una jornada con pausas activas, espacios de orientación y actividades para toda la comunidad INSN.</p><div className="detail-pills"><span>21 AGO</span><span>Todo el día</span><span>Hall principal</span></div><Button onClick={() => { setSelectedEvent(events[2]); go("event-detail"); }}>Ver detalles →</Button></div><div className="featured-shapes"><i /><i /><i /></div></div>
        <div className="event-list">{events.map((event) => <Card className="event-card" key={event.id}><span className="event-date large"><strong>{event.date.split(" ")[0]}</strong><small>{event.date.split(" ")[1]}</small></span><div className="event-main"><span className="category-label">{event.area}</span><h3>{event.title}</h3><p>{event.day} · {event.time} · {event.duration}</p><small>{event.place} · {event.mode}</small></div><div className="event-actions"><Button secondary onClick={() => { setSelectedEvent(event); go("event-detail"); }}>Ver detalles</Button><Button ghost onClick={() => { if (!rsvp.includes(event.id)) updateUsage({ events: 1 }); setRsvp((items) => items.includes(event.id) ? items : [...items, event.id]); showToast("Evento agregado a tu agenda"); }}>{rsvp.includes(event.id) ? "✓ Me interesa" : "Me interesa"}</Button></div></Card>)}</div>
      </AppShell>
    );

    if (screen === "event-detail") return (
      <AppShell screen="events" go={go}><div className="event-detail-page"><button className="back-link" onClick={back}>← Volver a eventos</button><div className="event-detail-hero"><span className="event-date xlarge"><strong>{selectedEvent.date.split(" ")[0]}</strong><small>{selectedEvent.date.split(" ")[1]}</small></span><div><span className="eyebrow">{selectedEvent.area}</span><h1>{selectedEvent.title}</h1><p>Un espacio práctico para hacer una pausa, compartir herramientas sencillas y cuidar el bienestar durante la jornada.</p></div></div><div className="event-detail-grid"><Card><h2>Detalles del evento</h2><dl><div><dt>Fecha</dt><dd>{selectedEvent.day}, {selectedEvent.date.toLowerCase()}</dd></div><div><dt>Hora</dt><dd>{selectedEvent.time}</dd></div><div><dt>Duración</dt><dd>{selectedEvent.duration}</dd></div><div><dt>Lugar</dt><dd>{selectedEvent.place}</dd></div><div><dt>Modalidad</dt><dd>{selectedEvent.mode}</dd></div></dl></Card><Card className="rsvp-card"><span>◎</span><h2>¿Te interesa participar?</h2><p>Confirma tu interés y activaremos un recordatorio 15 minutos antes.</p><Button onClick={confirmAttendance}>{rsvp.includes(selectedEvent.id) ? "✓ Asistencia y aviso confirmados" : "Confirmar y recordarme"}</Button><Button secondary onClick={() => showToast("Evento agregado al calendario")}>Agregar al calendario</Button></Card></div></div></AppShell>
    );

    if (screen === "agenda") return (
      <AppShell screen="events" go={go}><PageHeader eyebrow="Tu jornada" title="Mi agenda" description="Organiza pausas y eventos alrededor de tu horario." action={<Button secondary onClick={() => showToast("Momento de pausa agregado")}>+ Agregar momento</Button>} /><div className="agenda-layout"><Card className="agenda-card"><div className="card-head"><h2>Viernes, 14 de agosto</h2><span className="fiction-badge">Turno mañana</span></div><div className="timeline">{[["08:00", "Inicio de jornada", "shift"], ["10:30", "Pausa recomendada", "pause"], ["13:00", "Taller de bienestar", "event"], ["15:30", "Check-in", "checkin"]].map(([time, title, kind]) => <div key={time} className={kind}><time>{time}</time><i /><div><strong>{title}</strong><small>{kind === "pause" ? "5 min · Respiración o movimiento" : kind === "event" ? "Auditorio 2 · 30 min" : kind === "checkin" ? "1 min · Registro personal" : "Hospitalización"}</small></div>{kind !== "shift" && <button onClick={() => showToast("Horario actualizado")}>···</button>}</div>)}</div></Card><Card className="availability-card"><span className="eyebrow">Personaliza tu agenda</span><h2>¿Cuándo puedes hacer una pausa?</h2><p>Marca momentos habituales. Las recomendaciones se adaptarán sin saturarte.</p>{["Antes de iniciar", "Media mañana", "Después del almuerzo", "Antes de terminar"].map((x, i) => <label className="check-row" key={x}><input type="checkbox" defaultChecked={i === 1 || i === 2} /><span>{x}</span><small>{["07:45", "10:30", "14:00", "17:30"][i]}</small></label>)}<Button className="full" onClick={() => showToast("Disponibilidad guardada")}>Guardar disponibilidad</Button></Card></div></AppShell>
    );

    if (screen === "profile") return (
      <AppShell screen={screen} go={go}><PageHeader eyebrow="Tu cuenta" title="Perfil y preferencias" description="Ajusta la experiencia a tu jornada." /><div className="profile-layout"><Card className="profile-card"><div className="profile-avatar">{name.trim() ? name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "TU"}</div><h2>{name.trim() || "Tu perfil"}</h2><p>{staffType} · {area}</p><div className="profile-facts"><div><small>Horario</small><strong>{shift}</strong></div><div><small>Pausa habitual</small><strong>{usualTime}</strong></div></div><Button secondary className="full" onClick={() => go("profile-setup")}>Editar información</Button></Card><div className="settings-stack"><Card><h2>Tiempo libre habitual</h2><p>Esta es la respuesta guardada. Solo cambia si tú la actualizas.</p><ChipRow options={["2-5 min", "5-10 min", "10-20 min", "Más de 20 min", "Es variable"]} value={usualTime} onChange={setUsualTime} /><Button onClick={() => { persistProfile(usualTime); setSelectedTime(usualTime === "2-5 min" ? "2 min" : usualTime === "10-20 min" ? "10 min" : usualTime === "Más de 20 min" ? "20+ min" : "5 min"); showToast("Disponibilidad actualizada"); }}>Guardar cambio</Button></Card><Card><h2>Preferencias de actividades</h2><div className="chips preferences">{interests.map((x) => <button key={x} className={selectedInterests.includes(x) ? "selected" : ""} onClick={() => setSelectedInterests((items) => items.includes(x) ? items.filter((v) => v !== x) : [...items, x])}>{selectedInterests.includes(x) ? "✓ " : "+ "}{x}</button>)}</div></Card><Card className="settings-list"><button onClick={() => go("notifications")}><span>♢</span><div><strong>Notificaciones y recordatorios</strong><small>Configura cuándo recibir avisos</small></div><i>→</i></button><button onClick={() => go("privacy")}><span>♢</span><div><strong>Privacidad y mis datos</strong><small>Conoce cómo se usa tu información</small></div><i>→</i></button><button onClick={() => go("support")}><span>?</span><div><strong>Recursos de apoyo</strong><small>Canales institucionales disponibles</small></div><i>→</i></button></Card><button className="admin-switch" onClick={() => go("admin-login")}>Acceder al panel institucional →</button></div></div></AppShell>
    );

    if (screen === "notifications") return (
      <AppShell screen="profile" go={go}><PageHeader eyebrow="A tu ritmo" title="Recordatorios" description="Organiza avisos útiles para talleres y descansos, sin saturar tu jornada." action={<Button onClick={() => setReminderModal(true)}>+ Nuevo recordatorio</Button>} />
        <div className="reminder-overview"><Card><span className="reminder-overview-icon">◷</span><div><small>Próximo descanso</small><strong>{reminders.find((item) => item.kind === "Descanso" && item.enabled)?.schedule ?? "Sin programar"}</strong><p>{reminders.find((item) => item.kind === "Descanso" && item.enabled)?.title ?? "Puedes crear uno cuando quieras"}</p></div></Card><Card><span className="reminder-overview-icon workshop">□</span><div><small>Próximo taller</small><strong>{reminders.find((item) => item.kind === "Taller" && item.enabled)?.schedule ?? "Sin programar"}</strong><p>{reminders.find((item) => item.kind === "Taller" && item.enabled)?.title ?? "No hay talleres con aviso"}</p></div></Card></div>
        <div className="reminder-layout"><Card className="reminder-schedule"><div className="card-head"><div><span className="eyebrow">Tu programación</span><h2>Recordatorios activos</h2></div><span className="fiction-badge">{reminders.filter((item) => item.enabled).length} activos</span></div><div className="reminder-list">{reminders.map((reminder) => <div className={`reminder-item ${!reminder.enabled ? "disabled" : ""}`} key={reminder.id}><span className={`reminder-kind ${reminder.kind === "Taller" ? "workshop" : ""}`}>{reminder.kind === "Descanso" ? "◷" : "□"}</span><div><span>{reminder.kind}</span><strong>{reminder.title}</strong><small>{reminder.schedule} · {reminder.detail}</small></div><label className="mini-switch" aria-label={`${reminder.enabled ? "Desactivar" : "Activar"} ${reminder.title}`}><input type="checkbox" checked={reminder.enabled} onChange={() => setReminders((items) => items.map((item) => item.id === reminder.id ? { ...item, enabled: !item.enabled } : item))} /><i /></label><button className="reminder-delete" aria-label={`Eliminar ${reminder.title}`} onClick={() => { setReminders((items) => items.filter((item) => item.id !== reminder.id)); showToast("Recordatorio eliminado"); }}>×</button></div>)}</div>{reminders.length === 0 && <div className="reminder-empty"><span>◷</span><h3>Aún no tienes recordatorios</h3><p>Crea uno para una pausa o un taller.</p></div>}<Button secondary onClick={() => setReminderModal(true)}>+ Agregar recordatorio</Button></Card>
          <Card className="reminder-preferences"><h2>Preferencias</h2><label className="toggle-row"><div><strong>Notificaciones</strong><small>Avisos generales de bienestar</small></div><input type="checkbox" checked={notificationsOn} onChange={() => setNotificationsOn(!notificationsOn)} /></label><label className="toggle-row"><div><strong>Recordatorios de descanso</strong><small>Máximo dos durante tu jornada</small></div><input type="checkbox" checked={remindersOn} onChange={() => setRemindersOn(!remindersOn)} /></label><label className="toggle-row"><div><strong>Talleres confirmados</strong><small>Aviso automático 15 min antes</small></div><input type="checkbox" defaultChecked /></label><div className="quiet-hours"><strong>Horario silencioso</strong><p>Fuera de tu jornada no enviaremos recordatorios.</p><span>18:00 — 07:30</span></div><p className="reminder-principle">Puedes posponer o desactivar cualquier aviso. No se enviarán más de dos recordatorios de descanso por jornada.</p></Card></div>
        <Card className="notification-history"><div className="card-head"><div><span className="eyebrow">Historial reciente</span><h2>Últimos avisos</h2></div></div><div className="notification-feed">{["Tu pausa de 5 minutos está disponible.", "Taller de manejo del estrés en 15 minutos.", "Pausa pospuesta para las 15:40."].map((text, index) => <div className="notification-example" key={text}><span>{index === 1 ? "□" : "◷"}</span><div><strong>Bienestar INSN</strong><p>{text}</p><small>{["Hoy, 10:30", "Ayer, 12:45", "Miércoles, 15:30"][index]}</small></div></div>)}</div></Card>
      </AppShell>
    );

    if (screen === "support") return (
      <AppShell screen="profile" go={go}><PageHeader eyebrow="Estamos para acompañarte" title="¿Necesitas apoyo?" description="Encuentra recursos y canales disponibles dentro de la institución." /><div className="support-intro"><span>♡</span><div><h2>Pedir apoyo también es cuidarte</h2><p>Si sientes que necesitas conversar con alguien o conocer opciones de orientación, revisa estos recursos. La plataforma no reemplaza la atención profesional.</p></div></div><div className="support-grid">{[["Orientación psicológica", "[Servicio de apoyo psicológico]", "♡"], ["Recursos institucionales", "[Canal institucional]", "▤"], ["Contactos de ayuda", "[Contacto de bienestar]", "◎"], ["Material educativo", "Guías breves y recursos de autocuidado", "□"], ["Preguntas frecuentes", "Respuestas sobre privacidad y uso de la plataforma", "?"], ["Situaciones urgentes", "Consulta los canales oficiales de emergencia del INSN", "!"]].map(([title, text, icon]) => <Card className="support-resource" key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p><Button secondary onClick={() => showToast("Recurso de demostración")}>Ver recurso →</Button></Card>)}</div><div className="placeholder-note">Este prototipo no inventa teléfonos, correos ni nombres de servicios. Los contactos deberán validarse con el INSN antes de una implementación real.</div></AppShell>
    );

    if (screen === "privacy") return (
      <AppShell screen="profile" go={go}><div className="privacy-page"><div className="privacy-hero"><span>♢</span><div><span className="eyebrow">Privacidad clara</span><h1>Tu bienestar es privado</h1><p>Queremos que sepas, en lenguaje simple, cómo se presenta y protege tu información.</p></div></div><div className="privacy-principles">{[["Tus registros son tuyos", "Puedes revisar tus propios check-ins, actividades y preferencias."], ["La institución ve tendencias", "Los indicadores institucionales se muestran de forma agregada, sin nombres ni perfiles individuales."], ["No realizamos diagnósticos", "La plataforma acompaña el bienestar. No determina condiciones médicas o psicológicas."], ["Un uso con propósito", "Los datos deben servir para promover bienestar y comprender tendencias organizacionales."]].map(([title, text], i) => <Card key={title}><span>{`0${i + 1}`}</span><h2>{title}</h2><p>{text}</p></Card>)}</div><Card className="privacy-example"><div><span className="eyebrow">Ejemplo</span><h2>Lo que ve la institución</h2><p>“El 72% de las personas del área participó en actividades esta semana”.</p></div><div><span className="eyebrow">Lo que no ve</span><h2>Información individual</h2><p>No se muestran respuestas, estados de ánimo ni rankings por trabajador.</p></div></Card><Button secondary onClick={back}>← Volver</Button></div></AppShell>
    );

    if (screen === "admin-login") return (
      <div className="admin-login"><div className="login-brand"><Brand /><button onClick={() => go("welcome")}>← Volver</button></div><div className="login-panel"><span className="admin-symbol">▦</span><span className="eyebrow">Acceso institucional</span><h1>Panel de bienestar</h1><p>Consulta tendencias agregadas, participación y eventos. Prototipo con datos ficticios.</p><label>Correo institucional<input defaultValue="admin@insn-demo.pe" /></label><label>Contraseña<input type="password" defaultValue="demostracion" /></label><Button className="full" onClick={() => go("admin-dashboard")}>Ingresar al panel →</Button><div className="aggregate-note"><span>♢</span><p>Este panel no muestra información individual de trabajadores.</p></div></div><div className="login-side"><blockquote>“Decisiones informadas para cuidar a quienes cuidan.”</blockquote><small>Bienestar INSN · Entorno de demostración</small></div></div>
    );

    if (screen === "admin-dashboard") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Viernes, 14 de agosto" title="Resumen de bienestar" description="Indicadores agregados generados por el uso de esta versión" action={<div className="admin-header-actions"><select><option>Últimos 30 días</option></select><button aria-label="Notificaciones">♢</button></div>} /><div className="metric-grid">{[["Participación", `${participationValue}%`, "Actual", "◎"], ["Actividades realizadas", String(usageStats.activities), "Actual", "△"], ["Pausas registradas", String(usageStats.pauses), "Actual", "◷"], ["Eventos", String(usageStats.events), "Actual", "□"]].map(([label, value, change, icon]) => <Card className="admin-metric" key={label}><div><span>{label}</span><strong>{value}</strong><small>{change} <i>en este dispositivo</i></small></div><b>{icon}</b></Card>)}</div>
        <div className="admin-chart-grid"><Card className="line-chart-card"><div className="card-head"><div><span className="eyebrow">Últimos 30 días</span><h2>Tendencia de bienestar</h2></div><div className="chart-legend"><span><i className="teal-dot" />Bienestar</span><span><i className="blue-dot" />Recuperación</span></div></div><div className="line-chart"><div className="grid-lines"><i /><i /><i /><i /></div><div className="trend-columns">{adminTrendValues.map((v, i) => <span key={i} style={{ height: `${v}%` }}><i /></span>)}</div><div className="axis"><span>15 jul</span><span>22 jul</span><span>29 jul</span><span>5 ago</span><span>14 ago</span></div></div></Card><Card><div className="card-head"><div><span className="eyebrow">Cobertura</span><h2>Participación por área</h2></div><button className="text-link" onClick={() => go("admin-areas")}>Ver áreas</button></div><div className="area-bars">{areaUsage.map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></div>)}</div></Card></div>
        <div className="admin-lower"><Card><div className="card-head"><h2>Señales recientes</h2><button className="text-link" onClick={() => go("admin-trends")}>Ver tendencias →</button></div>{hasUsage ? <div className="insight-list"><div className="positive"><span>↗</span><p><strong>Actividad registrada</strong>Los indicadores ya reflejan interacciones realizadas en esta versión.</p></div><div className="neutral"><span>◎</span><p><strong>Participación actual</strong>{usageStats.activities} actividades y {usageStats.checkins} registros personales.</p></div></div> : <div className="empty-data"><span>○</span><strong>Sin datos todavía</strong><p>Las señales aparecerán cuando se registren actividades, eventos o check-ins.</p></div>}</Card><Card><div className="card-head"><h2>Próximos eventos</h2><button className="text-link" onClick={() => go("admin-events")}>Gestionar →</button></div>{events.slice(0, 3).map((e) => <div className="admin-event-mini" key={e.id}><span className="event-date"><strong>{e.date.split(" ")[0]}</strong><small>{e.date.split(" ")[1]}</small></span><div><strong>{e.title}</strong><small>{e.time} · {e.duration}</small></div></div>)}</Card></div>
        <div className="aggregate-banner"><span>♢</span><p><strong>Privacidad por diseño.</strong> Los datos se presentan de forma agregada para proteger la privacidad de los trabajadores.</p></div>
      </AdminShell>
    );

    if (screen === "admin-trends") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Datos agregados" title="Tendencias" description="Variación de indicadores de bienestar sin exponer información individual." action={<select className="period-select"><option>Últimos 30 días</option><option>Últimos 90 días</option></select>} /><div className="admin-chart-grid"><Card className="line-chart-card"><h2>Variación de indicadores</h2><p>Energía, recuperación y estado de ánimo</p><div className="multi-trend">{adminTrendValues.map((v, i) => <span key={i}><i style={{ height: `${v}%` }} /><b style={{ height: `${v ? Math.max(0, v - 12) : 0}%` }} /></span>)}</div><div className="chart-legend"><span><i className="teal-dot" />Energía</span><span><i className="blue-dot" />Recuperación</span></div></Card><Card className="trend-summary"><span className={hasUsage ? "trend-up" : "trend-flat"}>{hasUsage ? "↗" : "○"}</span><h3>Recuperación general</h3><strong>{recoveryValue}%</strong><p>{hasUsage ? "Calculada a partir del uso registrado." : "Aún no hay datos para comparar."}</p><hr /><span className="trend-flat">→</span><h3>Estado de ánimo</h3><strong>{moodValue}%</strong><p>{hasUsage ? "Basado en los registros personales realizados." : "Comienza en cero hasta el primer registro."}</p></Card></div><div className="three-columns"><Card><span className="eyebrow">Participación actual</span><h2>Áreas</h2>{areaUsage.slice(0, 3).map(([label, value], i) => <div className="rank-row" key={label}><span>{i + 1}</span><strong>{label}</strong><b>{value}%</b></div>)}</Card><Card><span className="eyebrow">Cambios recientes</span><h2>Áreas para observar</h2><div className="empty-data"><span>○</span><strong>{hasUsage ? "Registro en curso" : "Sin datos todavía"}</strong><p>{hasUsage ? `La actividad actual corresponde al área ${area}.` : "Los hallazgos aparecerán únicamente después de registrar uso real."}</p></div></Card><Card className="privacy-admin-card"><span>♢</span><h2>Lectura responsable</h2><p>Estos indicadores ayudan a orientar acciones institucionales. No representan diagnósticos ni permiten identificar a una persona.</p></Card></div></AdminShell>
    );

    if (screen === "admin-areas") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Vista institucional" title="Áreas" description="Participación y tendencias agregadas por equipo." /><Card className="area-table-card"><div className="table-toolbar"><ChipRow options={["Todas", "Asistencial", "Administrativo"]} value="Todas" onChange={() => {}} /><input placeholder="Buscar área" aria-label="Buscar área" /></div><div className="area-table"><div className="table-row head"><span>Área</span><span>Participación</span><span>Actividades</span><span>Bienestar</span><span>Tendencia</span></div>{["Emergencia", "Hospitalización", "Administración", "Consultorios", "UCI"].map((label) => { const isCurrentArea = label === area; const row = [label, `${isCurrentArea ? participationValue : 0}%`, String(isCurrentArea ? usageStats.activities : 0), String(isCurrentArea ? Math.max(energyValue, moodValue) : 0), "0%"]; return <div className="table-row" key={label}>{row.map((value, i) => <span key={i}>{i === 0 && <i>{value.slice(0, 2)}</i>}{value}</span>)}</div>; })}</div></Card><div className="aggregate-banner"><span>i</span><p>Todos los valores comienzan en cero y solo cambian con interacciones registradas.</p></div></AdminShell>
    );

    if (screen === "admin-events") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Gestión de actividades" title="Eventos" description="Crea y administra la programación de bienestar." action={<Button onClick={() => setEventModal(true)}>+ Crear evento</Button>} /><Card className="admin-events-card"><div className="table-toolbar"><ChipRow options={["Próximos", "Publicados", "Borradores"]} value="Próximos" onChange={() => {}} /><input placeholder="Buscar evento" /></div><div className="admin-events-table">{events.map((event) => <div key={event.id}><span className="event-date"><strong>{event.date.split(" ")[0]}</strong><small>{event.date.split(" ")[1]}</small></span><div><strong>{event.title}</strong><small>{event.area} · {event.place}</small></div><span>{event.time}</span><span className="status-published">Publicado</span><div><button onClick={() => setEventModal(true)}>Editar</button><button onClick={() => { setEvents((items) => items.filter((x) => x.id !== event.id)); showToast("Evento eliminado del prototipo"); }}>Eliminar</button></div></div>)}</div></Card></AdminShell>
    );

    if (screen === "admin-reports") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Análisis institucional" title="Reportes" description="Configura una vista agregada para el periodo que necesites." /><div className="reports-layout"><Card className="report-builder"><h2>Configurar reporte</h2><div className="form-grid"><label>Periodo<select><option>Últimos 30 días</option><option>Este trimestre</option></select></label><label>Área<select><option>Todas las áreas</option><option>Hospitalización</option><option>UCI</option></select></label><label>Tipo de personal<select><option>Todo el personal</option><option>Asistencial</option><option>Administrativo</option></select></label></div><fieldset><legend>Contenido del reporte</legend>{["Participación", "Actividades realizadas", "Tendencias de bienestar", "Eventos", "Uso de pausas"].map((x) => <label className="check-row" key={x}><input type="checkbox" defaultChecked /><span>{x}</span></label>)}</fieldset><Button onClick={() => showToast("Reporte actualizado con los datos disponibles")}>Generar reporte →</Button></Card><Card className="report-preview"><span className="eyebrow">Vista previa</span><h2>Reporte de bienestar</h2><p>Últimos 30 días · Todas las áreas</p><div className="preview-metrics"><div><strong>{participationValue}%</strong><small>Participación</small></div><div><strong>{usageStats.activities}</strong><small>Actividades</small></div></div><MiniBars values={weeklyBars} /><div className="placeholder-page-lines"><i /><i /><i /></div><span className="live-data-badge">DATOS DISPONIBLES</span></Card></div></AdminShell>
    );

    if (screen === "admin-settings") return (
      <AdminShell screen={screen} go={go}><PageHeader eyebrow="Administración" title="Configuración" description="Preferencias generales del entorno institucional." /><div className="settings-columns"><Card><h2>Notificaciones institucionales</h2><label className="toggle-row"><div><strong>Resumen semanal</strong><small>Indicadores agregados cada lunes</small></div><input type="checkbox" defaultChecked /></label><label className="toggle-row"><div><strong>Alertas de tendencia</strong><small>Cambios sostenidos a nivel de área</small></div><input type="checkbox" defaultChecked /></label><label className="toggle-row"><div><strong>Actividad de eventos</strong><small>Confirmaciones y cupos</small></div><input type="checkbox" /></label></Card><Card className="privacy-admin-card"><span>♢</span><h2>Privacidad institucional</h2><p>Los umbrales de agregación están activos. No se muestran perfiles, respuestas individuales ni rankings de trabajadores.</p><Button secondary onClick={() => showToast("Política de demostración")}>Revisar política</Button></Card></div></AdminShell>
    );

    return null;
  };

  return (
    <>
      {renderScreen()}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      {reminderModal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setReminderModal(false)}><form className="modal reminder-modal" onSubmit={createReminder} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Tu jornada</span><h2>Nuevo recordatorio</h2></div><button type="button" aria-label="Cerrar" onClick={() => setReminderModal(false)}>×</button></div><p>Programa un aviso breve. Podrás desactivarlo o eliminarlo cuando quieras.</p><fieldset><legend>Tipo de recordatorio</legend><div className="reminder-type-choice"><button type="button" className={reminderType === "Descanso" ? "selected" : ""} onClick={() => setReminderType("Descanso")}><span>◷</span><strong>Descanso</strong><small>Una pausa breve en tu jornada</small></button><button type="button" className={reminderType === "Taller" ? "selected" : ""} onClick={() => setReminderType("Taller")}><span>□</span><strong>Taller</strong><small>Un evento que no quieres olvidar</small></button></div></fieldset><div className="form-grid"><label className="span-two">Nombre<input name="title" required placeholder={reminderType === "Descanso" ? "Ej. Pausa de media mañana" : "Ej. Taller de bienestar"} /></label><label>Día<select name="day" defaultValue={reminderType === "Descanso" ? "Lunes a viernes" : "Jueves"}><option>Hoy</option><option>Mañana</option><option>Lunes a viernes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option></select></label><label>Hora<input name="time" type="time" defaultValue={reminderType === "Descanso" ? "10:30" : "12:45"} /></label><label className="span-two">¿Cuándo avisarte?<select name="notice"><option>A la hora</option><option>5 min antes</option><option>15 min antes</option><option>30 min antes</option></select></label></div><div className="notice-soft"><span>i</span><p>Los recordatorios respetarán tu horario silencioso y podrás posponer los descansos 10 minutos.</p></div><div className="form-actions"><Button type="button" secondary onClick={() => setReminderModal(false)}>Cancelar</Button><Button type="submit">Crear recordatorio</Button></div></form></div>}
      {eventModal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setEventModal(false)}><form className="modal" onSubmit={(e: FormEvent) => { e.preventDefault(); setEventModal(false); showToast("Evento publicado correctamente"); }} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Administración</span><h2>Crear evento</h2></div><button type="button" aria-label="Cerrar" onClick={() => setEventModal(false)}>×</button></div><div className="form-grid"><label className="span-two">Título<input defaultValue="Pausa de respiración guiada" /></label><label className="span-two">Descripción<textarea defaultValue="Una pausa breve para recuperar energía durante la jornada." /></label><label>Fecha<input type="date" defaultValue="2026-08-21" /></label><label>Hora<input type="time" defaultValue="13:00" /></label><label>Duración<select><option>15 min</option><option>30 min</option><option>60 min</option></select></label><label>Lugar<input defaultValue="Sala de reuniones" /></label><label>Área objetivo<select><option>Todas las áreas</option><option>Hospitalización</option><option>UCI</option></select></label><label>Cupo<input type="number" defaultValue="25" /></label><label>Modalidad<select><option>Presencial</option><option>Virtual</option><option>Mixta</option></select></label></div><div className="form-actions"><Button type="button" secondary onClick={() => setEventModal(false)}>Cancelar</Button><Button type="submit">Publicar evento</Button></div></form></div>}
    </>
  );
}
