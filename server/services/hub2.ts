/**
 * Hub2 Payment Service
 * Documentation: https://docs.hub2.io/integration/en/payments/payments_integration
 *
 * Flux d'intégration :
 * 1. createPaymentIntent()  → crée une intention de paiement (retourne id + token)
 * 2. attemptPayment()       → initie le paiement Mobile Money côté client
 * 3. Hub2 envoie un webhook POST /api/hub2/notify avec signature HMAC-SHA256
 * 4. verifyWebhookSignature() → vérifie l'intégrité du webhook
 * 5. Si statut "successful" → confirmCreditRequestPayment() → crédite le compte
 */

import { createHmac } from "crypto";

const HUB2_API_BASE = "https://api.hub2.io";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Hub2PaymentIntent {
  id: string;
  token: string;
  status: "payment_required" | "processing" | "action_required" | "successful" | "failed";
  amount: number;
  currency: string;
  purchaseReference: string;
  customerReference: string;
  payments: Hub2Payment[];
  mode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hub2Payment {
  id: string;
  intentId: string;
  status: "created" | "processing" | "successful" | "failed";
  method: string;
  country: string;
  provider: string;
  number?: string;
  amount: number;
  currency: string;
  nextAction?: {
    type: "redirect" | "ussd" | "push_notification";
    redirectUrl?: string;
    ussdCode?: string;
  };
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerReference: string; // ID compagnie
  purchaseReference: string; // ID unique de la demande (ex: "NEXUS-CR-123")
}

export interface AttemptPaymentParams {
  intentId: string;
  token: string;
  country: string;   // "CI", "SN", "CM", "BF", "ML", "GN", "TG", "BJ", "NE"
  provider: string;  // "orange", "mtn", "moov", "wave", "free"
  msisdn: string;    // Numéro de téléphone Mobile Money
}

export interface Hub2WebhookPayload {
  type: string; // "payment_intent.succeeded" | "payment.succeeded" | etc.
  data: Hub2PaymentIntent;
  id: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHub2Headers(environment: "sandbox" | "live" = "live") {
  const apiKey = process.env.HUB2_API_KEY;
  const merchantId = process.env.HUB2_MERCHANT_ID;

  if (!apiKey || !merchantId) {
    throw new Error("Hub2 non configuré. Veuillez définir HUB2_API_KEY et HUB2_MERCHANT_ID.");
  }

  return {
    "Content-Type": "application/json",
    "ApiKey": apiKey,
    "MerchantId": merchantId,
    "Environment": process.env.HUB2_ENVIRONMENT ?? environment,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Étape 1 : Créer une intention de paiement côté serveur
 * Retourne l'id et le token JWT nécessaires pour l'étape suivante
 */
export async function createHub2PaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ success: true; intent: Hub2PaymentIntent } | { success: false; error: string }> {
  try {
    const headers = getHub2Headers();
    const response = await fetch(`${HUB2_API_BASE}/payment-intents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customerReference: String(params.customerReference),
        purchaseReference: params.purchaseReference,
        amount: params.amount,
        currency: params.currency,
      }),
    });

    const data = await response.json() as any;

    if (response.ok && data.id) {
      return { success: true, intent: data as Hub2PaymentIntent };
    }

    return {
      success: false,
      error: data?.message ?? data?.error ?? `Hub2 erreur ${response.status}`,
    };
  } catch (err: any) {
    return { success: false, error: `Erreur réseau Hub2 : ${err.message}` };
  }
}

/**
 * Étape 2 : Tenter un paiement Mobile Money sur l'intention
 * Peut être appelé depuis le frontend avec le token JWT (sans exposer l'API key)
 */
export async function attemptHub2Payment(
  params: AttemptPaymentParams
): Promise<{ success: true; intent: Hub2PaymentIntent } | { success: false; error: string }> {
  try {
    const response = await fetch(
      `${HUB2_API_BASE}/payment-intents/${params.intentId}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          paymentMethod: "mobile_money",
          country: params.country,
          provider: params.provider,
          mobileMoney: { msisdn: params.msisdn },
        }),
      }
    );

    const data = await response.json() as any;

    if (response.status === 201 && data.id) {
      return { success: true, intent: data as Hub2PaymentIntent };
    }

    return {
      success: false,
      error: data?.message ?? data?.error ?? `Hub2 erreur ${response.status}`,
    };
  } catch (err: any) {
    return { success: false, error: `Erreur réseau Hub2 : ${err.message}` };
  }
}

/**
 * Récupérer le statut d'une intention de paiement (polling)
 */
export async function getHub2PaymentIntentStatus(
  intentId: string
): Promise<{ success: true; intent: Hub2PaymentIntent } | { success: false; error: string }> {
  try {
    const headers = getHub2Headers();
    const response = await fetch(`${HUB2_API_BASE}/payment-intents/${intentId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json() as any;

    if (response.ok && data.id) {
      return { success: true, intent: data as Hub2PaymentIntent };
    }

    return { success: false, error: data?.message ?? `Hub2 erreur ${response.status}` };
  } catch (err: any) {
    return { success: false, error: `Erreur réseau Hub2 : ${err.message}` };
  }
}

/**
 * Vérifier la signature HMAC-SHA256 d'un webhook Hub2
 * Header: Hub2-Signature: s1=XXXX,s0=XXXX
 */
export function verifyHub2WebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const webhookSecret = process.env.HUB2_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[Hub2] HUB2_WEBHOOK_SECRET non défini — signature non vérifiée");
    return true; // En mode dégradé, accepter sans vérification
  }

  try {
    // Extraire s1 (signature courante) et s0 (ancienne signature)
    const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
      const [key, val] = part.split("=");
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {});

    const expectedSig = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Vérifier s1 (signature principale)
    if (parts.s1 === expectedSig) return true;

    // Vérifier s0 si présent (ancienne clé pendant rotation)
    const oldSecret = process.env.HUB2_WEBHOOK_OLD_SECRET;
    if (oldSecret && parts.s0) {
      const expectedOldSig = createHmac("sha256", oldSecret)
        .update(rawBody)
        .digest("hex");
      if (parts.s0 === expectedOldSig) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Générer une référence d'achat unique pour Hub2
 * Format : NEXUS-CR-{requestId}-{timestamp}
 * Seuls les caractères A-Za-z0-9-_. sont autorisés
 */
export function generateHub2PurchaseRef(requestId: number): string {
  return `NEXUS-CR-${requestId}-${Date.now()}`;
}

/**
 * Mapper le pays/opérateur vers le provider Hub2
 */
export const HUB2_PROVIDERS: Record<string, { country: string; provider: string; label: string }> = {
  orange_ci:   { country: "CI", provider: "orange", label: "Orange Money (CI)" },
  mtn_ci:      { country: "CI", provider: "mtn",    label: "MTN MoMo (CI)" },
  moov_ci:     { country: "CI", provider: "moov",   label: "Moov Money (CI)" },
  wave_ci:     { country: "CI", provider: "wave",   label: "Wave (CI)" },
  orange_sn:   { country: "SN", provider: "orange", label: "Orange Money (SN)" },
  free_sn:     { country: "SN", provider: "free",   label: "Free Money (SN)" },
  wave_sn:     { country: "SN", provider: "wave",   label: "Wave (SN)" },
  orange_cm:   { country: "CM", provider: "orange", label: "Orange Money (CM)" },
  mtn_cm:      { country: "CM", provider: "mtn",    label: "MTN MoMo (CM)" },
  orange_bf:   { country: "BF", provider: "orange", label: "Orange Money (BF)" },
  moov_bf:     { country: "BF", provider: "moov",   label: "Moov Money (BF)" },
  orange_ml:   { country: "ML", provider: "orange", label: "Orange Money (ML)" },
  moov_ml:     { country: "ML", provider: "moov",   label: "Moov Money (ML)" },
  orange_gn:   { country: "GN", provider: "orange", label: "Orange Money (GN)" },
  mtn_gn:      { country: "GN", provider: "mtn",    label: "MTN MoMo (GN)" },
  togocel_tg:  { country: "TG", provider: "togocel",label: "T-Money (TG)" },
  moov_tg:     { country: "TG", provider: "moov",   label: "Moov Money (TG)" },
  mtn_bj:      { country: "BJ", provider: "mtn",    label: "MTN MoMo (BJ)" },
  moov_bj:     { country: "BJ", provider: "moov",   label: "Moov Money (BJ)" },
};
