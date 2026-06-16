/**
 * usePushNotifications — Notifications navigateur pour les nouveaux messages
 *
 * Stratégie : polling toutes les 30 s sur l'endpoint de comptage non-lus.
 * Quand le compteur augmente, on déclenche une Notification API native
 * + un bip sonore synthétique (Web Audio API).
 *
 * Pas de VAPID / service worker requis — fonctionne en onglet actif.
 */
import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface UsePushNotificationsOptions {
  /** Rôle : "company" utilise unreadCountForCompany, "csn" utilise totalUnreadForCsn */
  role: "company" | "csn";
  /** Titre affiché dans la notification navigateur */
  title?: string;
  /** Activer le bip sonore (défaut : true) */
  sound?: boolean;
  /** Intervalle de polling en ms (défaut : 30 000) */
  interval?: number;
}

/** Joue un bip court via Web Audio API */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // La5
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio non disponible — silencieux
  }
}

/** Demande la permission de notifications si elle n'est pas encore accordée */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Affiche une notification navigateur native */
function showNotification(title: string, body: string, count: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "hub-resa-messages", // Remplace la précédente pour éviter le spam
      requireInteraction: false,
    });
    // Fermer automatiquement après 6 s
    setTimeout(() => n.close(), 6000);
  } catch {
    // Notification API non disponible
  }
}

export function usePushNotifications({
  role,
  title = "HUB_RESA — Nouveau message",
  sound = true,
  interval = 30_000,
}: UsePushNotificationsOptions) {
  const prevCountRef = useRef<number | null>(null);
  const permissionRequestedRef = useRef(false);

  // Requêtes tRPC pour les compteurs non-lus
  const companyQuery = trpc.team.unreadCountForCompany.useQuery(undefined, {
    enabled: role === "company",
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });

  const csnQuery = trpc.team.totalUnreadForCsn.useQuery(undefined, {
    enabled: role === "csn",
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });

  const currentCount = role === "company"
    ? (companyQuery.data ?? 0)
    : (csnQuery.data ?? 0);

  // Demander la permission au premier rendu
  useEffect(() => {
    if (permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    requestNotificationPermission();
  }, []);

  // Détecter les nouveaux messages et déclencher la notification
  useEffect(() => {
    if (prevCountRef.current === null) {
      // Initialisation : mémoriser le compteur sans notifier
      prevCountRef.current = currentCount;
      return;
    }

    if (currentCount > prevCountRef.current) {
      const newMessages = currentCount - prevCountRef.current;
      const body =
        newMessages === 1
          ? "Vous avez 1 nouveau message"
          : `Vous avez ${newMessages} nouveaux messages`;

      showNotification(title, body, newMessages);
      if (sound) playBeep();
    }

    prevCountRef.current = currentCount;
  }, [currentCount, title, sound]);

  return {
    unreadCount: currentCount,
    permission: typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default" as NotificationPermission,
    requestPermission: requestNotificationPermission,
  };
}
