import { CSSProperties, FormEvent, useEffect, useState, useRef } from "react";
import "./styles.css";
import portfolioData from "../../BE/src/data/portfolio.json";

type Project = {
  name: string;
  result?: string;
  date?: string;
  description?: string;
};

type MemberLinks = {
  github?: string;
  linkedin?: string;
  email?: string;
};

type Member = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  projects?: Project[];
  links?: MemberLinks;
};

type Portfolio = {
  team: {
    name: string;
    description: string;
    tagline?: string;
    members: Member[];
  };
};

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  animate?: boolean;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Reveals AI replies letter by letter, like a terminal readout. */
function TypewriterText({ text, animate, onTick }: { text: string; animate?: boolean; onTick?: () => void }) {
  const [shown, setShown] = useState(animate && !prefersReducedMotion() ? 0 : text.length);

  useEffect(() => {
    if (shown >= text.length) return;
    // Finish any reply in roughly 1.5 seconds, however long it is.
    const step = Math.max(1, Math.ceil(text.length / 90));
    const timer = window.setTimeout(() => {
      setShown((n) => Math.min(text.length, n + step));
      onTick?.();
    }, 16);
    return () => window.clearTimeout(timer);
  }, [shown, text, onTick]);

  const typing = shown < text.length;
  return (
    <p>
      {text.slice(0, shown)}
      {typing && <span className="type-cursor" aria-hidden="true">▍</span>}
    </p>
  );
}

/** Deterministic circuit traces for the planet surface. */
const PLANET_TRACES = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const paths: string[] = [];
  for (let i = 0; i < 90; i++) {
    let x = 110 + Math.round(rand() * 20) * 14;
    let y = 110 + Math.round(rand() * 20) * 14;
    let d = `M${x} ${y}`;
    let horizontal = rand() > 0.5;
    const steps = 2 + Math.floor(rand() * 3);
    for (let s = 0; s < steps; s++) {
      const len = (1 + Math.floor(rand() * 3)) * 14 * (rand() > 0.5 ? 1 : -1);
      if (horizontal) x += len;
      else y += len;
      d += ` L${x} ${y}`;
      horizontal = !horizontal;
    }
    paths.push(d);
  }
  return paths;
})();

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 97) % 500,
  y: (i * 61 + 23) % 500,
  r: 0.6 + (i % 3) * 0.5,
  delay: (i % 7) * 0.6,
}));

/** Green ringed planet shown on the right when the chat is closed. */
function PlanetConstruct() {
  const ringBack = (cy: number) => `M40 ${cy} A210 34 0 0 1 460 ${cy}`;
  const ringFront = (cy: number) => `M40 ${cy} A210 34 0 0 0 460 ${cy}`;
  return (
    <div className="planet-scene" aria-hidden="true">
      <svg viewBox="0 0 500 500" fill="none">
        <defs>
          <radialGradient id="planetBody" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#3dff8a" />
            <stop offset="35%" stopColor="#0f9a45" />
            <stop offset="75%" stopColor="#06401e" />
            <stop offset="100%" stopColor="#021208" />
          </radialGradient>
          <radialGradient id="planetHalo" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#00ff66" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00ff66" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ringBand" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a6b30" />
            <stop offset="50%" stopColor="#2bd96c" />
            <stop offset="100%" stopColor="#0a6b30" />
          </linearGradient>
          <clipPath id="planetClip">
            <circle cx="250" cy="250" r="150" />
          </clipPath>
          <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {STARS.map((s, i) => (
          <circle
            key={i}
            className="planet-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#e6f5ec"
            style={{ animationDelay: `${s.delay}s` }}
          />
        ))}

        <g className="planet-float">
          <circle cx="250" cy="250" r="200" fill="url(#planetHalo)" className="planet-halo" />

          {/* back halves of the rings */}
          <path d={ringBack(150)} className="planet-ring ring-back" stroke="url(#ringBand)" />
          <path d={ringBack(350)} className="planet-ring ring-back ring-slow" stroke="url(#ringBand)" />

          {/* planet body */}
          <circle cx="250" cy="250" r="150" fill="url(#planetBody)" />
          <g clipPath="url(#planetClip)" className="planet-traces">
            {PLANET_TRACES.map((d, i) => (
              <path key={i} d={d} stroke={i % 6 === 0 ? "#b8ffd4" : "#00ff66"} strokeWidth={i % 6 === 0 ? 1.6 : 1} opacity={i % 6 === 0 ? 0.9 : 0.35} />
            ))}
          </g>
          {/* terminator shading */}
          <circle cx="250" cy="250" r="150" fill="url(#planetHalo)" opacity="0.4" />
          <circle cx="285" cy="285" r="150" fill="#000" opacity="0.28" clipPath="url(#planetClip)" />

          {/* ring emblem */}
          <g filter="url(#planetGlow)" className="planet-emblem">
            <circle cx="250" cy="232" r="38" stroke="#b8ffd4" strokeWidth="12" />
            <circle cx="250" cy="232" r="14" fill="#b8ffd4" />
            <path d="M210 270 C210 304, 290 304, 290 270" stroke="#b8ffd4" strokeWidth="12" strokeLinecap="round" />
          </g>

          {/* front halves of the rings */}
          <path d={ringFront(150)} className="planet-ring ring-front" stroke="url(#ringBand)" />
          <path d={ringFront(350)} className="planet-ring ring-front ring-slow" stroke="url(#ringBand)" />
        </g>
      </svg>
    </div>
  );
}

function LinkIcon({ kind }: { kind: keyof MemberLinks }) {
  if (kind === "github")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
      </svg>
    );
  if (kind === "linkedin")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5z" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Same data the backend serves, bundled in so the site still shows
// the whole team (e.g. on GitHub Pages) when the API can't be reached.
const DEFAULT_MEMBERS: Member[] = (portfolioData as Portfolio).team.members;

/** Resolve "/avatars/x.jpg" against Vite's base path (needed on GitHub Pages). */
const assetUrl = (path: string) =>
  path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;

const QUICK_PROMPTS = [
  "Who are the members of GreenLantern?",
  "What powers does each member bring?",
  "What missions has the team completed?",
];

const NAV_SECTIONS = ["home", "team", "projects", "certificates"] as const;

export default function App() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeNav, setActiveNav] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! 👋\nAsk me anything about our team, projects, or skills!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${apiUrl}/portfolio`)
      .then((res) => res.json())
      .then((data) => setPortfolio(data))
      .catch((err) => console.log("Using default GreenLantern data:", err));
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const sections = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveNav(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.5, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function navigateTo(sectionId: (typeof NAV_SECTIONS)[number]) {
    setActiveNav(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function sendMessage(textToSend: string) {
    const text = textToSend.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: "u-" + Date.now(), sender: "user", text }]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: "a-" + Date.now(),
          sender: "ai",
          text: data.reply ?? data.error ?? "No response available.",
          animate: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "ai",
          text: "AI service is unavailable. Please verify backend is running.",
          animate: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(inputMessage);
  }

  const teamName = portfolio?.team.name ?? "GreenLantern";
  const teamDesc =
    portfolio?.team.description ??
    "A team of students who love technology and keep learning for a better tomorrow.";
  const displayMembers =
    portfolio?.team.members && portfolio.team.members.length > 0
      ? portfolio.team.members
      : DEFAULT_MEMBERS;
  const missions = displayMembers.flatMap((member) =>
    (member.projects ?? []).map((project) => ({ ...project, memberName: member.name })),
  );

  const totalPowers = displayMembers.reduce((sum, m) => sum + (m.skills?.length ?? 0), 0);

  const scrollChatToEnd =() => messagesEndRef.current?.scrollIntoView({ block: "end" });

  function toggleFlip(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className={`corporate-dashboard ${isChatOpen ? "chat-open" : ""}`}>
      {/* SIDEBAR */}
      <aside className="corp-sidebar">
        {/* Flying energy particles */}
        <div className="sidebar-sky" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="spark" style={{ "--i": i } as CSSProperties} />
          ))}
          <span className="comet" />
          <span className="comet comet-2" />
        </div>

        <div className="sidebar-content">
          <div className="corp-logo">
            <div className="corp-logo-icon">
              {/* Power ring */}
              <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                <path d="M10 30 C10 42, 38 42, 38 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <circle cx="24" cy="20" r="14" fill="#050806" stroke="currentColor" strokeWidth="3" />
                <circle cx="24" cy="20" r="9.5" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                <circle cx="24" cy="20" r="5.5" fill="currentColor" />
              </svg>
            </div>
            <span className="corp-logo-text">GreenLantern</span>
          </div>

          <nav className="corp-nav">
            <button
              className={`corp-nav-link ${activeNav === "team" ? "active" : ""}`}
              onClick={() => {
                navigateTo("team");
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Our Team</span>
            </button>

            {missions.length > 0 && (
              <button
                className={`corp-nav-link ${activeNav === "projects" ? "active" : ""}`}
                onClick={() => navigateTo("projects")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <span>Missions</span>
              </button>
            )}

          </nav>
        </div>

        {/* Charge meters */}
        <div className="sidebar-content sidebar-bottom">
          <h4 className="sidebar-label">Ring Charge</h4>
          {[
            { label: "Powers", value: totalPowers, max: Math.max(totalPowers, 30) },
            { label: "Missions", value: missions.length, max: Math.max(missions.length, 12) },
          ].map((meter, i) => (
            <div className="charge-meter" key={meter.label}>
              <div className="charge-row">
                <span>{meter.label}</span>
                <span className="charge-value">{meter.value}</span>
              </div>
              <div className="charge-track">
                <div
                  className="charge-fill"
                  style={
                    {
                      "--w": `${(meter.value / meter.max) * 100}%`,
                      "--delay": `${0.3 + i * 0.25}s`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          ))}
          <div className="sidebar-status">
            <span className="status-dot" aria-hidden="true" />
            AI assistant online
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="corp-main">
        {/* HERO */}
        <section id="home" className="corp-hero">
          <div className="hero-text-block">
            <span className="corp-tagline">WELCOME TO OUR PORTFOLIO</span>
            <h1 className="corp-title">{teamName}</h1>
            <p className="corp-subtitle">Innovate • Collaborate • Create Impact</p>
            <p className="corp-desc">{teamDesc}</p>
          </div>

          {/* Glowing power lantern */}
          <div className="corp-globe-container" aria-hidden="true">
            <svg className="corp-globe-svg" viewBox="0 0 500 500" fill="none">
              <defs>
                <radialGradient id="lanternAura" cx="50%" cy="52%" r="50%">
                  <stop offset="0%" stopColor="#00ff66" stopOpacity="0.35" />
                  <stop offset="45%" stopColor="#0a7a3a" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0b130f" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="lanternCore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b8ffd4" />
                  <stop offset="50%" stopColor="#00ff66" />
                  <stop offset="100%" stopColor="#008a37" />
                </linearGradient>
                <filter id="lanternGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle className="lantern-aura" cx="250" cy="260" r="210" fill="url(#lanternAura)" />

              {/* Orbiting energy rings */}
              <g className="orbit orbit-a">
                <ellipse cx="250" cy="260" rx="200" ry="56" stroke="rgba(0,255,102,0.45)" strokeWidth="1.5" strokeDasharray="6 10" />
                <circle cx="450" cy="260" r="5" fill="#7dffb0" filter="url(#lanternGlow)" />
              </g>
              <g className="orbit orbit-b">
                <ellipse cx="250" cy="260" rx="170" ry="44" stroke="rgba(0,255,102,0.3)" strokeWidth="1" />
                <circle cx="80" cy="260" r="4" fill="#00ff66" filter="url(#lanternGlow)" />
              </g>

              {/* Lantern body */}
              <g className="lantern" filter="url(#lanternGlow)">
                {/* handle */}
                <path d="M215 140 C215 100, 285 100, 285 140" stroke="#00ff66" strokeWidth="6" strokeLinecap="round" />
                {/* top cap */}
                <path d="M190 160 L310 160 L292 140 L208 140 Z" fill="#0b130f" stroke="#00ff66" strokeWidth="4" strokeLinejoin="round" />
                <rect x="180" y="160" width="140" height="16" rx="4" fill="#132219" stroke="#00ff66" strokeWidth="4" />
                {/* glass */}
                <rect x="200" y="176" width="100" height="150" rx="10" fill="url(#lanternCore)" opacity="0.9" />
                <rect x="200" y="176" width="100" height="150" rx="10" stroke="#00ff66" strokeWidth="4" />
                {/* frame bars */}
                <line x1="250" y1="176" x2="250" y2="326" stroke="#0b130f" strokeWidth="5" opacity="0.55" />
                <line x1="200" y1="251" x2="300" y2="251" stroke="#0b130f" strokeWidth="5" opacity="0.55" />
                {/* base */}
                <rect x="180" y="326" width="140" height="16" rx="4" fill="#132219" stroke="#00ff66" strokeWidth="4" />
                <path d="M195 342 L305 342 L290 366 L210 366 Z" fill="#0b130f" stroke="#00ff66" strokeWidth="4" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </section>

        {/* TEAM GRID */}
        <section id="team" className="corp-team-section">
          <div className="corp-section-header">
            <h2 className="corp-section-title">Meet Our Team</h2>
          </div>

          <div className="corp-cards-grid">
            {displayMembers.slice(0, 3).map((member) => {
              const isFlipped = !!flipped[member.id];
              const links = Object.entries(member.links ?? {}).filter(([, url]) => url) as [
                keyof MemberLinks,
                string,
              ][];
              return (
                <div
                  className={`flip-card ${isFlipped ? "is-flipped" : ""}`}
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isFlipped}
                  aria-label={`${member.name}: ${isFlipped ? "hide" : "show"} powers`}
                  onClick={() => {
                    // Mouse users flip by hovering; taps on touch screens still toggle.
                    if (window.matchMedia("(hover: none)").matches) toggleFlip(member.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleFlip(member.id);
                    }
                  }}
                >
                  <div className="flip-inner">
                    {/* FRONT */}
                    <div className="white-team-card flip-face flip-front">
                      <div className="card-photo-wrapper">
                        <div className="organic-backdrop"></div>
                        {member.avatar ? (
                          <img src={assetUrl(member.avatar)} alt={member.name} className="member-avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">
                            {member.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                        )}
                      </div>
                      <div className="card-info-row">
                        <h3 className="card-member-name">{member.name}</h3>
                        <p className="card-member-role">{member.role}</p>
                        <span className="flip-hint">View powers</span>
                      </div>
                    </div>

                    {/* BACK */}
                    <div className="white-team-card flip-face flip-back" aria-hidden={!isFlipped}>
                      <h3 className="card-member-name">{member.name}</h3>
                      <p className="card-member-role">{member.role}</p>
                      {member.bio && <p className="back-bio">{member.bio}</p>}

                      {member.skills && member.skills.length > 0 && (
                        <>
                          <h4 className="back-label">Powers</h4>
                          <ul className="power-list">
                            {member.skills.map((skill, i) => (
                              <li
                                key={skill}
                                className="power-chip"
                                style={{ "--d": `${i * 60}ms` } as CSSProperties}
                              >
                                {skill}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {links.length > 0 && (
                        <div className="back-links">
                          {links.map(([kind, url]) => (
                            <a
                              key={kind}
                              className="back-link"
                              href={kind === "email" ? `mailto:${url}` : url}
                              target={kind === "email" ? undefined : "_blank"}
                              rel="noreferrer"
                              aria-label={`${member.name} on ${kind}`}
                              tabIndex={isFlipped ? 0 : -1}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkIcon kind={kind} />
                            </a>
                          ))}
                        </div>
                      )}

                      <span className="flip-hint">Powers online</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MISSIONS */}
        {missions.length > 0 && (
          <section id="projects" className="missions-section">
            <div className="corp-section-header">
              <h2 className="corp-section-title">Missions</h2>
              <span className="mission-count">{missions.length} logged</span>
            </div>

            <div className="missions-grid">
              {missions.map((mission) => (
                <article className="mission-card" key={`${mission.memberName}-${mission.name}`}>
                  <div className="mission-meta">
                    {mission.result && <span className="mission-result">{mission.result}</span>}
                    {mission.date && <span className="mission-date">{mission.date}</span>}
                  </div>
                  <h3 className="mission-name">{mission.name}</h3>
                  {mission.description && <p className="mission-desc">{mission.description}</p>}
                  <p className="mission-member">{mission.memberName}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {!isChatOpen && <PlanetConstruct />}

      {/* FLOATING CHAT WIDGET */}
      {isChatOpen && (
        <aside className="corp-chat-widget">
          <div className="widget-header">
            <div className="robot-header-left">
              <div className="robot-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <circle cx="12" cy="5" r="2"></circle>
                  <path d="M12 7v4"></path>
                  <line x1="8" y1="16" x2="8.01" y2="16"></line>
                  <line x1="16" y1="16" x2="16.01" y2="16"></line>
                </svg>
              </div>
              <span className="widget-title">Chat with GreenLantern AI</span>
            </div>
            <button className="widget-close" onClick={() => setIsChatOpen(false)} aria-label="Close Chat">
              ✕
            </button>
          </div>

          <div className="widget-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`widget-bubble-row ${msg.sender}`}>
                <div className={`widget-bubble ${msg.sender}`}>
                  {msg.sender === "ai" ? (
                    <TypewriterText text={msg.text} animate={msg.animate} onTick={scrollChatToEnd} />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="widget-bubble-row ai">
                <div className="widget-bubble ai loading-dots">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="widget-suggestions">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="suggestion-pill"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="widget-input-bar" onSubmit={handleSubmit}>
            <input
              type="text"
              className="widget-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button
              type="submit"
              className="widget-send-btn"
              disabled={loading || !inputMessage.trim()}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </aside>
      )}

      {/* Floating Circular Toggle Button at Bottom Right */}
      <button
        className="bottom-right-toggle"
        onClick={() => setIsChatOpen((prev) => !prev)}
        aria-label="Toggle Chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    </div>
  );
}
