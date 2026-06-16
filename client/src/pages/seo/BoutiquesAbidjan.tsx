/**
 * Page de destination SEO : Boutiques et Restaurants en ligne à Abidjan
 * URL : /boutiques-abidjan
 */
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { ShoppingBag, Utensils, MapPin, Star, ChevronRight, Phone, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEMA_ORG = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Boutiques et Restaurants en ligne à Abidjan — NEXUS",
  description:
    "Commandez en ligne dans les meilleurs restaurants et boutiques d'Abidjan. Livraison à domicile, paiement Mobile Money. Restauration rapide, cuisine africaine, pizzerias et plus.",
  provider: {
    "@type": "Organization",
    name: "NEXUS",
    url: "https://www.nexus.africa",
  },
  areaServed: [
    { "@type": "City", name: "Abidjan" },
    { "@type": "Country", name: "Côte d'Ivoire" },
  ],
  serviceType: "Commande en ligne et livraison à domicile",
  url: "https://www.nexus.africa/boutiques-abidjan",
};

const CATEGORIES_RESTO = [
  { emoji: "🍛", name: "Cuisine africaine", desc: "Attiéké, foutou, riz gras, mafé et spécialités locales" },
  { emoji: "🍕", name: "Pizzerias", desc: "Pizzas artisanales et plats italiens livrés chauds" },
  { emoji: "🍔", name: "Fast-food", desc: "Burgers, sandwichs et menus rapides" },
  { emoji: "🍣", name: "Cuisine asiatique", desc: "Sushi, nems, plats thaïlandais et chinois" },
  { emoji: "🥗", name: "Healthy & Veggie", desc: "Salades, bowls et plats végétariens" },
  { emoji: "🍰", name: "Pâtisseries & Cafés", desc: "Gâteaux, viennoiseries, café et thé" },
];

const CATEGORIES_BOUTIQUE = [
  { emoji: "👗", name: "Mode & Vêtements", desc: "Tenues africaines, prêt-à-porter, accessoires" },
  { emoji: "💄", name: "Beauté & Cosmétiques", desc: "Produits de soin, maquillage, parfums" },
  { emoji: "📱", name: "Électronique", desc: "Téléphones, accessoires, électroménager" },
  { emoji: "🛒", name: "Alimentation", desc: "Épicerie, produits locaux, boissons" },
  { emoji: "🌺", name: "Artisanat & Cadeaux", desc: "Objets d'art, bijoux, souvenirs ivoiriens" },
  { emoji: "📚", name: "Livres & Fournitures", desc: "Manuels scolaires, papeterie, matériel bureau" },
];

const AVANTAGES = [
  { icon: Clock, title: "Livraison rapide", desc: "Commandez et recevez votre repas en 30 à 45 minutes selon votre quartier." },
  { icon: Truck, title: "Livraison à domicile", desc: "Livraison directement chez vous dans tous les quartiers d'Abidjan." },
  { icon: Star, title: "Restaurants notés", desc: "Consultez les avis clients avant de commander pour choisir le meilleur." },
  { icon: Phone, title: "Paiement Mobile Money", desc: "Payez facilement par Orange Money, MTN MoMo, Wave ou espèces." },
];

const QUARTIERS = [
  "Plateau", "Cocody", "Marcory", "Yopougon", "Treichville",
  "Adjamé", "Abobo", "Port-Bouët", "Koumassi", "Bingerville",
];

const FAQS = [
  {
    q: "Comment commander un repas en ligne depuis Abidjan sur NEXUS ?",
    a: "Accédez à la section Restauration sur NEXUS, choisissez votre restaurant parmi les établissements partenaires, parcourez la carte, ajoutez vos plats au panier et validez votre commande. Vous pouvez choisir entre la livraison à domicile ou le retrait sur place.",
  },
  {
    q: "Quels modes de paiement sont acceptés pour les commandes en ligne ?",
    a: "NEXUS accepte Orange Money, MTN MoMo, Wave, les cartes bancaires Visa/Mastercard et le paiement en espèces à la livraison. Tous les paiements sont sécurisés.",
  },
  {
    q: "Dans quels quartiers d'Abidjan la livraison est-elle disponible ?",
    a: "La livraison est disponible dans tous les quartiers d'Abidjan : Plateau, Cocody, Marcory, Yopougon, Treichville, Adjamé, Abobo, Port-Bouët, Koumassi et Bingerville. Les délais varient selon la distance.",
  },
  {
    q: "Comment inscrire mon restaurant ou ma boutique sur NEXUS ?",
    a: "Rendez-vous sur la page d'inscription entreprise de NEXUS, sélectionnez le type d'activité (Restauration ou Boutique), remplissez le formulaire avec vos informations et votre menu ou catalogue. Notre équipe valide votre dossier sous 48 heures.",
  },
  {
    q: "Peut-on suivre sa commande en temps réel sur NEXUS ?",
    a: "Oui, après validation de votre commande, vous recevez un numéro de suivi. Vous pouvez suivre l'état de votre commande (en préparation, en livraison, livré) directement depuis l'application NEXUS.",
  },
];

export default function BoutiquesAbidjan() {
  useSEO({
    title: "Boutiques & Restaurants en ligne Abidjan — Livraison à domicile",
    description:
      "Commandez en ligne dans les meilleurs restaurants et boutiques d'Abidjan. Livraison à domicile rapide, paiement Mobile Money. Cuisine africaine, fast-food, mode, cosmétiques. NEXUS.",
    keywords:
      "restaurant en ligne Abidjan, livraison repas Abidjan, commande en ligne Abidjan, boutique en ligne Côte d'Ivoire, livraison à domicile Abidjan, cuisine africaine Abidjan, fast food Abidjan, Orange Money livraison, MTN MoMo commande, restauration Abidjan",
    canonicalPath: "/boutiques-abidjan",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG) }}
      />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-orange-300 hover:text-orange-200 text-sm">NEXUS</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Boutiques & Restaurants Abidjan</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Boutiques & Restaurants en ligne à Abidjan
              </h1>
              <p className="text-lg text-gray-200 max-w-2xl">
                Commandez vos repas préférés et faites vos achats en ligne depuis Abidjan.
                Livraison rapide à domicile, paiement Mobile Money accepté.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge className="bg-orange-500 text-white px-3 py-1">Livraison 30-45 min</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Tous quartiers</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Mobile Money</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Suivi en temps réel</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Commander maintenant
              </Button>
            </Link>
            <Link href="/register-company">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Inscrire mon établissement
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── RESTAURANTS ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Utensils className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Restaurants à Abidjan</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Commandez en ligne dans les meilleurs restaurants d'Abidjan, livrés chez vous.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES_RESTO.map((c) => (
              <Card key={c.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-5">
                  <span className="text-3xl mb-2 block">{c.emoji}</span>
                  <h3 className="font-bold text-sm mb-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOUTIQUES ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Boutiques en ligne à Abidjan</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Faites vos achats en ligne auprès des boutiques partenaires NEXUS.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES_BOUTIQUE.map((c) => (
              <Card key={c.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-5">
                  <span className="text-3xl mb-2 block">{c.emoji}</span>
                  <h3 className="font-bold text-sm mb-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Les avantages de commander sur NEXUS à Abidjan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AVANTAGES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUARTIERS ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Livraison disponible dans tous les quartiers d'Abidjan
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {QUARTIERS.map((q) => (
              <Badge key={q} variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-orange-50">
                <MapPin className="w-3 h-3 mr-1" /> {q}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Questions fréquentes sur les commandes en ligne à Abidjan
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="pt-5">
                  <h3 className="font-semibold mb-2 text-[#0f2044]">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 px-4 bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">
            Commandez maintenant depuis Abidjan
          </h2>
          <p className="text-gray-200 mb-6">
            Restaurants, boutiques, livraison rapide — tout est disponible sur NEXUS.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Découvrir les établissements
              </Button>
            </Link>
            <a href="tel:+2250504921096">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Phone className="w-4 h-4 mr-2" /> +225 0504 921 096
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-6 px-4 border-t text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="hover:text-foreground">Accueil NEXUS</Link>
          <Link href="/transport-abidjan" className="hover:text-foreground">Transport Abidjan</Link>
          <Link href="/hotels-abidjan" className="hover:text-foreground">Hôtels Abidjan</Link>
          <Link href="/agences-voyage-abidjan" className="hover:text-foreground">Agences de voyage</Link>
          <Link href="/directory" className="hover:text-foreground">Annuaire</Link>
          <Link href="/about" className="hover:text-foreground">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
