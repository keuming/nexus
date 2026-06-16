import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bus,
  CheckCircle2,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Package,
  Phone,
  Shield,
  Star,
  Truck,
  Twitter,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";

export default function About() {
  const [, navigate] = useLocation();
  useSEO({
    title: "À propos de NEXUS",
    description: "Découvrez NEXUS, la plateforme multi-services qui connecte voyageurs, restaurants, hôtels et entreprises d'expédition dans 16 pays d'Afrique de l'Ouest et Centrale.",
    keywords: "NEXUS présentation, plateforme transport Afrique, qui sommes-nous, CSN NEXUS, mission",
    canonicalPath: "/about",
  });

  const stats = [
    { label: "Compagnies partenaires", value: "50+", icon: Bus },
    { label: "Villes desservies", value: "30+", icon: MapPin },
    { label: "Voyageurs satisfaits", value: "100 000+", icon: Users },
    { label: "Pays couverts", value: "8", icon: Globe },
  ];

  const values = [
    {
      icon: Shield,
      title: "Fiabilité",
      desc: "Des partenaires sélectionnés et vérifiés pour garantir des services de qualité à chaque utilisation.",
    },
    {
      icon: Zap,
      title: "Rapidité",
      desc: "Réservation en quelques clics, confirmation instantanée et suivi en temps réel de vos commandes.",
    },
    {
      icon: Star,
      title: "Excellence",
      desc: "Un service client disponible 7j/7 et une plateforme constamment améliorée selon vos retours.",
    },
    {
      icon: CheckCircle2,
      title: "Accessibilité",
      desc: "Une interface simple et intuitive, accessible depuis n'importe quel appareil, sans inscription obligatoire.",
    },
  ];

  const services = [
    {
      icon: Bus,
      title: "Transport interurbain",
      desc: "Réservez vos billets de bus auprès des meilleures compagnies de transport en Afrique de l'Ouest. Voyagez en toute sérénité avec des horaires fiables et des tarifs transparents.",
      color: "bg-orange-100 text-[#E8751A]",
    },
    {
      icon: UtensilsCrossed,
      title: "Restauration en ligne",
      desc: "Commandez vos repas auprès des meilleurs restaurants partenaires. Livraison à domicile ou retrait sur place, avec suivi en temps réel de votre commande.",
      color: "bg-amber-100 text-amber-700",
    },
    {
      icon: Truck,
      title: "Expédition de colis",
      desc: "Envoyez et recevez des colis partout en Afrique de l'Ouest. Des agences d'expédition agréées pour des livraisons sécurisées et rapides.",
      color: "bg-sky-100 text-sky-600",
    },
  ];

  const partners = [
    "UTB", "TSR", "CTM", "SOGEBAF", "STIF", "Trans Ivoire",
    "Rimbo Transport", "CTIC", "STC", "Belvédère Express",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#E8751A] to-[#D06015] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptNiAwaDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NEXUS</h1>
                <p className="text-xs text-white/80">Plateforme NEXUS — Afrique de l'Ouest</p>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1.5">
                <Phone className="h-3.5 w-3.5 text-white" />
                <a href="tel:+2250504921096" className="text-white text-xs font-semibold hover:text-orange-200 transition-colors">+225 0504921096</a>
                <span className="text-white/50 text-xs">/</span>
                <a href="tel:+2250701578857" className="text-white text-xs font-semibold hover:text-orange-200 transition-colors">0701578857</a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-xs"
                onClick={() => navigate("/")}
              >
                ← Retour
              </Button>
            </div>
          </div>
          <div className="text-center pb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md mb-4">
              À propos de NEXUS
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
              La plateforme de référence pour le transport, la restauration et l'expédition en Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                    <s.icon className="h-6 w-6 text-[#E8751A]" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-orange-100 text-[#E8751A] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">Notre mission</span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Connecter les populations d'Afrique de l'Ouest aux services essentiels
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              NEXUS est née d'un constat simple : les habitants d'Afrique de l'Ouest méritent un accès facile, rapide et fiable aux services de mobilité, de restauration et d'expédition. Notre plateforme regroupe les meilleures compagnies locales sous une interface unique.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Fondée par des entrepreneurs ivoiriens passionnés par la technologie et le développement local, NEXUS s'engage à numériser et moderniser les secteurs clés de l'économie informelle tout en soutenant les PME locales.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map((v) => (
              <Card key={v.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 mb-3">
                    <v.icon className="h-5 w-5 text-[#E8751A]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{v.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-orange-100 text-[#E8751A] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Nos services</span>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Tout ce dont vous avez besoin, en un seul endroit</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.title} className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.color} mb-4`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Partenaires */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <span className="inline-block bg-orange-100 text-[#E8751A] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Partenaires NEXUS</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ils nous font confiance</h3>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            NEXUS collabore avec les compagnies les plus reconnues d'Afrique de l'Ouest pour vous offrir le meilleur service.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {partners.map((p) => (
            <div key={p} className="bg-white border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#E8751A] hover:text-[#E8751A] transition-colors shadow-sm">
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#E8751A] to-[#D06015] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous êtes une compagnie de transport, un restaurant ou une agence d'expédition ?
          </h3>
          <p className="text-white/90 mb-8 leading-relaxed">
            Rejoignez NEXUS et accédez à des milliers de clients potentiels. Inscription gratuite, dashboard complet, gestion simplifiée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/register-company")}
              className="bg-white text-[#E8751A] hover:bg-orange-50 font-semibold px-8"
            >
              Inscrire ma compagnie
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-white text-white hover:bg-white/20 font-semibold px-8 bg-transparent"
            >
              Découvrir la plateforme
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8751A]">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">NEXUS</p>
                  <p className="text-gray-500 text-xs">Plateforme NEXUS</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                La plateforme de référence pour le transport, la restauration et l'expédition en Afrique de l'Ouest.
              </p>
              <div className="flex gap-3">
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 hover:bg-[#E8751A] transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 hover:bg-[#E8751A] transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 hover:bg-[#E8751A] transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Nos services</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/")} className="hover:text-[#E8751A] transition-colors flex items-center gap-2"><Bus className="h-3.5 w-3.5" /> Transport interurbain</button></li>
                <li><button onClick={() => navigate("/")} className="hover:text-[#E8751A] transition-colors flex items-center gap-2"><UtensilsCrossed className="h-3.5 w-3.5" /> Restauration en ligne</button></li>
                <li><button onClick={() => navigate("/")} className="hover:text-[#E8751A] transition-colors flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Expédition de colis</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/register-company")} className="hover:text-[#E8751A] transition-colors">Espace compagnies</button></li>
                <li><button onClick={() => navigate("/about")} className="hover:text-[#E8751A] transition-colors text-[#E8751A]">À propos de NEXUS</button></li>
                <li><a href="mailto:clients@nexus.com" className="hover:text-[#E8751A] transition-colors">Nous contacter</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-[#E8751A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Service client</p>
                    <a href="tel:+2250504921096" className="text-white hover:text-[#E8751A] transition-colors block">+225 0504921096</a>
                    <a href="tel:+2250701578857" className="text-white hover:text-[#E8751A] transition-colors block">0701578857</a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-[#E8751A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">E-mail</p>
                    <a href="mailto:clients@nexus.com" className="text-white hover:text-[#E8751A] transition-colors">clients@nexus.com</a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#E8751A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Siège</p>
                    <p className="text-gray-300">Abidjan, Côte d'Ivoire</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© 2026 NEXUS — Tous droits réservés</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[#E8751A]" />
                Afrique de l'Ouest
              </span>
              <span className="text-gray-700">•</span>
              <span>Plateforme NEXUS agréée</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
