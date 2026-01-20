import Fastify from "fastify";
import cors from "@fastify/cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: "*" });

// OpenAI setup (will be used when quota is available)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database
const db = await open({
  filename: "movies.db",
  driver: sqlite3.Database,
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_input TEXT,
    recommended_movies TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

fastify.get("/", async () => {
  return { message: "Backend is running ✅" };
});

fastify.post("/recommend", async (request, reply) => {
  const { userInput } = request.body;

  if (!userInput || userInput.trim() === "") {
    return reply.status(400).send({ error: "userInput is required" });
  }

  let movies = [];

  try {
    // 🔹 TRY OpenAI first
    const prompt = `Recommend 3 to 5 movies based on this preference: ${userInput}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const moviesText = response.choices[0].message?.content || "";
    movies = moviesText
      .split("\n")
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

  } catch (error) {
    // 🔴 OpenAI quota / error → TEMPORARY FIX
    fastify.log.error("OpenAI failed, using mock data");

    movies = [
      "Mad Max: Fury Road",
      "John Wick",
      "The Dark Knight",
      "Gladiator",
      "Extraction"
    ];
  }

  // Save to DB
  await db.run(
    "INSERT INTO recommendations (user_input, recommended_movies) VALUES (?, ?)",
    userInput,
    movies.join(", ")
  );

  return reply.send({ recommendations: movies });
});

const start = async () => {
  try {
    await fastify.listen({ port: 5001 });
    console.log("Server running on port 5001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

