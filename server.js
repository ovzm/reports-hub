import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PUBLIC_DIR } from "./src/paths.js";
import { authRouter } from "./src/auth.js";
import { reportsRouter } from "./src/reports.js";
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
app.use(express.static(PUBLIC_DIR));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`  Relatórios:         http://localhost:${PORT}/`);
});
