import { FormEvent, useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  projects?: string[];
};

type Portfolio = {
  team: { name: string; description: string; contact?: string; projects?: string[]; members: Member[] };
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function App() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/portfolio`).then((result) => result.json()),
      fetch(`${apiUrl}/chat/history`).then((result) => result.json()),
    ]).then(([data, history]) => {
      setPortfolio(data);
      setMessages(history);
    });
  }, []);

  async function askAi(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setReply("");
    const question = message.trim();
    setMessages((current) => [...current, { role: "user", content: question }]);
    try {
      const result = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error ?? "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
      }

      setReply(data.reply ?? data.error ?? "เกิดข้อผิดพลาด");
      setMessages((current) => [...current, { role: "assistant", content: data.reply ?? data.error ?? "เกิดข้อผิดพลาด" }]);
    } catch (error) {
      setReply(error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อกับ AI ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <p className="eyebrow">Team AI Portfolio</p>
      <h1>{portfolio?.team.name ?? "Team Portfolio"}</h1>
      <p className="muted">{portfolio?.team.description ?? "Loading portfolio..."}</p>
      {portfolio?.team.contact && <p>Contact: {portfolio.team.contact}</p>}
      {portfolio?.team.projects && <p>Team projects: {portfolio.team.projects.join(", ")}</p>}

      <section className="members-grid">
        {portfolio?.team.members.map((member) => (
          <article className="card" key={member.id}>
            <h2>{member.name}</h2>
            <p className="role">{member.role}</p>
            <p>{member.bio}</p>
            <div className="tags">
              {member.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
            {member.projects?.length ? <p>Projects: {member.projects.join(", ")}</p> : null}
          </article>
        ))}
      </section>

      <section className="chat card">
        <h2>Ask our AI</h2>
        <p className="muted">Ask about our team, skills, or projects.</p>
        <form onSubmit={askAi}>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="เช่น ใครถนัด Frontend?" />
          <button disabled={loading}>{loading ? "กำลังคิด..." : "ถาม AI"}</button>
        </form>
        <div className="messages" aria-live="polite">
          {messages.map((item, index) => <p className={`message ${item.role}`} key={`${item.role}-${index}`}><strong>{item.role === "user" ? "You" : "AI"}:</strong> {item.content}</p>)}
        </div>
        {reply && <p className="reply">{reply}</p>}
      </section>
    </main>
  );
}

export default App;
