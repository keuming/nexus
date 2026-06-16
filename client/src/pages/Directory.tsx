import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Star, MapPin, Phone, Mail, Images, X, ChevronLeft, ChevronRight, ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { MediconnectAdBanner } from "@/components/MediconnectAdBanner";

type ActivityType = "all" | "transport" | "restauration" | "expedition";

const ACTIVITY_LABELS: Record<string, string> = {
  transport: "Transport",
  restauration: "Restauration",
  expedition: "Expédition",
};

const ACTIVITY_COLORS: Record<string, string> = {
  transport: "bg-orange-100 text-orange-700",
  restauration: "bg-green-100 text-green-700",
  expedition: "bg-sky-100 text-sky-700",
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function GalleryModal({
  companyId,
  companyName,
  open,
  onClose,
}: {
  companyId: number;
  companyName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const { data: images = [] } = trpc.transport.public.gallery.useQuery({ companyId }, { enabled: open });

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-[#E8751A]" />
            Galerie — {companyName}
          </DialogTitle>
        </DialogHeader>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Images className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Aucune image disponible</p>
          </div>
        ) : (
          <div className="relative bg-black">
            <img
              src={images[current]?.imageUrl}
              alt={images[current]?.caption ?? `Image ${current + 1}`}
              className="w-full max-h-[60vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {images[current]?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-4 py-2">
                {images[current].caption}
              </div>
            )}
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {current + 1} / {images.length}
            </div>
          </div>
        )}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-4 bg-gray-50">
              {images.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`shrink-0 h-14 w-14 rounded overflow-hidden border-2 transition-all ${i === current ? "border-[#E8751A]" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewModal({
  companyId, companyName, open, onClose
}: { companyId: number; companyName: string; open: boolean; onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();

  const createReview = trpc.transport.public.createReview.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.transport.public.averageRating.invalidate({ companyId });
      utils.transport.public.reviews.invalidate({ companyId });
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setStars(0);
        setAuthorName("");
        setComment("");
      }, 2000);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-[#E8751A]" />
            Laisser un avis — {companyName}
          </DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-green-700">Merci pour votre avis !</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Votre note *</Label>
              <div className="flex gap-1 mt-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setStars(n)}
                    className="p-0.5"
                  >
                    <Star className={`h-7 w-7 transition-colors ${
                      n <= (hover || stars) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Votre nom *</Label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Jean Koné"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Commentaire</Label>
              <Textarea
                className="mt-1"
                placeholder="Partagez votre expérience..."
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-[#E8751A] hover:bg-[#C96020] text-white"
              disabled={stars === 0 || !authorName.trim() || createReview.isPending}
              onClick={() => createReview.mutate({
                companyId, activityType: "transport",
                rating: stars, authorName: authorName.trim(), comment: comment.trim() || undefined
              })}
            >
              {createReview.isPending ? "Envoi..." : "Publier mon avis"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CompanyCard({ company }: { company: any }) {
  const [showGallery, setShowGallery] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [, navigate] = useLocation();
  const { data: rating } = trpc.transport.public.averageRating.useQuery({ companyId: company.id as number });
  const { data: bannerPhoto } = trpc.photos.getFirstPhoto.useQuery({ companyId: company.id as number });

  const activityType = company.activityType ?? "transport";
  const directLink = `/?company=${company.id}&activity=${activityType}`;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* Bannière photo galerie */}
        {bannerPhoto && (
          <div className="relative h-36 overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
            <img
              src={bannerPhoto.url}
              alt={bannerPhoto.caption ?? company.companyName}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {bannerPhoto.caption && (
              <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-medium truncate drop-shadow">
                {bannerPhoto.caption}
              </p>
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Images className="h-3 w-3" />
              Photos
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 flex items-start gap-4">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.companyName} className="h-14 w-14 rounded-xl object-cover shrink-0 border" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#E8751A] to-[#C96020] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">{company.companyName[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{company.companyName}</h3>
            <Badge className={`text-xs mt-1 ${ACTIVITY_COLORS[activityType] ?? "bg-gray-100 text-gray-600"}`} variant="secondary">
              {ACTIVITY_LABELS[activityType] ?? activityType}
            </Badge>
            {rating && rating.count > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <StarRating value={rating.avg} />
                <span className="text-xs text-gray-500">{rating.avg.toFixed(1)} ({rating.count} avis)</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-5 pb-3 space-y-1.5 text-sm text-gray-600">
          {company.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>{company.phone}</span>
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{company.email}</span>
            </div>
          )}
          {company.description && (
            <p className="text-xs text-gray-500 line-clamp-2 pt-1">{company.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-[#E8751A] hover:bg-[#C96020] text-white text-xs"
            onClick={() => navigate(directLink)}
          >
            Voir les offres
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1"
            onClick={() => setShowGallery(true)}
          >
            <Images className="h-3.5 w-3.5" />
            Photos
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowReview(true)}
          >
            <Star className="h-3.5 w-3.5" />
            Avis
          </Button>
        </div>
      </motion.div>

      <GalleryModal
        companyId={company.id}
        companyName={company.companyName}
        open={showGallery}
        onClose={() => setShowGallery(false)}
      />
      <ReviewModal
        companyId={company.id}
        companyName={company.companyName}
        open={showReview}
        onClose={() => setShowReview(false)}
      />
    </>
  );
}

export default function Directory() {
  useSEO({
    title: "Répertoire des compagnies — HUB_RESA",
    description: "Trouvez toutes les compagnies partenaires HUB_RESA en Afrique de l'Ouest : transport, restauration et expédition. Horaires, tarifs et contacts.",
    keywords: "répertoire compagnies transport Afrique, annuaire compagnies bus, HUB RESA partenaires",
    canonicalPath: "/directory",
  });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityType>("all");

  const { data: companies = [], isLoading } = trpc.transport.public.directory.useQuery();

  const filtered = useMemo(() => {
    return companies.filter((c: any) => {
      const matchActivity = filter === "all" || (c.activityType ?? "transport") === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || c.companyName.toLowerCase().includes(q) || (c.cityId?.toString() ?? "").includes(q);
      return matchActivity && matchSearch;
    });
  }, [companies, filter, search]);

  const counts = useMemo(() => {
    const all = companies.length;
    const transport = companies.filter((c: any) => (c.activityType ?? "transport") === "transport").length;
    const restauration = companies.filter((c: any) => c.activityType === "restauration").length;
    const expedition = companies.filter((c: any) => c.activityType === "expedition").length;
    return { all, transport, restauration, expedition };
  }, [companies]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Répertoire des compagnies</h1>
            <p className="text-xs text-gray-500">{companies.length} compagnies partenaires HUB_RESA</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une compagnie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "transport", "restauration", "expedition"] as ActivityType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={filter === type ? "default" : "outline"}
                className={filter === type ? "bg-[#E8751A] hover:bg-[#C96020] text-white" : ""}
                onClick={() => setFilter(type)}
              >
                {type === "all" ? `Tous (${counts.all})` : `${ACTIVITY_LABELS[type]} (${counts[type]})`}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid avec bannières publicitaires */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <Search className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Aucune compagnie trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Bannière gauche */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <MediconnectAdBanner position="left" />
              </div>
            </div>

            {/* Grille des compagnies */}
            <motion.div
              layout
              className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <AnimatePresence>
                {filtered.map((company: any) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Bannière droite */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <MediconnectAdBanner position="right" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
