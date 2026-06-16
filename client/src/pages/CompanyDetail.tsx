import { useLocation } from "wouter";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { GalleryCarousel } from "@/components/GalleryCarousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe, Share2 } from "lucide-react";


export default function CompanyDetail() {
  const params = useParams();
  const companyId = parseInt(params.id || "0");

  const { data: company, isLoading: loadingCompany } = trpc.transport.public.company.useQuery(
    { id: companyId },
    { enabled: companyId > 0 }
  );

  const { data: galleryImages = [], isLoading: loadingGallery } = trpc.transport.public.gallery.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  if (loadingCompany || loadingGallery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Compagnie non trouvée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              La compagnie que vous recherchez n'existe pas ou a été supprimée.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-white">
                {company.companyName?.[0]?.toUpperCase() || "?"}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.companyName}</h1>
                  <p className="text-gray-600">{company.description}</p>
                </div>
                {/* Bouton Partager */}
                <a
                  href={`/share/company/${company.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#E8751A] text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </a>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm mt-4">
                {company.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <span>{company.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📸 Galerie</h2>
            <GalleryCarousel images={galleryImages} companyName={company.companyName} />
          </div>
        )}

        {/* Activity Type */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type d'activité</p>
              <p className="font-medium text-gray-900 capitalize">
                {company.activityType?.replace(/_/g, " ") || "Non spécifié"}
              </p>
            </div>
            {company.managerName && (
              <div>
                <p className="text-sm text-gray-600">Directeur</p>
                <p className="font-medium text-gray-900">{company.managerName}</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
