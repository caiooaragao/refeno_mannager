import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { authMiddleware } from "./middlewares/auth";
import { errorHandler } from "./middlewares/errorHandler";
import { ensureAdminUser } from "./lib/ensureAdminUser";

const app = express();
const port = Number(process.env.API_PORT) || 3333;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);
app.use("/api", routes);
app.use(errorHandler);

async function bootstrap() {
  await ensureAdminUser();

  app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar a API:", error);
  process.exit(1);
});
