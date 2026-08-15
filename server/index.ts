import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStorageConfig } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const staticPath = isProduction
  ? path.resolve(__dirname, "public")
  : path.resolve(__dirname, "..", "dist", "public");

function portFromEnvironment(): number {
  const parsed = Number.parseInt(process.env.PORT || "3000", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535
    ? parsed
    : 3000;
}

function configureSecurityHeaders(app: express.Express): void {
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'"],
          formAction: ["'self'", "https:"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "https:"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );
}

function startServer(): void {
  const app = express();
  const server = createServer(app);
  const storageConfig = getStorageConfig();

  configureSecurityHeaders(app);
  app.use(express.json({ limit: "16kb", strict: true }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));

  app.get("/api/health", (_request: Request, response: Response) => {
    response.set("Cache-Control", "no-store");
    response.json({
      ok: true,
      service: "open-auth-kit",
      mode: process.env.VITE_AUTH_MODE === "redirect" ? "redirect" : "demo",
      database: storageConfig.provider,
    });
  });

  app.use(
    express.static(staticPath, {
      index: false,
      dotfiles: "deny",
      redirect: false,
      setHeaders: (response, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          response.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable"
          );
        } else {
          response.setHeader("Cache-Control", "public, max-age=300");
        }
      },
    })
  );

  app.use("/api", (_request: Request, response: Response) => {
    response.status(404).json({ error: "Not found" });
  });

  app.get(/.*/, (request: Request, response: Response) => {
    if (!request.accepts("html")) {
      response.status(404).type("text").send("Not found");
      return;
    }
    response.sendFile(path.join(staticPath, "index.html"));
  });

  const errorHandler: ErrorRequestHandler = (
    _error,
    _request,
    response,
    _next
  ) => {
    response.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  const port = portFromEnvironment();
  const host = process.env.HOST || "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`Open Auth Kit running at http://${host}:${port}/`);
  });
}

startServer();
