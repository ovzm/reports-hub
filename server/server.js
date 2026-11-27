import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { CLIENT_DIST } from "./src/paths.js";
import { authRouter } from "./src/auth.js";
import { reportsRouter } from "./src/reports.js";
import { bookRouter } from "./src/book.js";
import { ensureSeed } from "./scripts/seed.js";
// import { setupMicrosoftLogin } from "./src/microsoft.js";

dotenv.config({ quiet: true });

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET não definido no .env — usando um segredo de desenvolvimento.");
}

await ensureSeed();

const app = express();

app.use(cors());
app.use(express.json());

// setupMicrosoftLogin(app);

app.use("/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/book", bookRouter);

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|auth).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, "index.html")));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  if (fs.existsSync(CLIENT_DIST)) console.log(`App disponível em http://localhost:${PORT}`);
});
