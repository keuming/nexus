import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  // Strip the `server` key from viteConfig to avoid deep-merge conflicts
  // In middlewareMode, we fully control server options here
  const { server: _ignored, ...restViteConfig } = viteConfig as any;

  const serverOptions = {
    middlewareMode: true,
    // HMR WebSocket is blocked by the Manus reverse proxy (WSS upgrade fails).
    // Disabling HMR removes the browser-side connection attempt entirely.
    // The app still works; manual browser refresh is needed after code changes.
    hmr: false,
    allowedHosts: true as const,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  };

  const vite = await createViteServer({
    ...restViteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
    customLogger: {
      info: (msg: string) => { if (!msg.includes("hmr") && !msg.includes("websocket")) console.info(msg); },
      warn: (msg: string) => { if (!msg.includes("hmr") && !msg.includes("websocket")) console.warn(msg); },
      error: (msg: string) => { if (!msg.includes("hmr") && !msg.includes("websocket")) console.error(msg); },
      clearScreen: () => {},
      hasErrorLogged: () => false,
      hasWarned: false,
      warnOnce: (msg: string) => { if (!msg.includes("hmr") && !msg.includes("websocket")) console.warn(msg); },
    },
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { maxAge: "1d" }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`index.html not found at ${indexPath}`);
      return res.status(404).send("index.html not found");
    }
    res.sendFile(indexPath);
  });
}
