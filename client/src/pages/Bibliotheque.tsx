import { Link } from "wouter";
import {
  Bus,
  UtensilsCrossed,
  Package,
  Images,
  ArrowLeft,
  Building2,
  Search,
  ShoppingBag,
  Plane,
  Home,
  Ticket,
  Truck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { trpc } from "@/lib/trpc";

const ACTIVITY_LABELS: Record<string, string> = {
  transport: "Transport",
  restauration: "Restauration",
  expedition: "Expédition",
  hotel: "Hôtel",
  boutique: "Boutique",
  agence_voyage: "Agence de Voyage",
  residence_meuble: "Résidence Meublée",
  loisirs: "Loisirs",
  location_vente: "Location & Vente",
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  transport: <Bus className="h-4 w-4" />,
  restauration: <UtensilsCrossed className="h-4 w-4" />,
  expedition: <Package className="h-4 w-4" />,
  hotel: <Building2 className="h-4 w-4" />,
  boutique: <ShoppingBag className="h-4 w-4" />,
  agence_voyage: <Plane className="h-4 w-4" />,
  residence_meuble: <Home className="h-4 w-4" />,
  loisirs: <Ticket className="h-4 w-4" />,
  location_vente: <Truck className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  transport: "bg-blue-50 text-blue-700 border-blue-200",
  restauration: "bg-green-50 text-green-700 border-green-200",
  expedition: "bg-purple-50 text-purple-700 border-purple-200",
  hotel: "bg-amber-50 text-amber-700 border-amber-200",
  boutique: "bg-pink-50 text-pink-700 border-pink-200",
  agence_voyage: "bg-cyan-50 text-cyan-700 border-cyan-200",
  residence_meuble: "bg-orange-50 text-orange-700 border-orange-200",
  loisirs: "bg-indigo-50 text-indigo-700 border-indigo-200",
  location_vente: "bg-red-50 text-red-700 border-red-200",
};

type Company = {
  id: number;
  companyName: string;
  activityType: string;
  logoUrl: string | null;
  countryId: number | null;
  cityId: number | null;
  photoCount: number;
};

export default function Bibliotheque() {
  useSEO({
    title: "Bibliothèque des compagnies — NEXUS",
    description: "Découvrez les photos et galeries des compagnies partenaires NEXUS en Afrique de l'Ouest : transport, restauration et expédition.",
    keywords: "galerie photos compagnies Afrique, bibliothèque NEXUS, compagnies transport restauration",
    canonicalPath: "/bibliotheque",
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data: companies = [], isLoading } = trpc.photos.listCompaniesWithPhotos.useQuery();

  const filtered = (companies as Company[]).filter((c) => {
    const matchSearch = c.companyName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.activityType === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1A1A2E] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E8751A] flex items-center justify-center">
              <Images className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bibliothèque des compagnies</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Découvrez les photos et la vitrine de chaque compagnie partenaire NEXUS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une compagnie..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === f
                    ? "bg-[#E8751A] text-white border-[#E8751A]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#E8751A]/50"
                }`}
              >
                {f === "all" ? "Toutes" : ACTIVITY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune compagnie trouvée</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : "Aucune compagnie active pour l'instant"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {filtered.length} compagnie{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((company) => (
                <Link key={company.id} href={`/bibliotheque/${company.id}`}>
                  <div className="bg-white rounded-xl p-4 border hover:border-[#E8751A]/50 hover:shadow-md transition-all cursor-pointer group">
                    {/* Logo */}
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 mb-3 flex items-center justify-center border border-orange-100">
                      {company.logoUrl && company.logoUrl !== "NULL" && company.logoUrl.trim() ? (
                        <img
                          src={company.logoUrl}
                          alt={company.companyName}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-orange-400">
                          <Building2 className="h-10 w-10 mb-1" />
                          <span className="text-xs font-medium">Logo</span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#E8751A] transition-colors">
                      {company.companyName}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${ACTIVITY_COLORS[company.activityType] ?? ""}`}
                      >
                        {ACTIVITY_ICONS[company.activityType]}
                        {ACTIVITY_LABELS[company.activityType] ?? company.activityType}
                      </Badge>
                      {company.photoCount > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Images className="h-3 w-3" />
                          {company.photoCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
