// HUB_RESA Service Worker v1.0
// Stratégie : Cache First pour les assets statiques, Network First pour les API

const CACHE_NAME = "hubresa-v1";
const STATIC_CACHE = "hubresa-static-v1";
const API_CACHE = "hubresa-api-v1";

// Assets à mettre en cache immédiatement (App Shell)
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ─── Installation ─────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Précache des assets statiques");
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Précache partiel :", err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activation ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log("[SW] Suppression ancien cache :", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requêtes non-GET
  if (event.request.method !== "GET") return;

  // Ne pas intercepter les requêtes WebSocket (le Service Worker ne peut pas les intercepter)
  // Les WebSocket utilisent un protocole différent et doivent passer directement au serveur
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  // Ne pas intercepter les requêtes API tRPC (toujours réseau)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Hors ligne — veuillez vérifier votre connexion" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Stratégie Stale-While-Revalidate pour les assets JS/CSS/images
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request).then((response) => {
            // Vérifier que le schéma est http/https avant de mettre en cache
            if (response.ok && url.protocol === 'http:' || url.protocol === 'https:') {
              try {
                cache.put(event.request, response.clone());
              } catch (err) {
                console.warn('[SW] Erreur lors du cache :', err);
              }
            }
            return response;
          }).catch((err) => {
            console.warn('[SW] Erreur fetch :', err);
            return cached || new Response('Hors ligne', { status: 503 });
          });
          return cached || networkFetch;
        });
      })
    );
    return;
  }

  // Stratégie Network First pour les pages HTML (navigation)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse HTML pour usage hors ligne
        if (response.ok && event.request.mode === "navigate" && (url.protocol === 'http:' || url.protocol === 'https:')) {
          caches.open(STATIC_CACHE).then((cache) => {
            try {
              cache.put(event.request, response.clone());
            } catch (err) {
              console.warn('[SW] Erreur lors du cache HTML :', err);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // Hors ligne : retourner la page en cache ou la page d'accueil
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback vers la page d'accueil
          return caches.match("/").then((home) => {
            if (home) return home;
            return new Response(
              `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HUB_RESA — Hors ligne</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff7f0; }
    .card { text-align: center; padding: 2rem; max-width: 400px; }
    h1 { color: #E8751A; font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #666; margin-bottom: 1.5rem; }
    button { background: #E8751A; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚌 HUB_RESA</h1>
    <p>Vous êtes hors ligne. Vérifiez votre connexion internet et réessayez.</p>
    <button onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`,
              { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          });
        });
      })
  );
});

// ─── Message handler ──────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
