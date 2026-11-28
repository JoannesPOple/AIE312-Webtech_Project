import "dotenv/config";
import cors from "cors";
import express from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import pg from "pg";
import portfolio from "./data/portfolio.json" with { type: "json" };

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

const app = express();
const port = Number(process.env.PORT ?? 3000);
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false } }) : null;

async function saveMessage(role: "user" | "assistant", content: string) {
  if (pool) await pool.query("INSERT INTO chat_messages (role, content) VALUES ($1, $2)", [role, content]);
}

async function initializeDatabase() {
  if (pool) await pool.query("CREATE TABLE IF NOT EXISTS chat_messages (id BIGSERIAL PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
}

// CLIENT_URL may list several sites, comma-separated (e.g. GitHub Pages + local dev).
const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/portfolio", (_request, response) => {
  response.json(portfolio);
});

app.get("/api/chat/history", async (_request, response) => {
  if (!pool) {
    response.json([]);
    return;
  }
  const result = await pool.query("SELECT id, role, content, created_at AS \"createdAt\" FROM chat_messages ORDER BY id ASC LIMIT 100");
  response.json(result.rows);
});

app.post("/api/chat", async (request, response) => {
  const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";

  if (!message) {
    response.status(400).json({ error: "Message is required" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    const reply = "ระบบ Chat AI พร้อมใช้งานแล้ว แต่ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในไฟล์ .env";
    await saveMessage("user", message);
    await saveMessage("assistant", reply);
    response.json({
      reply,
      demo: true,
    });
    return;
  }

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    // Try the main model first; if it's retired or overloaded, fall back to the next one.
    const models = [process.env.GEMINI_MODEL?.trim() || PRIMARY_MODEL, ...FALLBACK_MODELS].filter(
      (model, index, list) => list.indexOf(model) === index,
    );
    let result;
    let lastError: unknown;
    for (const model of models) {
      try {
        result = await client.models.generateContent({
          model,
          contents: message,
          config: {
            systemInstruction: `คุณคือผู้ช่วยของทีม Portfolio ให้ตอบจากข้อมูลทีมด้านล่างเท่านั้น หากไม่มีข้อมูลให้บอกตามตรง ห้ามสร้างข้อมูลขึ้นเอง\nAlways reply in the same language the user writes in (English question → English answer). Use plain text only, no Markdown symbols like ** or #. Keep answers short and friendly.\n\n${JSON.stringify(portfolio)}`,
            // Simple Q&A over a small JSON file doesn't need deep reasoning; low thinking cuts reply time.
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        break;
      } catch (error) {
        console.error(`Gemini model ${model} failed:`, error instanceof Error ? error.message : error);
        lastError = error;
      }
    }
    if (!result) throw lastError;

    const reply = result.text ?? "ไม่พบคำตอบจาก Gemini";
    await saveMessage("user", message);
    await saveMessage("assistant", reply);
    response.json({ reply });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: "AI service is unavailable" });
  }
});

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("Database initialization failed", error);
  process.exit(1);
});
