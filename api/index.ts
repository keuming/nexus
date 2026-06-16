import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.ts";
import { createContext } from "../server/_core/context";
import uploadRouter from "../server/uploadRoutes";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { ADMIN_EMAILS } from "../server/_core/env";
import * as db from "../server/db";
import { getSessionCookieOptions } from "../server/_core/cookies";
import { sdk } from "../server/_core/sdk";
import { verifyHub2WebhookSignature } from "../server/services/hub2";
import { confirmCreditRequestPayment, getCreditRequestByHub2PurchaseRef } from "../server/transport-db";

const app = express();

// Body parser
app.use((req, res, next) => {
  if (req.path === "/api/hub2/notify") {
    let rawBody = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", () => {
      (req as any).rawBody = rawBody;
      try { (req as any).body = JSON.parse(rawBody); } catch { (req as any).body = {}; }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Upload routes
app.use(uploadRouter);

// OAuth callback
app.get("/api/oauth/callback", async (req, res) => {
  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }

    const emailLower = (userInfo.email ?? "").toLowerCase();
    const shouldBeAdmin = emailLower && ADMIN_EMAILS.has(emailLower);

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
      ...(shouldBeAdmin ? { role: "admin" } : {}),
    });

    if (shouldBeAdmin) {
      await db.promoteToAdminByEmail(emailLower);
    }

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});

// Hub2 Webhook
app.post("/api/hub2/notify", async (req, res) => {
  try {
    const rawBody: string = (req as any).rawBody ?? JSON.stringify(req.body);
    const signatureHeader = req.headers["hub2-signature"] as string ?? "";

    if (signatureHeader && !verifyHub2WebhookSignature(rawBody, signatureHeader)) {
      console.warn("[Hub2] Signature webhook invalide");
      return res.status(200).send("OK");
    }

    const payload = req.body;
    if (payload?.purchase_ref) {
      const creditRequest = await getCreditRequestByHub2PurchaseRef(payload.purchase_ref);
      if (creditRequest && payload.status === "SUCCESSFUL") {
        await confirmCreditRequestPayment(creditRequest.id, "hub2_webhook");
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[Hub2] Webhook error:", error);
    res.status(200).send("OK");
  }
});

// tRPC
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
