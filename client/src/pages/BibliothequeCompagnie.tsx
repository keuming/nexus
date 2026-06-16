import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Building2,
  Images,
  Bus,
  UtensilsCrossed,
  Package,
  ZoomIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";

const ACTIVITY_LABELS: Record<string, string> = {
  transport: "Transport",
  restauration: "Restauration",
  expedition: "Expédition",
};
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  transport: <Bus className="h-4 w-4" />,
  restauration: <UtensilsCrossed className="h-4 w-4" />,
  expedition: <Package className="h-4 w-4" />,
};

type Photo = {
  id: number;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
};

export default function BibliothequeCompagnie() {
  const params = useParams<{ id: string }>();
  const companyId = parseInt(params.id ?? "0", 10);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [seoTitle, setSeoTitle] = useState(`Galerie compagnie — Bibliothèque NEXUS`);
  useSEO({
    title: seoTitle,
    description: "Découvrez la galerie photos de cette compagnie partenaire NEXUS. Photos officielles avec légendes.",
    keywords: "galerie photos compagnie NEXUS, photos transport Afrique",
    canonicalPath: `/bibliotheque/${params.id}`,
  });

  const { data, isLoading } = trpc.photos.getCompanyGallery.useQuery(
    { companyId },
    { enabled: !!companyId && !isNaN(companyId) }
  );

  const company = data?.company;
  const photos = (data?.photos ?? []) as Photo[];

  // Mettre à jour le titre SEO quand les données arrivent
  useEffect(() => {
    if (company?.companyName) {
      setSeoTitle(`${company.companyName} — Galerie NEXUS`);
    }
  }, [company?.companyName]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E8751A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Compagnie introuvable</p>
          <Link href="/bibliotheque" className="text-[#E8751A] hover:underline text-sm mt-2 inline-block">
            ← Retour à la bibliothèque
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compagnie */}
      <div className="bg-[#1A1A2E] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque
          </Link>

          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.companyName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building2 className="h-10 w-10 text-white/40" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{company.companyName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="border-white/30 text-white/80 text-xs flex items-center gap-1"
                >
                  {ACTIVITY_ICONS[company.activityType]}
                  {ACTIVITY_LABELS[company.activityType] ?? company.activityType}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Galerie */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <Images className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucune photo publiée</p>
            <p className="text-gray-400 text-sm mt-1">
              Cette compagnie n'a pas encore ajouté de photos à sa bibliothèque.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-zoom-in shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? "Photo"}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay avec légende */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex items-center justify-between w-full">
                    {photo.caption ? (
                      <p className="text-white text-xs font-medium truncate flex-1 mr-2">
                        {photo.caption}
                      </p>
                    ) : (
                      <span />
                    )}
                    <ZoomIn className="h-5 w-5 text-white flex-shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-white/10">
          <DialogHeader className="px-4 pt-2">
            <DialogTitle className="text-white/80 text-sm font-normal">
              {lightbox?.caption || company.companyName}
            </DialogTitle>
          </DialogHeader>
          {lightbox && (
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? "Photo"}
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
