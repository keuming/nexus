import "dotenv/config";
import express from "express";
import { sendDailyReport } from "../services/dailyReport";
import { verifyHub2WebhookSignature } from "../services/hub2";
import { confirmCreditRequestPayment, getCreditRequestByHub2PurchaseRef } from "../transport-db";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import uploadRouter from "../uploadRoutes";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initWebSocket } from "./websocket-init";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  // Note: Hub2 webhook needs raw body for signature verification
  app.use((req, res, next) => {
    if (req.path === "/api/hub2/notify") {
      // Capture raw body for Hub2 signature verification
      let rawBody = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => { rawBody += chunk; });
      req.on("end", () => {
        (req as any).rawBody = rawBody;
        try {
          (req as any).body = JSON.parse(rawBody);
        } catch {
          (req as any).body = {};
        }
        next();
      });
    } else {
      next();
    }
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // File upload routes (multer multipart)
  app.use(uploadRouter);

  // ─── Hub2 Webhook ─────────────────────────────────────────────────────────
  // Called by Hub2 after each payment status update
  // Hub2 sends POST with JSON body and Hub2-Signature header
  app.post("/api/hub2/notify", async (req, res) => {
    try {
      const rawBody: string = (req as any).rawBody ?? JSON.stringify(req.body);
      const signatureHeader = req.headers["hub2-signature"] as string ?? "";

      // Verify webhook signature (HMAC-SHA256)
      if (signatureHeader && !verifyHub2WebhookSignature(rawBody, signatureHeader)) {
        console.warn("[Hub2] Signature webhook invalide — requête ignorée");
        return res.status(200).send("OK"); // Always 200 to avoid Hub2 retries
      }

      const payload = req.body as any;
      const eventType: string = payload?.type ?? "";
      const intentData = payload?.data;

      console.log(`[Hub2] Webhook reçu: type=${eventType}, intentId=${intentData?.id}`);

      // Only process successful payment events
      if (
        !intentData?.id ||
        !["payment_intent.succeeded", "payment_intent.updated"].includes(eventType)
      ) {
        return res.status(200).send("OK");
      }

      // Only act when payment is successful
      if (intentData.status !== "successful") {
        console.log(`[Hub2] Statut non-final: ${intentData.status} — en attente`);
        return res.status(200).send("OK");
      }

      // Find the credit request associated with this Hub2 purchase reference
      const purchaseRef: string = intentData.purchaseReference ?? "";
      const creditRequest = await getCreditRequestByHub2PurchaseRef(purchaseRef);

      if (!creditRequest) {
        console.log(`[Hub2] Aucune demande trouvée pour purchaseRef: ${purchaseRef}`);
        return res.status(200).send("OK");
      }

      // Skip if already processed
      if (creditRequest.status === "credited" || creditRequest.status === "payment_confirmed") {
        console.log(`[Hub2] Demande #${creditRequest.id} déjà traitée`);
        return res.status(200).send("OK");
      }

      // Get payment method details from the last payment attempt
      const lastPayment = intentData.payments?.[intentData.payments.length - 1];
      const paymentLabel = lastPayment
        ? `Hub2/${lastPayment.provider ?? "Mobile Money"} (${lastPayment.id})`
        : `Hub2/Mobile Money (${intentData.id})`;

      // Auto-validate and credit the account
      await confirmCreditRequestPayment(creditRequest.id, paymentLabel);
      console.log(`[Hub2] Demande #${creditRequest.id} validée automatiquement via ${paymentLabel}`);

      return res.status(200).send("OK");
    } catch (err) {
      console.error("[Hub2] Erreur webhook:", err);
      return res.status(200).send("OK"); // Always 200 to avoid Hub2 retries
    }
  });

  // ─── SEO — Sitemap.xml dynamique ────────────────────────────────────────────
  app.get("/sitemap.xml", (_req, res) => {
    const BASE = "https://www.nexus.africa";
    const now = new Date().toISOString().split("T")[0];
    const pages = [
      { url: "/",                priority: "1.0", changefreq: "daily"   },
      { url: "/about",           priority: "0.8", changefreq: "monthly" },
      { url: "/directory",       priority: "0.9", changefreq: "weekly"  },
      { url: "/bibliotheque",    priority: "0.9", changefreq: "weekly"  },
      { url: "/register-company",priority: "0.8", changefreq: "monthly" },
      { url: "/careers/apply",   priority: "0.9", changefreq: "weekly"  },
      { url: "/legal",           priority: "0.4", changefreq: "yearly"  },
      { url: "/transport-abidjan",  priority: "0.9", changefreq: "weekly"  },
      { url: "/hotels-abidjan",     priority: "0.9", changefreq: "weekly"  },
      { url: "/agences-voyage-abidjan", priority: "0.8", changefreq: "weekly" },
      { url: "/boutiques-abidjan", priority: "0.8", changefreq: "weekly"  },
    ];
    const urlEntries = pages.map(p =>
      `  <url>\n    <loc>${BASE}${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    ).join("\n");
    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
      `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
      `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`,
      `          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
      urlEntries,
      `</urlset>`,
    ].join("\n");
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(xml);
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Initialiser WebSocket (avant Vite pour que le server soit prêt)
  initWebSocket(server);

  // Start HTTP server BEFORE setupVite so server.address() returns the real
  // port when Vite computes its HMR serverHost (avoids localhost:5173 fallback)
  await new Promise<void>((resolve) =>
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
      resolve();
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}

startServer().catch(console.error);

// ─── RAPPORT JOURNALIER AUTOMATIQUE ──────────────────────────────────────────
// Envoyé chaque soir à 20h00 UTC (20h Abidjan/Dakar, 21h Douala/Yaoundé)
function scheduleDailyReport() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(20, 0, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const delay = next.getTime() - now.getTime();
  console.log(`[DailyReport] Prochain rapport dans ${Math.round(delay / 1000 / 60)} minutes (${next.toUTCString()})`);
  setTimeout(async () => {
    await sendDailyReport();
    // Relancer toutes les 24h
    setInterval(sendDailyReport, 24 * 60 * 60 * 1000);
  }, delay);
}

scheduleDailyReport();
