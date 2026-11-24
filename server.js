import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PUBLIC_DIR } from "./src/paths.js";

dotenv.config({ quiet: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
