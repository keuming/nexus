import { Badge } from "@/components/ui/badge";
import ShareButton from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import {
  ArrowDownUp,
  Building2,
  ChefHat,
  Globe,
  Hotel,
  MapPin,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";


export default function PublicHome() {
  const [, setLocation] = useLocation();
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [type, setType] = useState<"hotel" | "restaurant" | "">("")
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "rating" | "popularity">("default");

  const { data: countries } = trpc.geo.countries.useQuery();
  const { data: cities } = trpc.geo.cities.useQuery(
    { countryId: countryId! },
    { enabled: !!countryId }
  );

  const maxPriceValue = maxPriceInput ? parseFloat(maxPriceInput) : undefined;

  const { data: hotels, isLoading } = trpc.publicHotels.search.useQuery(
    {
      countryId: countryId ?? undefined,
      cityId: cityId ?? undefined,
      type: type || undefined,
      maxPrice: maxPriceValue && maxPriceValue > 0 ? maxPriceValue : undefined,
    },
    { enabled: searched }
  );

  function handleSearch() {
    setSearched(true);
  }

  function handleCountryChange(val: string) {
    setCountryId(val === "all" ? null : parseInt(val));
    setCityId(null);
    setSearched(false);
  }

  function handleCityChange(val: string) {
    setCityId(val === "all" ? null : parseInt(val));
    setSearched(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] via-[oklch(0.22_0.06_250)] to-[oklch(0.15_0.04_250)]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                HUB_RESA
              </span>
              <p className="text-xs text-white/50 leading-none">Plateforme hôtelière</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setLocation("/register")}
            >
              Inscrire mon établissement
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
              onClick={() => setLocation("/dashboard")}
            >
              Espace gérant
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Decorative stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Trouvez votre
            <span className="text-amber-400"> hébergement idéal</span>
          </h1>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
            Découvrez les meilleurs hôtels et restaurants en Afrique et dans le monde. Réservez en quelques clics.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Search Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Pays
                </label>
                <Select onValueChange={handleCountryChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {countries?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Ville
                </label>
                <Select onValueChange={handleCityChange} disabled={!countryId}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11 disabled:opacity-50">
                    <SelectValue placeholder={countryId ? "Sélectionner une ville" : "Choisir un pays d'abord"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                  <Hotel className="h-3.5 w-3.5" /> Type
                </label>
                <Select onValueChange={(v) => { setType(v === "all" ? "" : v as any); setSearched(false); }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue placeholder="Hôtel ou Restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="hotel">🏨 Hôtel</SelectItem>
                    <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget row */}
            <div className="mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" /> Budget max — coût de la nuitée (FCFA)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    placeholder="Ex : 5000 — affiche les chambres ≤ ce montant"
                    value={maxPriceInput}
                    onChange={(e) => { setMaxPriceInput(e.target.value); setSearched(false); }}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 pr-16"
                  />
                  {maxPriceInput && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-semibold">
                      ≤ {parseInt(maxPriceInput).toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/40">
                  Laissez vide pour afficher tous les établissements sans limite de budget.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 text-base font-semibold shadow-lg gap-2"
            >
              <Search className="h-5 w-5" />
              Rechercher
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      {searched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isLoading ? "Recherche en cours..." : `${hotels?.length ?? 0} établissement${(hotels?.length ?? 0) > 1 ? "s" : ""} trouvé${(hotels?.length ?? 0) > 1 ? "s" : ""}`}
            </h2>

            {/* Sort selector */}
            {!isLoading && !!hotels?.length && (
              <div className="flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-white/50 shrink-0" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 w-52 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Tri par défaut (A-Z)</SelectItem>
                    <SelectItem value="price_asc">Prix croissant ↑</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant ↓</SelectItem>
                    <SelectItem value="rating">Meilleure note ★</SelectItem>
                    <SelectItem value="popularity">Popularité (nb avis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white/10 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : !hotels?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50">
              <Building2 className="h-20 w-20 mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun établissement trouvé</p>
              <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
              <Button
                className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setLocation("/register")}
              >
                Inscrire mon établissement
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...hotels].sort((a, b) => {
                if (sortBy === "price_asc") return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
                if (sortBy === "price_desc") return (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity);
                if (sortBy === "rating") return (b.avgRating ?? 0) - (a.avgRating ?? 0);
                if (sortBy === "popularity") return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
                return a.hotelName.localeCompare(b.hotelName);
              }).map(hotel => (
                <HotelCard key={hotel.id} hotel={hotel} onClick={() => setLocation(`/hotel/${hotel.id}`)} />
              ))}
            </div>
          )}
        </section>
      )}



      {/* Features */}
      {!searched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Hotel className="h-7 w-7 text-amber-400" />, title: "Hôtels & Résidences", desc: "Des hébergements de qualité pour tous vos séjours professionnels ou touristiques." },
              { icon: <Utensils className="h-7 w-7 text-amber-400" />, title: "Restaurants", desc: "Découvrez les meilleures tables et saveurs culinaires de chaque destination." },
              { icon: <Users className="h-7 w-7 text-amber-400" />, title: "Pour les gérants", desc: "Inscrivez votre établissement et gérez vos réservations depuis un tableau de bord complet." },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        <p>© 2026 HUB_RESA — Plateforme de gestion hôtelière</p>
      </footer>
    </div>
  );
}

function HotelCard({ hotel, onClick }: { hotel: any; onClick: () => void }) {
  const isRestaurant = hotel.type === "restaurant";
  return (
    <Card
      className="bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      {/* Logo / Placeholder */}
      <div className="h-40 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative overflow-hidden">
        {hotel.logoUrl ? (
          <img src={hotel.logoUrl} alt={hotel.hotelName} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isRestaurant
              ? <ChefHat className="h-12 w-12 text-amber-400/60" />
              : <Building2 className="h-12 w-12 text-amber-400/60" />
            }
            <span className="text-xs text-white/30">Aucun logo</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={`text-xs ${isRestaurant ? "bg-orange-500/80" : "bg-blue-500/80"} text-white border-0`}>
            {isRestaurant ? "🍽️ Restaurant" : "🏨 Hôtel"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">
          {hotel.hotelName}
        </h3>

        {/* Stars */}
        {!isRestaurant && hotel.stars && (
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[hotel.cityName, hotel.countryFlag, hotel.countryName].filter(Boolean).join(" · ")}
          </span>
        </div>

        {/* Description */}
        {hotel.description && (
          <p className="text-xs text-white/40 line-clamp-2 mb-3">{hotel.description}</p>
        )}

        {/* Rating + reviews */}
        {hotel.avgRating != null ? (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`h-3 w-3 ${s <= Math.round(hotel.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
              ))}
            </div>
            <span className="text-xs text-amber-400 font-semibold">{hotel.avgRating.toFixed(1)}</span>
            <span className="text-xs text-white/40 flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />{hotel.reviewCount} avis
            </span>
          </div>
        ) : hotel.reviewCount === 0 ? (
          <div className="flex items-center gap-1 mb-3 text-xs text-white/30">
            <MessageSquare className="h-3 w-3" />
            <span>Aucun avis</span>
          </div>
        ) : null}

        {/* Min price badge */}
        {hotel.minPrice != null && (
          <div className="flex items-center gap-1.5 mb-3">
            <Wallet className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-semibold">
              À partir de {parseInt(hotel.minPrice).toLocaleString("fr-FR")} FCFA / nuit
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 transition-all">
            Voir les chambres
          </Button>
          <ShareButton
            title={hotel.hotelName}
            description={hotel.description || `Découvrez ${hotel.hotelName} sur HUB_RESA`}
            url={typeof window !== 'undefined' ? `${window.location.origin}/hotel/${hotel.id}` : ''}
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white hover:bg-white/10 border border-white/20 px-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
