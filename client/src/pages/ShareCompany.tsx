/**
 * ShareCompany — Page de partage optimisée pour réseaux sociaux
 * Affiche les détails d'une compagnie avec Open Graph meta tags dynamiques
 * URL: /share/company/:id
 */
import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Building2 } from "lucide-react";

export default function ShareCompany() {
  const params = useParams();
  const companyId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const { data: company, isLoading } = trpc.photos.getCompanyById.useQuery(
    { id: companyId ?? 0 },
    { enabled: !!companyId }
  );

  useEffect(() => {
    if (!isLoading && !company) {
      setLocation("/");
    }
  }, [company, isLoading, setLocation]);

  // Mettre à jour les meta tags dynamiquement
  useEffect(() => {
    if (!company) return;

    const imageUrl = (company as any).galleryImageUrl || company.logoUrl || "";
    const title = `${company.companyName} - NEXUS Partner`;
    const description = `Découvrez ${company.companyName} sur NEXUS - Plateforme de réservation Transport, Restauration & Expédition en Afrique`;

    // Mettre à jour le titre
    document.title = title;

    // Mettre à jour ou créer les meta tags Open Graph
    const updateMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:image", imageUrl);
    updateMetaTag("og:url", window.location.href);
    updateMetaTag("og:type", "business.business");

    // Twitter Card
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateTwitterTag("twitter:title", title);
    updateTwitterTag("twitter:description", description);
    updateTwitterTag("twitter:image", imageUrl);
    updateTwitterTag("twitter:card", "summary_large_image");
  }, [company]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8751A] mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Compagnie non trouvée</p>
        </div>
      </div>
    );
  }

  const imageUrl = (company as any).galleryImageUrl || company.logoUrl || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Image principale */}
        {imageUrl && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={imageUrl}
              alt={company.companyName}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Contenu */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {company.companyName}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 bg-[#E8751A] text-white text-sm font-semibold rounded-full capitalize">
              {company.activityType}
            </span>
          </div>

          {company.description && (
            <p className="text-gray-600 mb-6">{company.description}</p>
          )}

          {/* Informations de contact */}
          <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
            {company.phone && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">Téléphone:</span>
                <a
                  href={`tel:${company.phone}`}
                  className="text-[#E8751A] hover:underline"
                >
                  {company.phone}
                </a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">Email:</span>
                <a
                  href={`mailto:${company.email}`}
                  className="text-[#E8751A] hover:underline"
                >
                  {company.email}
                </a>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">Adresse:</span>
                <span className="text-gray-700">{company.address}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={`/company/${company.id}`}
            className="inline-block px-6 py-3 bg-[#E8751A] text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Voir la fiche complète
          </a>
        </div>

        {/* Badge NEXUS */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Découvrez {company.companyName} et d'autres partenaires sur{" "}
            <a
              href="https://www.nexus.africa"
              className="text-[#E8751A] font-semibold hover:underline"
            >
              NEXUS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
