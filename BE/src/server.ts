import "dotenv/config";
import cors from "cors";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import portfolio from "./data/portfolio.json" with { type: "json" };

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/portfolio", (_request, response) => {
  response.json(portfolio);
});

app.post("/api/chat", async (request, response) => {
  const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";

  if (!message) {
    response.status(400).json({ error: "Message is required" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    response.json({
      reply: "ระบบ Chat AI พร้อมใช้งานแล้ว แต่ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในไฟล์ .env",
      demo: true,
    });
    return;
  }

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await client.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `คุณคือผู้ช่วยของทีม Portfolio ให้ตอบจากข้อมูลทีมด้านล่างเท่านั้น หากไม่มีข้อมูลให้บอกตามตรง ห้ามสร้างข้อมูลขึ้นเอง\n\n${JSON.stringify(portfolio)}`,
      },
    });

    response.json({ reply: result.text ?? "ไม่พบคำตอบจาก Gemini" });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: "AI service is unavailable" });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
