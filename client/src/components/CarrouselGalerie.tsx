/**
 * CarrouselGalerie — Section "Nos compagnies en images" sur la page d'accueil
 * Affiche une grille de compagnies avec filtrage par catégorie (TOUS + types d'activité)
 * Le nom de la compagnie est toujours visible en bas de chaque carte
 */
import { useState, useMemo, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Images, Building2 } from "lucide-react";
import { CompanyBookingModal } from "./CompanyBookingModal";

const ACTIVITY_TYPES = [
  "all",
  "transport",
  "restauration",
  "expedition",
  "hotel",
  "boutique",
  "agence_voyage",
  "residence_meuble",
  "loisirs",
  "location_vente",
] as const;

type ActivityFilter = (typeof ACTIVITY_TYPES)[number];

interface CarrouselGalerieProps {
  initialFilter?: string;
}

export default function CarrouselGalerie({ initialFilter = "all" }: CarrouselGalerieProps) {
  const { t } = useI18n();
  const { data: companies = [], isLoading: loadingCompanies } =
    trpc.photos.companiesForCarousel.useQuery();

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>(
    (initialFilter as ActivityFilter) || "all"
  );
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const isLoading = loadingCompanies;

  // Mettre à jour le filtre quand initialFilter change
  useEffect(() => {
    if (initialFilter && initialFilter !== "all") {
      setActiveFilter(initialFilter as ActivityFilter);
    } else {
      setActiveFilter("all");
    }
  }, [initialFilter]);

  // Afficher tous les types d'activité (même sans compagnies)
  const availableCategories = useMemo(() => {
    return ACTIVITY_TYPES;
  }, []);

  // Filtrer les compagnies selon la catégorie active
  const filteredCompanies = useMemo(() => {
    if (activeFilter === "all") return companies;
    return companies.filter((c: any) => c.activityType === activeFilter);
  }, [companies, activeFilter]);

  // Afficher max 20 compagnies
  const displayedCompanies = filteredCompanies.slice(0, 20);

  // Afficher un placeholder pendant le chargement
  if (isLoading) {
    return (
      <section className="py-14 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded bg-orange-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-orange-100 animate-pulse" />
          </div>
          <div className="h-8 w-64 rounded bg-gray-200 animate-pulse mb-8" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-200 animate-pulse aspect-square"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Aucune compagnie inscrite : ne rien afficher
  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="py-14 bg-gradient-to-b from-gray-50 to-white overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 w-full overflow-hidden">
        {/* Titre avec bouton VOIR PLUS */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Images className="h-5 w-5 text-[#E8751A]" />
              <span className="text-sm font-semibold text-[#E8751A] uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t("carousel", "gallery")}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {t("carousel", "title")}
            </h2>
            <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {t("carousel", "subtitle")}
            </p>
          </div>
          <Link
            href="/bibliotheque"
            className="hidden sm:flex items-center gap-1 px-6 py-2 text-sm text-[#E8751A] hover:bg-[#E8751A] hover:text-white font-medium rounded-lg border border-[#E8751A] transition-all duration-300"
          >
            {t("common", "seeMore")} →
          </Link>
        </div>

        {/* Onglets de catégories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === cat
                  ? "bg-[#E8751A] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("carousel", cat as any) || cat}
            </button>
          ))}
        </div>

        {/* Grille 5 colonnes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full overflow-hidden">
          {displayedCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                setSelectedCompany(company);
                setBookingModalOpen(true);
              }}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-left w-full"
            >
              {/* Carte avec image */}
              {(company as any).galleryImageUrl ? (
                <div className="w-full relative overflow-hidden rounded-xl" style={{ paddingBottom: '100%' }}>
                  {/* Image avec zoom pour couper les bandes noires intégrées */}
                  <img
                    src={(company as any).galleryImageUrl}
                    alt={company.companyName ?? "Compagnie"}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: 'cover',
                      transform: 'scale(1.35)',
                      transformOrigin: 'center center',
                    }}
                  />
                  {/* Dégradé permanent en bas pour le nom */}
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-3">
                    <h3 className="text-white font-semibold text-base sm:text-sm leading-tight line-clamp-2 drop-shadow-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {company.companyName ?? "Compagnie"}
                    </h3>
                  </div>
                </div>
              ) : (
                /* Carte sans image — fond noir avec logo/initiale */
                <div className="w-full aspect-square flex flex-col items-center justify-center p-4 text-center bg-gray-900 rounded-xl group-hover:shadow-lg transition-all duration-300 cursor-pointer">
                  {/* Logo ou initiale */}
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.companyName ?? "Logo"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#E8751A] flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300">
                      {(company.companyName ?? "?")[0].toUpperCase()}
                    </div>
                  )}

                  {/* Nom de la compagnie — toujours visible */}
                  <h3 className="text-white font-semibold text-base sm:text-sm leading-tight line-clamp-2 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {company.companyName ?? "Compagnie"}
                  </h3>


                </div>
              )}
            </button>
          ))}
        </div>

        {/* Booking Modal */}
        <CompanyBookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          company={selectedCompany}
        />

        {/* Message si aucune compagnie dans la catégorie */}
        {displayedCompanies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t("carousel", "noPartners")}</p>
          </div>
        )}

        {/* Lien mobile VOIR PLUS */}
        <div className="sm:hidden text-center mt-8">
          <Link
            href="/bibliotheque"
            className="inline-flex items-center gap-1 px-6 py-2 text-sm text-[#E8751A] hover:bg-[#E8751A] hover:text-white font-medium rounded-lg border border-[#E8751A] transition-all duration-300"
          >
            {t("common", "seeMore")} →
          </Link>
        </div>

        {/* Note: Lien vers CompanyDetail toujours disponible via /company/:id */}
      </div>
    </section>
  );
}
