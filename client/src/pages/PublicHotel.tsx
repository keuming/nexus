import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Calendar,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  Gift,
  Mail,
  MapPin,
  MessageSquare,
  Percent,
  Phone,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
  Wifi,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

function formatPrice(price: string | null | undefined) {
  if (!price) return "—";
  return new Intl.NumberFormat("fr-FR").format(parseFloat(price)) + " FCFA";
}

export default function PublicHotel() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const hotelId = parseInt(params.id ?? "0");
  const [bookingRoom, setBookingRoom] = useState<any>(null);

  // Date availability filter
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [filterCheckIn, setFilterCheckIn] = useState("");
  const [filterCheckOut, setFilterCheckOut] = useState("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);

  const { data: hotel, isLoading: hotelLoading } = trpc.publicHotels.getById.useQuery(
    { id: hotelId },
    { enabled: !!hotelId }
  );

  // When dates are set, use availability query; otherwise show all rooms
  const { data: availableRooms, isLoading: availableLoading } = trpc.publicHotels.getAvailableRooms.useQuery(
    { hotelId, checkIn: filterCheckIn, checkOut: filterCheckOut },
    { enabled: !!hotelId && dateFilterApplied && !!filterCheckIn && !!filterCheckOut }
  );
  const { data: allRooms, isLoading: allRoomsLoading } = trpc.publicHotels.getRooms.useQuery(
    { hotelId },
    { enabled: !!hotelId }
  );
  const rooms = dateFilterApplied ? availableRooms : allRooms;
  const roomsLoading = dateFilterApplied ? availableLoading : allRoomsLoading;

  function handleDateFilter() {
    if (!filterCheckIn || !filterCheckOut) return;
    if (new Date(filterCheckIn) >= new Date(filterCheckOut)) {
      return;
    }
    setDateFilterApplied(true);
  }
  function handleClearDateFilter() {
    setFilterCheckIn("");
    setFilterCheckOut("");
    setDateFilterApplied(false);
  }

  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] to-[oklch(0.15_0.04_250)] flex items-center justify-center">
        <div className="text-white/50">Chargement...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] to-[oklch(0.15_0.04_250)] flex flex-col items-center justify-center gap-4">
        <Building2 className="h-16 w-16 text-white/20" />
        <p className="text-white/50">Établissement introuvable</p>
        <Button onClick={() => setLocation("/")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const isRestaurant = hotel.type === "restaurant";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] via-[oklch(0.22_0.06_250)] to-[oklch(0.15_0.04_250)]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>NEXUS</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hotel Header Card */}
        <Card className="bg-white/10 border-white/20 mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Logo */}
              <div className="sm:w-56 h-48 sm:h-auto bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0">
                {hotel.logoUrl ? (
                  <img src={hotel.logoUrl} alt={hotel.hotelName} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6">
                    {isRestaurant
                      ? <ChefHat className="h-16 w-16 text-amber-400/60" />
                      : <Building2 className="h-16 w-16 text-amber-400/60" />
                    }
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge className={`text-xs mb-2 ${isRestaurant ? "bg-orange-500/80" : "bg-blue-500/80"} text-white border-0`}>
                      {isRestaurant ? "🍽️ Restaurant" : "🏨 Hôtel"}
                    </Badge>
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {hotel.hotelName}
                    </h1>
                  </div>
                  {/* Share button */}
                  <ShareButton
                    title={hotel.hotelName}
                    description={hotel.description || `Découvrez ${hotel.hotelName} sur NEXUS`}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 border border-white/20"
                  />
                </div>

                {/* Stars */}
                {!isRestaurant && hotel.stars && (
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-1.5 text-sm text-white/60 mb-4">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[hotel.cityName, hotel.countryFlag, hotel.countryName].filter(Boolean).join(" · ")}</span>
                </div>

                {/* Description */}
                {hotel.description && (
                  <p className="text-sm text-white/50 mb-4">{hotel.description}</p>
                )}

                {/* Contact */}
                <div className="flex flex-wrap gap-4 text-sm text-white/50">
                  {hotel.managerName && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{hotel.managerName}</span>
                    </div>
                  )}
                  {hotel.phone && (
                    <a href={`tel:${hotel.phone}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{hotel.phone}</span>
                    </a>
                  )}
                  {hotel.email && (
                    <a href={`mailto:${hotel.email}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{hotel.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              <BedDouble className="h-5 w-5 text-amber-400" />
              Chambres {dateFilterApplied ? "disponibles" : ""}
              {rooms && <span className="text-sm font-normal text-white/40">({rooms.length} chambre{rooms.length > 1 ? "s" : ""})</span>}
            </h2>
          </div>
          {/* Date availability filter */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-white/60 mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              Filtrer par disponibilité
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-white/50">Arrivée</label>
                <Input
                  type="date"
                  value={filterCheckIn}
                  min={today}
                  onChange={(e) => { setFilterCheckIn(e.target.value); setDateFilterApplied(false); }}
                  className="bg-white/10 border-white/20 text-white h-10 [color-scheme:dark]"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-white/50">Départ</label>
                <Input
                  type="date"
                  value={filterCheckOut}
                  min={filterCheckIn || today}
                  onChange={(e) => { setFilterCheckOut(e.target.value); setDateFilterApplied(false); }}
                  className="bg-white/10 border-white/20 text-white h-10 [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDateFilter}
                  disabled={!filterCheckIn || !filterCheckOut || new Date(filterCheckIn) >= new Date(filterCheckOut)}
                  className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-4"
                >
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Vérifier
                </Button>
                {dateFilterApplied && (
                  <Button
                    onClick={handleClearDateFilter}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 h-10 px-3"
                  >
                    Tout afficher
                  </Button>
                )}
              </div>
            </div>
            {dateFilterApplied && filterCheckIn && filterCheckOut && (
              <p className="text-xs text-amber-400 mt-2">
                Chambres disponibles du {new Date(filterCheckIn).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} au {new Date(filterCheckOut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
              </p>
            )}
          </div>

          {roomsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="bg-white/10 rounded-xl h-48 animate-pulse" />)}
            </div>
          ) : !rooms?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <BedDouble className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-base">
                {dateFilterApplied
                  ? "Aucune chambre libre pour ces dates — essayez d'autres dates."
                  : "Aucune chambre disponible pour le moment"}
              </p>
              {dateFilterApplied && (
                <Button
                  onClick={handleClearDateFilter}
                  variant="outline"
                  className="mt-4 border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                  size="sm"
                >
                  Voir toutes les chambres
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <RoomCard key={room.id} room={room} onBook={() => setBookingRoom(room)} />
              ))}
            </div>
          )}
        </div>

        {/* Special Offers Section */}
        <OffresSection hotelProfileId={hotelId} />

        {/* Reviews Section */}
        <ReviewsSection hotelProfileId={hotelId} />
      </div>

      {/* Booking Modal */}
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          hotel={hotel}
          onClose={() => setBookingRoom(null)}
        />
      )}
    </div>
  );
}

function RoomCard({ room, onBook }: { room: any; onBook: () => void }) {
  const price = room.priceOverride ?? room.basePrice;
  const [photoIdx, setPhotoIdx] = useState(0);
  const { data: photos = [] } = trpc.roomPhotos.list.useQuery({ roomId: room.id });
  const amenities = (() => {
    try { return JSON.parse(room.amenities ?? "[]") as string[]; }
    catch { return []; }
  })();

  return (
    <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-all group overflow-hidden">
      {/* Photo Carousel */}
      {photos.length > 0 && (
        <div className="relative w-full h-44 overflow-hidden">
          <img
            src={photos[photoIdx]?.url}
            alt={photos[photoIdx]?.caption ?? `Chambre ${room.number}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx - 1 + photos.length) % photos.length); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx + 1) % photos.length); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {photos.map((_: any, i: number) => (
                  <button
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === photoIdx ? "bg-white scale-125" : "bg-white/50"
                    }`}
                    onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                  />
                ))}
              </div>
            </>
          )}
          {/* Badges superposés sur la photo */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {room.activeOffers?.slice(0, 2).map((offer: any) => (
              <span
                key={offer.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg animate-pulse"
                style={{ animationDuration: "2s" }}
              >
                <Gift className="h-3 w-3" />
                {offer.badgeLabel ||
                  (offer.discountType === "percent"
                    ? `-${parseFloat(offer.discountValue)}%`
                    : `-${parseFloat(offer.discountValue).toLocaleString("fr-FR")} FCFA`)}
              </span>
            ))}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className="bg-emerald-500/80 text-white border-0 text-xs backdrop-blur-sm">Disponible</Badge>
          </div>
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-white text-base">Chambre {room.number}</h3>
            <p className="text-sm text-amber-400 font-medium">{room.typeName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {photos.length === 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">Disponible</Badge>
            )}
            {photos.length === 0 && room.activeOffers?.slice(0, 1).map((offer: any) => (
              <span
                key={offer.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm"
              >
                <Gift className="h-3 w-3" />
                {offer.badgeLabel ||
                  (offer.discountType === "percent"
                    ? `-${parseFloat(offer.discountValue)}%`
                    : `-${parseFloat(offer.discountValue).toLocaleString("fr-FR")} FCFA`)}
              </span>
            ))}
          </div>
        </div>

        {room.typeDescription && (
          <p className="text-xs text-white/40 mb-3 line-clamp-2">{room.typeDescription}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-white/50 mb-3">
          {room.capacity && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{room.capacity} pers.</span>
            </div>
          )}
          {room.floor && (
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              <span>Étage {room.floor}</span>
            </div>
          )}
        </div>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.slice(0, 3).map((a: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs bg-white/10 text-white/50 border-0">
                {a}
              </Badge>
            ))}
            {amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-white/10 text-white/50 border-0">
                +{amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <span className="text-lg font-bold text-amber-400">{formatPrice(price)}</span>
            <span className="text-xs text-white/40"> / nuit</span>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={onBook}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Réserver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingModal({ room, hotel, onClose }: { room: any; hotel: any; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const createClientMutation = trpc.clients.create.useMutation();
  const createReservationMutation = trpc.reservations.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.checkIn || !form.checkOut) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (new Date(form.checkIn) >= new Date(form.checkOut)) {
      toast.error("La date de départ doit être après la date d'arrivée");
      return;
    }

    // Create or find client
    let clientId: number;
    try {
      const client = await createClientMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      clientId = client!.id;
    } catch {
      toast.error("Erreur lors de la création du profil client");
      return;
    }

    const nights = Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const price = parseFloat(room.priceOverride ?? room.basePrice ?? "0");
    const total = (price * nights).toString();

    createReservationMutation.mutate({
      clientId,
      roomId: room.id,
      checkInDate: form.checkIn,
      checkOutDate: form.checkOut,
      totalAmount: total,
      notes: form.notes || undefined,
      status: "en_attente",
    });
  }

  const isPending = createClientMutation.isPending || createReservationMutation.isPending;

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const price = parseFloat(room.priceOverride ?? room.basePrice ?? "0");
  const total = price * nights;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted ? "Réservation confirmée !" : `Réserver — Chambre ${room.number}`}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">Demande envoyée !</p>
            <p className="text-sm text-muted-foreground mb-2">
              Votre demande de réservation pour la chambre <strong>{room.number}</strong> à <strong>{hotel.hotelName}</strong> a bien été enregistrée.
            </p>
            <p className="text-xs text-muted-foreground mb-6">L'établissement vous contactera pour confirmer.</p>
            <Button onClick={onClose} className="w-full">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room Summary */}
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground">{hotel.hotelName} — Chambre {room.number}</p>
              <p className="text-muted-foreground text-xs">{room.typeName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Arrivée *</Label>
                <Input type="date" value={form.checkIn} onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))} min={new Date().toISOString().split("T")[0]} required />
              </div>
              <div className="space-y-1.5">
                <Label>Départ *</Label>
                <Input type="date" value={form.checkOut} onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))} min={form.checkIn || new Date().toISOString().split("T")[0]} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes / Demandes spéciales</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optionnel" />
            </div>

            {/* Price Summary */}
            {nights > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>{formatPrice(room.priceOverride ?? room.basePrice)} × {nights} nuit{nights > 1 ? "s" : ""}</span>
                  <span>{formatPrice(total.toString())}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-amber-200 dark:border-amber-500/20 pt-2 mt-2">
                  <span>Total estimé</span>
                  <span className="text-amber-600">{formatPrice(total.toString())}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
              <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" disabled={isPending}>
                {isPending ? "Envoi..." : "Confirmer la demande"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
// ─── SPECIAL OFFERS SECTION ────────────────────────────────────────────────────────────────
function OffresSection({ hotelProfileId }: { hotelProfileId: number }) {
  const { data: offers, isLoading } = trpc.specialOffers.listPublic.useQuery(
    { hotelProfileId },
    { enabled: !!hotelProfileId }
  );

  if (isLoading || !offers?.length) return null;

  return (
    <div className="mb-12">
      <Separator className="bg-white/10 mb-10" />
      <h2
        className="text-xl font-bold text-white mb-6 flex items-center gap-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        <Gift className="h-5 w-5 text-amber-400" />
        Offres spéciales
        <span className="text-sm font-normal text-white/40">({offers.length} offre{offers.length > 1 ? "s" : ""})</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map((offer) => {
          const val = parseFloat(offer.discountValue);
          const discountLabel = offer.discountType === "percent" ? `-${val}%` : `-${new Intl.NumberFormat("fr-FR").format(val)} FCFA`;
          const hasExpiry = !!offer.validUntil;
          const daysLeft = hasExpiry
            ? Math.ceil((new Date(offer.validUntil!).getTime() - Date.now()) / 86400000)
            : null;

          return (
            <div
              key={offer.id}
              className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 hover:border-amber-500/50 transition-all"
            >
              {/* Decorative background sparkle */}
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-amber-500/10 blur-xl" />

              {/* Top row: badge + discount */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    {offer.badgeLabel && (
                      <Badge className="bg-amber-500 text-white border-0 text-xs mb-1">
                        {offer.badgeLabel}
                      </Badge>
                    )}
                    <h3 className="font-bold text-white text-sm leading-tight">{offer.title}</h3>
                  </div>
                </div>
                {/* Big discount pill */}
                <div className="flex flex-col items-center justify-center bg-amber-500 rounded-xl px-3 py-2 shrink-0 ml-2">
                  <Percent className="h-3 w-3 text-white mb-0.5" />
                  <span className="text-white font-bold text-sm leading-tight">{discountLabel}</span>
                </div>
              </div>

              {/* Description */}
              {offer.description && (
                <p className="text-sm text-white/60 mb-3 leading-relaxed">{offer.description}</p>
              )}

              {/* Footer info */}
              <div className="flex flex-wrap gap-3 text-xs text-white/40">
                {offer.minNights && offer.minNights > 1 && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    Min. {offer.minNights} nuit{offer.minNights > 1 ? "s" : ""}
                  </span>
                )}
                {hasExpiry && daysLeft !== null && daysLeft >= 0 && (
                  <span className={`flex items-center gap-1 ${
                    daysLeft <= 3 ? "text-red-400" : daysLeft <= 7 ? "text-amber-400" : "text-white/40"
                  }`}>
                    <CalendarDays className="h-3 w-3" />
                    {daysLeft === 0 ? "Expire aujourd'hui" : `Expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                  </span>
                )}
                {offer.validFrom && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Dès le {new Date(offer.validFrom).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- REVIEWS SECTION ---
function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              (hovered || value) >= n
                ? "fill-amber-400 text-amber-400"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${rating >= n ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

function ReviewsSection({ hotelProfileId }: { hotelProfileId: number }) {
  const utils = trpc.useUtils();
  const { data: summary } = trpc.reviews.summary.useQuery({ hotelProfileId });
  const { data: reviewsList, isLoading } = trpc.reviews.list.useQuery({ hotelProfileId });

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    rating: 0,
    comment: "",
  });

  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm({ clientName: "", clientEmail: "", rating: 0, comment: "" });
      utils.reviews.list.invalidate({ hotelProfileId });
      utils.reviews.summary.invalidate({ hotelProfileId });
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) { toast.error("Votre nom est requis"); return; }
    if (form.rating === 0) { toast.error("Veuillez attribuer une note"); return; }
    createMutation.mutate({
      hotelProfileId,
      clientName: form.clientName,
      clientEmail: form.clientEmail || undefined,
      rating: form.rating,
      comment: form.comment || undefined,
    });
  }

  const ratingLabel = useMemo(() => {
    if (!summary?.average) return "";
    if (summary.average >= 4.5) return "Exceptionnel";
    if (summary.average >= 4) return "Très bien";
    if (summary.average >= 3) return "Bien";
    if (summary.average >= 2) return "Passable";
    return "Décevant";
  }, [summary?.average]);

  return (
    <div>
      <Separator className="bg-white/10 mb-10" />

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2
          className="text-xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <MessageSquare className="h-5 w-5 text-amber-400" />
          Avis clients
          {summary && summary.total > 0 && (
            <span className="text-sm font-normal text-white/40">({summary.total} avis)</span>
          )}
        </h2>
        {!showForm && !submitted && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            size="sm"
          >
            <Star className="h-4 w-4 mr-1.5" />
            Laisser un avis
          </Button>
        )}
      </div>

      {/* Rating summary */}
      {summary && summary.total > 0 && (
        <Card className="bg-white/10 border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-center">
              {/* Big score */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-6xl font-bold text-amber-400">{summary.average.toFixed(1)}</span>
                <StarDisplay rating={Math.round(summary.average)} size="lg" />
                <span className="text-sm text-white/60 font-medium mt-1">{ratingLabel}</span>
                <span className="text-xs text-white/40">{summary.total} avis</span>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution[star] ?? 0;
                  const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <span className="text-xs text-white/60">{star}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {submitted ? (
        <Card className="bg-emerald-500/10 border-emerald-500/30 mb-8">
          <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Merci pour votre avis !</h3>
            <p className="text-sm text-white/60">
              Votre commentaire sera visible après validation par l'établissement.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 mt-2"
              onClick={() => { setSubmitted(false); setShowForm(false); }}
            >
              Fermer
            </Button>
          </CardContent>
        </Card>
      ) : showForm ? (
        <Card className="bg-white/10 border-white/20 mb-8">
          <CardContent className="p-6">
            <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Votre évaluation
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star rating */}
              <div className="space-y-2">
                <Label className="text-white/70">Note *</Label>
                <StarRatingInput value={form.rating} onChange={(n) => setForm(f => ({ ...f, rating: n }))} />
                {form.rating > 0 && (
                  <p className="text-xs text-amber-400">
                    {form.rating === 5 ? "Exceptionnel !" : form.rating === 4 ? "Très bien" : form.rating === 3 ? "Bien" : form.rating === 2 ? "Passable" : "Décevant"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70">Votre nom *</Label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="Jean Dupont"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70">Email (optionnel)</Label>
                  <Input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70">Commentaire</Label>
                <Textarea
                  value={form.comment}
                  onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Décrivez votre expérience..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Envoi..." : (
                    <>
                      <Send className="h-4 w-4 mr-1.5" />
                      Soumettre
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-white/10 rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : !reviewsList?.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-white/30">
          <ThumbsUp className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Aucun avis pour le moment. Soyez le premier !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewsList.map((review) => (
            <Card key={review.id} className="bg-white/10 border-white/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-400">
                        {review.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{review.clientName}</p>
                      <p className="text-xs text-white/40">
                        {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
