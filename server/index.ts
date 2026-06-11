import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Request, Response } from "express";
import apiRouter from "./routes/api";
import authRouter from "./routes/auth";
import { createRateLimiter } from "./middleware/rateLimit";
import { attachRequestContext } from "./middleware/requestContext";
import { createSocketServer } from "./realtime/socket";
import { startOrderPaymentsSync } from "./services/orderPaymentsSync";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/// this test
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/", (req, res) => {
    res.send("API Running Successfully");
  });
  const server = createServer(app);
  createSocketServer(server);
  startOrderPaymentsSync();

  app.use(
    cors({
      origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        const allowed = (process.env.CORS_ORIGIN || "http://localhost:3001")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!origin) return cb(null, true);
        if (allowed.includes(origin)) return cb(null, true);
        return cb(new Error("CORS_NOT_ALLOWED"), false);
      },
      credentials: true,
    })
  );
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(cookieParser());
  app.use(attachRequestContext());
  app.use(createRateLimiter());
  app.use("/auth", authRouter);
  app.use("/api", apiRouter);

  app.use((err: unknown, req: Request, res: Response, _next: (err?: unknown) => void) => {
    const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
    const statusCode =
      message === "CORS_NOT_ALLOWED" ? 403 : message.startsWith("INVALID_") ? 400 : 500;

    if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
      res.status(statusCode).json({ error: message });
      return;
    }

    res.status(statusCode).type("text/plain").send("Error");
  });

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

  const port = Number(process.env.PORT) || 3000;

  server.on("error", (err: any) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Server port ${port} is already in use.`);
      console.error(`Stop the existing process, or run: PORT=3002 pnpm dev:server`);
      process.exit(1);
    }
    throw err;
  });
  await mongoose.connect(process.env.MONGO_URL!);

  console.log("MongoDB Connected");
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
