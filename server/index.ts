import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import apiRouter from "./routes/api";
import authRouter from "./routes/auth";
import { createRateLimiter } from "./middleware/rateLimit";
import { attachRequestContext } from "./middleware/requestContext";
import { createSocketServer } from "./realtime/socket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  createSocketServer(server);

  app.use(express.json());
  app.use(cookieParser());
  app.use(attachRequestContext());
  app.use(createRateLimiter());
  app.use("/auth", authRouter);
  app.use("/api", apiRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
