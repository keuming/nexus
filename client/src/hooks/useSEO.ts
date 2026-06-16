/**
 * useSEO.ts
 * Hook pour gérer les balises <title> et <meta description> dynamiquement
 * par page, pour améliorer le référencement naturel sur Google.
 */
import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalPath?: string;
}

const BASE_TITLE = "NEXUS";
const BASE_URL = "https://www.hubresa.cloud";
const DEFAULT_DESCRIPTION =
  "NEXUS est la plateforme multi-services leader en Afrique de l'Ouest et Centrale : réservez vos billets de bus, commandez en restaurant, expédiez vos colis et trouvez un hôtel dans 16 pays africains.";
const DEFAULT_KEYWORDS =
  "réservation transport Afrique, billets bus Côte d'Ivoire, expédition colis Afrique, restaurant en ligne Abidjan, hôtel Afrique Ouest, HUB RESA, transport interurbain, compagnies bus Sénégal Mali Ghana Cameroun";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663089638801/krJWDH8mB9j4aJHR7zvPat/og-image-hubresa-Tf5C9LTtnEiyapgmECVixj.png",
  ogType = "website",
  canonicalPath,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title === BASE_TITLE ? BASE_TITLE : `${title} — ${BASE_TITLE}`;
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("keywords", keywords);

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:site_name", BASE_TITLE, true);
    if (canonicalPath) {
      setMeta("og:url", `${BASE_URL}${canonicalPath}`, true);
      setLink("canonical", `${BASE_URL}${canonicalPath}`);
    }

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage);
  }, [title, description, keywords, ogImage, ogType, canonicalPath]);
}
