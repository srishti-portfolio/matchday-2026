import "dotenv/config";
import { createApp } from "./app.js";
import { initDb } from "./db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await initDb();
  } catch (err) {
    // A database problem shouldn't stop the whole API from serving.
    console.error("Database init failed - continuing without accounts:", err.message);
  }

  const server = createApp().listen(PORT, () => {
    console.log(`Matchday API running on http://localhost:${PORT}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
