import { FormEvent, useEffect, useState, useRef } from "react";
import "./styles.css";

type Member = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
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
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const DEFAULT_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Joannes Paulus M. Ople",
    role: "Data Analyst & Developer",
    avatar: "/avatars/joannes.jpg",
    skills: ["Data Analyst", "Developer"],
  },
  {
    id: "2",
    name: "Yadawadee Japimay",
    role: "AI & Machine Learning",
    avatar: "/avatars/yadawadee.jpg",
    skills: ["AI", "Machine Learning"],
  },
  {
    id: "3",
    name: "Pemika Khongman",
    role: "Data Engineer",
    avatar: "/avatars/pemika.jpg",
    skills: ["Data Engineer", "Pipelines"],
  },
];

const QUICK_PROMPTS = [
  "Tell me about Team 313",
  "What skills do you have?",
  "Show me your projects",
];

const NAV_SECTIONS = ["home", "team", "projects", "certificates", "contact"] as const;

export default function App() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeNav, setActiveNav] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
      .catch((err) => console.log("Using default Team 313 data:", err));
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
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "ai",
          text: "AI service is unavailable. Please verify backend is running.",
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

  const teamName = portfolio?.team.name ?? "Team 313";
  const teamDesc =
    portfolio?.team.description ??
    "A team of students who love technology and keep learning for a better tomorrow.";
  const displayMembers =
    portfolio?.team.members && portfolio.team.members.length > 0
      ? portfolio.team.members
      : DEFAULT_MEMBERS;

  return (
    <div className="corporate-dashboard">
      {/* SIDEBAR */}
      <aside className="corp-sidebar">
        <div>
          <div className="corp-logo">
            <div className="corp-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
                <circle cx="12" cy="12" r="3.5" fill="currentColor"></circle>
              </svg>
            </div>
            <span className="corp-logo-text">313</span>
          </div>

          <nav className="corp-nav">
            <button
              className={`corp-nav-link ${activeNav === "home" ? "active" : ""}`}
              onClick={() => navigateTo("home")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </button>

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

          </nav>
        </div>

        <div className="corp-sidebar-bottom">
          <div className="corp-online-status">
            <span className="online-dot"></span>
            <span>Online</span>
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
            <button
              className="corp-cta-btn"
              onClick={() => navigateTo("projects")}
            >
              <span>Explore Projects</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {/* Glowing 3D Wireframe Globe */}
          <div className="corp-globe-container" aria-hidden="true">
            <svg className="corp-globe-svg" viewBox="0 0 500 500" fill="none">
              <defs>
                <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0c1527" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="250" cy="250" r="190" fill="url(#globeGlow)" />
              <circle cx="250" cy="250" r="180" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.5" />
              <circle cx="250" cy="250" r="140" stroke="rgba(96, 165, 250, 0.2)" strokeWidth="1" />
              <ellipse cx="250" cy="250" rx="180" ry="70" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
              <ellipse cx="250" cy="250" rx="70" ry="180" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
              <ellipse cx="250" cy="250" rx="180" ry="130" stroke="rgba(96, 165, 250, 0.2)" strokeWidth="1" />
              <circle cx="220" cy="180" r="4" fill="#60a5fa" />
              <circle cx="310" cy="160" r="3.5" fill="#93c5fd" />
              <circle cx="170" cy="240" r="4" fill="#38bdf8" />
              <circle cx="270" cy="260" r="4.5" fill="#60a5fa" />
              <circle cx="340" cy="230" r="3" fill="#93c5fd" />
              <circle cx="240" cy="330" r="3.5" fill="#38bdf8" />
              <line x1="220" y1="180" x2="310" y2="160" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
              <line x1="220" y1="180" x2="170" y2="240" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
              <line x1="170" y1="240" x2="270" y2="260" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
              <line x1="310" y1="160" x2="340" y2="230" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
              <line x1="270" y1="260" x2="340" y2="230" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
              <line x1="270" y1="260" x2="240" y2="330" stroke="rgba(147, 197, 253, 0.4)" strokeWidth="1" />
            </svg>
          </div>
        </section>

        {/* TEAM GRID */}
        <section id="team" className="corp-team-section">
          <div className="corp-section-header">
            <h2 className="corp-section-title">Meet Our Team</h2>
            <a href="#team" className="corp-view-all">
              <span>View All →</span>
            </a>
          </div>

          <div className="corp-cards-grid">
            {displayMembers.slice(0, 3).map((member) => (
              <div className="white-team-card" key={member.id}>
                <div className="card-photo-wrapper">
                  <div className="organic-backdrop"></div>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="member-avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                </div>

                <div className="card-info-row">
                  <div>
                    <h3 className="card-member-name">{member.name}</h3>
                    <p className="card-member-role">{member.role}</p>
                  </div>
                  <button
                    className="card-arrow-btn"
                    title={`Ask AI about ${member.name}`}
                    onClick={() => {
                      setIsChatOpen(true);
                      sendMessage(`Tell me about ${member.name} (${member.role})`);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="corp-info-section">
          <h2 className="corp-section-title">Projects</h2>
          <p className="corp-desc">Explore the work created by Team 313.</p>
        </section>

        <section id="certificates" className="corp-info-section">
          <h2 className="corp-section-title">Certificates</h2>
          <p className="corp-desc">Our team certifications and achievements.</p>
        </section>

        <section id="contact" className="corp-info-section">
          <h2 className="corp-section-title">Contact</h2>
          <p className="corp-desc">Connect with Team 313 through the available contact channels.</p>
        </section>
      </main>

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
              <span className="widget-title">Chat with Team 313 AI</span>
            </div>
            <button className="widget-close" onClick={() => setIsChatOpen(false)} aria-label="Close Chat">
              ✕
            </button>
          </div>

          <div className="widget-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`widget-bubble-row ${msg.sender}`}>
                <div className={`widget-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
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
