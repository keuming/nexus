/**
 * Page de destination SEO : Hôtels et hébergements à Abidjan
 * URL : /hotels-abidjan
 */
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Hotel, MapPin, Star, Wifi, Coffee, ChevronRight, Phone, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEMA_ORG = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Hôtels et hébergements à Abidjan — NEXUS",
  description:
    "Trouvez et réservez les meilleurs hôtels à Abidjan et en Côte d'Ivoire. Hôtels d'affaires, lodges, résidences et auberges. Réservation en ligne, paiement Mobile Money.",
  provider: {
    "@type": "Organization",
    name: "NEXUS",
    url: "https://www.hubresa.cloud",
  },
  areaServed: [
    { "@type": "City", name: "Abidjan" },
    { "@type": "City", name: "Yamoussoukro" },
    { "@type": "City", name: "Bouaké" },
    { "@type": "Country", name: "Côte d'Ivoire" },
  ],
  serviceType: "Réservation hôtelière en ligne",
  url: "https://www.hubresa.cloud/hotels-abidjan",
};

const QUARTIERS = [
  { name: "Plateau", desc: "Centre des affaires, hôtels haut de gamme", hotels: 18 },
  { name: "Cocody", desc: "Quartier résidentiel, hôtels boutiques", hotels: 24 },
  { name: "Marcory", desc: "Zone commerciale, hôtels d'affaires", hotels: 15 },
  { name: "Yopougon", desc: "Quartier populaire, hébergements économiques", hotels: 20 },
  { name: "Treichville", desc: "Proche port, hôtels transit", hotels: 12 },
  { name: "Bingerville", desc: "Périphérie calme, lodges et résidences", hotels: 8 },
];

const TYPES = [
  { type: "Hôtel d'affaires", icon: "🏢", desc: "Salles de conférence, WiFi haut débit, service 24h/24", price: "À partir de 35 000 FCFA/nuit" },
  { type: "Hôtel boutique", icon: "🌿", desc: "Ambiance intimiste, décoration soignée, service personnalisé", price: "À partir de 25 000 FCFA/nuit" },
  { type: "Résidence hôtelière", icon: "🏠", desc: "Appartements équipés, idéal pour longs séjours", price: "À partir de 20 000 FCFA/nuit" },
  { type: "Auberge & Lodge", icon: "🌴", desc: "Hébergement économique, ambiance conviviale", price: "À partir de 8 000 FCFA/nuit" },
];

const AMENITIES = [
  { icon: Wifi, label: "WiFi gratuit" },
  { icon: Coffee, label: "Petit-déjeuner" },
  { icon: Shield, label: "Sécurité 24h/24" },
  { icon: Clock, label: "Réception 24h/24" },
];

const FAQS = [
  {
    q: "Comment réserver un hôtel à Abidjan sur NEXUS ?",
    a: "Accédez à la section Hôtels sur NEXUS, entrez vos dates d'arrivée et de départ, votre budget et le quartier souhaité. Parcourez les établissements disponibles, consultez les photos et les avis, puis réservez directement en ligne. Le paiement est sécurisé et accepte Mobile Money (Orange Money, MTN MoMo, Wave).",
  },
  {
    q: "Quels sont les meilleurs quartiers pour séjourner à Abidjan ?",
    a: "Le Plateau est idéal pour les voyageurs d'affaires (proximité des sièges sociaux et administrations). Cocody est prisé pour son cadre résidentiel et ses restaurants. Marcory convient aux budgets intermédiaires. Pour les petits budgets, Yopougon et Treichville offrent de bonnes options.",
  },
  {
    q: "Peut-on annuler une réservation d'hôtel sur NEXUS ?",
    a: "Oui, la politique d'annulation est indiquée sur chaque fiche hôtel. La plupart des établissements acceptent les annulations gratuites jusqu'à 24h avant l'arrivée. Passé ce délai, des frais peuvent s'appliquer selon les conditions de l'hôtel.",
  },
  {
    q: "NEXUS propose-t-il des hôtels en dehors d'Abidjan ?",
    a: "Oui, NEXUS référence des hôtels dans toutes les grandes villes de Côte d'Ivoire (Yamoussoukro, Bouaké, San Pedro, Man, Korhogo) ainsi que dans 15 autres pays d'Afrique de l'Ouest et Centrale.",
  },
  {
    q: "Comment les hôtels sont-ils sélectionnés sur NEXUS ?",
    a: "Chaque établissement passe par un processus de vérification : contrôle des documents légaux, inspection des installations et validation des tarifs. Les avis clients vérifiés permettent également de maintenir un niveau de qualité élevé.",
  },
];

export default function HotelsAbidjan() {
  useSEO({
    title: "Hôtels Abidjan — Réservation en ligne Côte d'Ivoire",
    description:
      "Trouvez les meilleurs hôtels à Abidjan : Plateau, Cocody, Marcory, Yopougon. Hôtels d'affaires, boutiques, résidences. Réservation en ligne, paiement Mobile Money. NEXUS.",
    keywords:
      "hôtel Abidjan, réservation hôtel Abidjan, hôtel Plateau Abidjan, hôtel Cocody, hébergement Abidjan, hôtel pas cher Abidjan, hôtel affaires Abidjan, lodge Abidjan, résidence hôtelière Côte d'Ivoire, booking hôtel Abidjan",
    canonicalPath: "/hotels-abidjan",
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
            <span className="text-gray-300 text-sm">Hôtels Abidjan</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Hôtels et Hébergements à Abidjan
              </h1>
              <p className="text-lg text-gray-200 max-w-2xl">
                Réservez votre hôtel à Abidjan en quelques clics. Des établissements vérifiés
                dans tous les quartiers, pour tous les budgets. Paiement Mobile Money accepté.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge className="bg-orange-500 text-white px-3 py-1">+97 établissements</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Tous quartiers</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Paiement Mobile Money</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Avis vérifiés</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/hotels">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Rechercher un hôtel
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Inscrire mon établissement
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TYPES D'HÉBERGEMENT ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Types d'hébergement à Abidjan</h2>
          <p className="text-muted-foreground mb-8">
            NEXUS référence tous types d'établissements pour répondre à chaque besoin.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TYPES.map((t) => (
              <Card key={t.type} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{t.icon}</span>
                    <div>
                      <h3 className="font-bold text-base mb-1">{t.type}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{t.desc}</p>
                      <span className="text-orange-600 font-semibold text-sm">{t.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUARTIERS ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Hôtels par quartier à Abidjan</h2>
          <p className="text-muted-foreground mb-8">
            Choisissez votre quartier selon vos besoins : affaires, tourisme ou budget.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {QUARTIERS.map((q) => (
              <Card key={q.name} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold">{q.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{q.desc}</p>
                  <Badge variant="outline" className="text-xs">{q.hotels} établissements</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÉQUIPEMENTS ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Équipements disponibles dans nos hôtels partenaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AMENITIES.map(({ icon: Icon, label }) => (
              <div key={label} className="text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-orange-600" />
                </div>
                <p className="font-medium text-sm">{label}</p>
              </div>
            ))}
            {["Parking", "Piscine", "Restaurant", "Climatisation", "Salle sport", "Navette aéroport", "Spa & Bien-être", "Bar & Lounge"].map((s) => (
              <div key={s} className="text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-7 h-7 text-blue-600" />
                </div>
                <p className="font-medium text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Questions fréquentes sur les hôtels à Abidjan
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
          <h2 className="text-2xl font-bold mb-3">Trouvez votre hôtel idéal à Abidjan</h2>
          <p className="text-gray-200 mb-6">
            Comparez les prix, lisez les avis et réservez en toute sécurité sur NEXUS.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/hotels">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Voir les hôtels disponibles
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
          <Link href="/agences-voyage-abidjan" className="hover:text-foreground">Agences de voyage</Link>
          <Link href="/boutiques-abidjan" className="hover:text-foreground">Boutiques & Restaurants</Link>
          <Link href="/directory" className="hover:text-foreground">Annuaire</Link>
          <Link href="/about" className="hover:text-foreground">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
