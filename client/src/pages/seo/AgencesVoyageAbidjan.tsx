/**
 * Page de destination SEO : Agences de voyage à Abidjan
 * URL : /agences-voyage-abidjan
 */
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Plane, Globe, Star, MapPin, ChevronRight, Phone, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEMA_ORG = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Agences de voyage à Abidjan — HUB_RESA",
  description:
    "Trouvez les meilleures agences de voyage à Abidjan pour vos billets d'avion, forfaits touristiques, visas et voyages organisés en Afrique et dans le monde.",
  provider: {
    "@type": "Organization",
    name: "HUB_RESA",
    url: "https://www.hubresa.cloud",
  },
  areaServed: [
    { "@type": "City", name: "Abidjan" },
    { "@type": "Country", name: "Côte d'Ivoire" },
  ],
  serviceType: "Agence de voyage et tourisme",
  url: "https://www.hubresa.cloud/agences-voyage-abidjan",
};

const SERVICES = [
  { icon: "✈️", title: "Billets d'avion", desc: "Vols nationaux et internationaux au meilleur prix. Toutes compagnies aériennes." },
  { icon: "🏝️", title: "Forfaits touristiques", desc: "Séjours tout compris en Afrique, Europe, Asie et Amériques." },
  { icon: "📋", title: "Assistance visa", desc: "Accompagnement pour les demandes de visa Schengen, USA, Canada et plus." },
  { icon: "🚌", title: "Voyages de groupe", desc: "Organisation de voyages scolaires, d'affaires et pèlerinages." },
  { icon: "🏨", title: "Réservation hôtel", desc: "Hôtels partenaires dans 150+ pays avec tarifs négociés." },
  { icon: "🚗", title: "Location de voiture", desc: "Véhicules avec ou sans chauffeur pour vos déplacements." },
];

const DESTINATIONS = [
  { dest: "Paris, France", type: "Europe", emoji: "🗼" },
  { dest: "Dubaï, EAU", type: "Moyen-Orient", emoji: "🏙️" },
  { dest: "Istanbul, Turquie", type: "Europe/Asie", emoji: "🕌" },
  { dest: "Casablanca, Maroc", type: "Afrique du Nord", emoji: "🌙" },
  { dest: "Dakar, Sénégal", type: "Afrique de l'Ouest", emoji: "🌊" },
  { dest: "Nairobi, Kenya", type: "Afrique de l'Est", emoji: "🦁" },
  { dest: "New York, USA", type: "Amérique du Nord", emoji: "🗽" },
  { dest: "Bangkok, Thaïlande", type: "Asie", emoji: "🛕" },
];

const FAQS = [
  {
    q: "Comment trouver une agence de voyage fiable à Abidjan sur HUB_RESA ?",
    a: "HUB_RESA référence uniquement des agences de voyage officiellement enregistrées et vérifiées. Chaque agence dispose d'une fiche complète avec ses services, ses tarifs indicatifs et les avis de ses clients. Vous pouvez contacter directement l'agence via la plateforme.",
  },
  {
    q: "Peut-on acheter des billets d'avion depuis Abidjan sur HUB_RESA ?",
    a: "Oui, les agences de voyage partenaires sur HUB_RESA proposent des billets d'avion au départ d'Abidjan (Aéroport Félix Houphouët-Boigny) vers toutes les destinations mondiales. Comparez les offres de plusieurs agences et choisissez la meilleure.",
  },
  {
    q: "Les agences de voyage sur HUB_RESA proposent-elles des forfaits Omra et Hadj ?",
    a: "Oui, plusieurs agences partenaires sont spécialisées dans les voyages religieux (Omra, Hadj) depuis Abidjan. Elles proposent des forfaits complets incluant le billet d'avion, l'hébergement à La Mecque et Médine, et l'accompagnement.",
  },
  {
    q: "Comment obtenir un visa pour voyager depuis Abidjan ?",
    a: "Les agences de voyage partenaires HUB_RESA offrent des services d'assistance visa pour les destinations Schengen (France, Espagne, Allemagne...), USA, Canada, Chine et autres. Elles vous guident dans la constitution du dossier et le dépôt de votre demande.",
  },
];

export default function AgencesVoyageAbidjan() {
  useSEO({
    title: "Agences de Voyage Abidjan — Billets Avion, Forfaits, Visa",
    description:
      "Trouvez les meilleures agences de voyage à Abidjan : billets d'avion, forfaits touristiques, assistance visa, voyages de groupe. Agences vérifiées sur HUB_RESA.",
    keywords:
      "agence voyage Abidjan, billet avion Abidjan, forfait touristique Côte d'Ivoire, visa Abidjan, voyage organisé Abidjan, agence tourisme Abidjan, Omra Abidjan, voyage affaires Abidjan, tour opérateur Côte d'Ivoire",
    canonicalPath: "/agences-voyage-abidjan",
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
            <Link href="/" className="text-orange-300 hover:text-orange-200 text-sm">HUB_RESA</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Agences de voyage Abidjan</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Agences de Voyage à Abidjan
              </h1>
              <p className="text-lg text-gray-200 max-w-2xl">
                Découvrez les meilleures agences de voyage à Abidjan pour vos billets d'avion,
                forfaits touristiques, assistance visa et voyages organisés vers le monde entier.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge className="bg-orange-500 text-white px-3 py-1">Agences vérifiées</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">150+ destinations</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Assistance visa</Badge>
            <Badge className="bg-white/20 text-white px-3 py-1">Voyages de groupe</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/directory">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Trouver une agence
              </Button>
            </Link>
            <Link href="/register-company">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Inscrire mon agence
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Services proposés par les agences à Abidjan</h2>
          <p className="text-muted-foreground mb-8">
            Les agences partenaires HUB_RESA couvrent tous vos besoins de voyage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <Card key={s.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <span className="text-3xl mb-3 block">{s.icon}</span>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Destinations populaires depuis Abidjan</h2>
          <p className="text-muted-foreground mb-8">
            Les agences partenaires proposent des vols et forfaits vers ces destinations prisées.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DESTINATIONS.map((d) => (
              <Card key={d.dest} className="hover:shadow-md transition-shadow cursor-pointer text-center">
                <CardContent className="pt-5">
                  <span className="text-4xl mb-2 block">{d.emoji}</span>
                  <h3 className="font-semibold text-sm">{d.dest}</h3>
                  <Badge variant="outline" className="mt-2 text-xs">{d.type}</Badge>
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
            Pourquoi passer par HUB_RESA pour votre agence de voyage ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Agences certifiées", desc: "Toutes les agences sont officiellement enregistrées et vérifiées par notre équipe." },
              { icon: Star, title: "Avis clients vérifiés", desc: "Consultez les retours d'expérience de vrais voyageurs avant de choisir." },
              { icon: Clock, title: "Réponse rapide", desc: "Les agences s'engagent à répondre à vos demandes sous 24 heures." },
            ].map(({ icon: Icon, title, desc }) => (
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

      {/* ── FAQ ── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Questions fréquentes sur les agences de voyage à Abidjan
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
          <h2 className="text-2xl font-bold mb-3">Planifiez votre voyage depuis Abidjan</h2>
          <p className="text-gray-200 mb-6">
            Contactez une agence partenaire HUB_RESA et obtenez votre devis personnalisé.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/directory">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                Voir les agences partenaires
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
          <Link href="/" className="hover:text-foreground">Accueil HUB_RESA</Link>
          <Link href="/transport-abidjan" className="hover:text-foreground">Transport Abidjan</Link>
          <Link href="/hotels-abidjan" className="hover:text-foreground">Hôtels Abidjan</Link>
          <Link href="/boutiques-abidjan" className="hover:text-foreground">Boutiques & Restaurants</Link>
          <Link href="/directory" className="hover:text-foreground">Annuaire</Link>
          <Link href="/about" className="hover:text-foreground">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
