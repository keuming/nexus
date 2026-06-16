/**
 * Page de destination SEO : Transport interurbain Abidjan / Côte d'Ivoire
 * URL : /transport-abidjan
 * Objectif : Indexation Google pour les requêtes "transport Abidjan", "bus Côte d'Ivoire", etc.
 */
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Bus, MapPin, Clock, Shield, Star, ChevronRight, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEMA_ORG = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Transport interurbain Abidjan — NEXUS",
  description:
    "Réservez vos billets de bus et de transport interurbain au départ d'Abidjan vers toutes les villes de Côte d'Ivoire et d'Afrique de l'Ouest. Compagnies vérifiées, paiement sécurisé.",
  provider: {
    "@type": "Organization",
    name: "NEXUS",
    url: "https://www.nexus.africa",
  },
  areaServed: [
    { "@type": "City", name: "Abidjan" },
    { "@type": "Country", name: "Côte d'Ivoire" },
    { "@type": "Country", name: "Sénégal" },
    { "@type": "Country", name: "Mali" },
    { "@type": "Country", name: "Ghana" },
    { "@type": "Country", name: "Cameroun" },
  ],
  serviceType: "Transport interurbain par autocar",
  url: "https://www.nexus.africa/transport-abidjan",
};

const DESTINATIONS = [
  { from: "Abidjan", to: "Bouaké", duration: "4h30", price: "4 500 FCFA" },
  { from: "Abidjan", to: "Yamoussoukro", duration: "3h00", price: "3 500 FCFA" },
  { from: "Abidjan", to: "San Pedro", duration: "5h00", price: "5 000 FCFA" },
  { from: "Abidjan", to: "Man", duration: "8h00", price: "7 500 FCFA" },
  { from: "Abidjan", to: "Korhogo", duration: "9h00", price: "8 500 FCFA" },
  { from: "Abidjan", to: "Daloa", duration: "5h30", price: "5 500 FCFA" },
  { from: "Abidjan", to: "Accra (Ghana)", duration: "6h00", price: "9 000 FCFA" },
  { from: "Abidjan", to: "Bamako (Mali)", duration: "18h00", price: "18 000 FCFA" },
];

const COMPANIES = [
  { name: "UTB", country: "Côte d'Ivoire", rating: 4.7, trips: 120 },
  { name: "MATS", country: "Côte d'Ivoire", rating: 4.5, trips: 95 },
  { name: "STC", country: "Ghana", rating: 4.6, trips: 80 },
  { name: "Bittar Transport", country: "Côte d'Ivoire", rating: 4.4, trips: 60 },
  { name: "Trans Ivoire", country: "Côte d'Ivoire", rating: 4.3, trips: 55 },
  { name: "CTM", country: "Sénégal", rating: 4.8, trips: 110 },
];

const FAQS = [
  {
    q: "Comment réserver un billet de bus depuis Abidjan sur NEXUS ?",
    a: "Rendez-vous sur la page d'accueil NEXUS, sélectionnez l'onglet Transport, choisissez votre ville de départ (Abidjan) et votre destination, puis sélectionnez la date et le nombre de passagers. Vous pouvez réserver en ligne et payer par Mobile Money, carte bancaire ou espèces en agence.",
  },
  {
    q: "Quelles compagnies de transport desservent Abidjan ?",
    a: "NEXUS regroupe plus de 50 compagnies de transport vérifiées opérant depuis Abidjan : UTB, MATS, Bittar Transport, Trans Ivoire, et bien d'autres. Toutes les compagnies sont certifiées et leurs véhicules régulièrement contrôlés.",
  },
  {
    q: "Peut-on voyager depuis Abidjan vers d'autres pays d'Afrique de l'Ouest ?",
    a: "Oui, NEXUS propose des liaisons internationales depuis Abidjan vers le Ghana (Accra), le Mali (Bamako), le Sénégal (Dakar), le Burkina Faso (Ouagadougou), le Togo (Lomé) et d'autres destinations. Les billets internationaux sont disponibles directement sur la plateforme.",
  },
  {
    q: "Comment suivre mon colis expédié depuis Abidjan ?",
    a: "NEXUS intègre un module d'expédition de colis. Après enregistrement de votre envoi, vous recevez un numéro de suivi unique. Vous pouvez suivre votre colis en temps réel via la section Expédition de l'application.",
  },
  {
    q: "Les billets NEXUS sont-ils remboursables ?",
    a: "La politique d'annulation varie selon la compagnie. En général, les annulations effectuées plus de 24h avant le départ donnent droit à un remboursement partiel ou à un avoir. Consultez les conditions de chaque compagnie lors de la réservation.",
  },
];

export default function TransportAbidjan() {
  useSEO({
    title: "Transport Abidjan — Billets de Bus Côte d'Ivoire & Afrique de l'Ouest",
    description:
      "Réservez vos billets de bus au départ d'Abidjan vers Bouaké, Yamoussoukro, San Pedro, Accra, Bamako et toute l'Afrique de l'Ouest. +50 compagnies vérifiées sur NEXUS. Paiement Mobile Money accepté.",
    keywords:
      "transport Abidjan, bus Abidjan, billet bus Côte d'Ivoire, transport interurbain Abidjan, compagnie bus Abidjan, voyage Abidjan Bouaké, bus Abidjan Accra, UTB Abidjan, MATS transport, réservation bus en ligne Côte d'Ivoire",
    canonicalPath: "/transport-abidjan",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG) }}
      />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-orange-300 hover:text-orange-200 text-sm">
              NEXUS
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Transport Abidjan</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Transport Interurbain depuis Abidjan
              </h1>
              <p className="text-lg text-gray-200 max-w-2xl">
                Réservez vos billets de bus au départ d'Abidjan vers toutes les villes de
                Côte d'Ivoire et d'Afrique de l'Ouest. Plus de 50 compagnies vérifiées,
                paiement Mobile Money accepté.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge className="bg-orange-500 text-white px-3 py-1">+50 compagnies</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">16 pays desservis</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Paiement Mobile Money</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Billet électronique</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Réserver un billet maintenant
              </Button>
            </Link>
            <Link href="/directory">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Voir les compagnies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Pourquoi choisir NEXUS pour votre transport depuis Abidjan ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Compagnies vérifiées", desc: "Toutes les compagnies sont certifiées et contrôlées par notre équipe CSN." },
              { icon: Clock, title: "Réservation 24h/24", desc: "Réservez vos billets à toute heure depuis votre téléphone ou ordinateur." },
              { icon: Star, title: "Avis clients", desc: "Consultez les avis vérifiés des voyageurs pour choisir la meilleure compagnie." },
              { icon: Globe, title: "16 pays couverts", desc: "Voyagez vers le Ghana, le Mali, le Sénégal, le Cameroun et bien plus." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="pt-6 text-center">
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

      {/* ── DESTINATIONS POPULAIRES ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">
            Destinations populaires depuis Abidjan
          </h2>
          <p className="text-muted-foreground mb-8">
            Découvrez les trajets les plus empruntés au départ d'Abidjan avec les tarifs indicatifs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DESTINATIONS.map((d) => (
              <Card key={d.to} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">{d.from}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-semibold text-sm">{d.to}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{d.duration}</span>
                    </div>
                    <span className="text-orange-600 font-bold text-sm">À partir de {d.price}</span>
                  </div>
                  <Link href="/">
                    <Button size="sm" className="w-full mt-3 bg-[#0f2044] hover:bg-[#1a3a6e] text-white text-xs group-hover:bg-orange-500 transition-colors">
                      Réserver
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPAGNIES ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">
            Compagnies de transport partenaires à Abidjan
          </h2>
          <p className="text-muted-foreground mb-8">
            Toutes nos compagnies partenaires sont vérifiées et notées par les voyageurs.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {COMPANIES.map((c) => (
              <Card key={c.name} className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">{c.name}</h3>
                    <Badge variant="outline" className="text-xs">{c.country}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-yellow-500 mb-1">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <span className="font-semibold">{c.rating}</span>
                    <span className="text-muted-foreground text-xs">/ 5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.trips}+ trajets disponibles</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/directory">
              <Button variant="outline" className="border-[#0f2044] text-[#0f2044]">
                Voir toutes les compagnies <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Questions fréquentes sur le transport depuis Abidjan
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

      {/* ── CTA FINAL ── */}
      <section className="py-12 px-4 bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">
            Prêt à voyager depuis Abidjan ?
          </h2>
          <p className="text-gray-200 mb-6">
            Rejoignez des milliers de voyageurs qui font confiance à NEXUS pour leurs
            déplacements en Afrique de l'Ouest.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Réserver maintenant
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

      {/* ── FOOTER LINKS ── */}
      <footer className="py-6 px-4 border-t text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="hover:text-foreground">Accueil NEXUS</Link>
          <Link href="/hotels-abidjan" className="hover:text-foreground">Hôtels Abidjan</Link>
          <Link href="/agences-voyage-abidjan" className="hover:text-foreground">Agences de voyage</Link>
          <Link href="/boutiques-abidjan" className="hover:text-foreground">Boutiques & Restaurants</Link>
          <Link href="/directory" className="hover:text-foreground">Annuaire compagnies</Link>
          <Link href="/about" className="hover:text-foreground">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
