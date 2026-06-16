import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COUNTRIES, getCitiesByCountry } from "@/lib/transport-geo";
import { SearchableSelect } from "@/components/SearchableSelect";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Briefcase,
  Bus,
  Calendar,
  ChevronRight,
  Clock,
  Facebook,
  Fuel,
  Globe,
  Home,
  Hotel,
  ImageIcon,
  Instagram,
  LogIn,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plane,
  Plus as PlusIcon,
  Search,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  Truck,
  Twitter,
  UserPlus,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MobilePayment } from "@/components/MobilePayment";
import CarrouselGalerie from "@/components/CarrouselGalerie";
import RecruitmentForm from "@/components/RecruitmentForm";
import { GalleriesByActivityType } from "@/components/GalleriesByActivityType";

import AdminLoginModal from "@/components/AdminLoginModal";
import { ActivityCarousel } from "@/components/ActivityCarousel";
import { AdCarousel } from "@/components/AdCarousel";
import { HealthcareManagementBanner } from "@/components/HealthcareManagementBanner";
import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { MediconnectAdBanner } from "@/components/MediconnectAdBanner";
import { GreenHealthcareBanner } from "@/components/GreenHealthcareBanner";
import { HotelReservationModal } from "@/components/HotelReservationModal";

// --- ACTIVITY TABS ---------------------------------------------------------------------------------
type ActivityType = "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "agence_voyage" | "residence_meuble" | "loisirs" | "location_vente";

// --- BOOKING DIALOG ---------------------------------------------------------------------------------
function BookingDialog({
  departure,
  onClose,
}: {
  departure: {
    id: number;
    departureCity: string;
    arrivalCity: string;
    departureDate: Date | string;
    departureTime: string;
    companyName: string;
    companyId: number;
    availableSeats: number;
    priceXOF?: number | null;
  };
  onClose: () => void;
}) {
  const [seat, setSeat] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    idType: "",
    idNumber: "",
    gender: "",
    nationality: "",
  });
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const { data: occupiedSeats } = trpc.transport.public.occupiedSeats.useQuery({
    departureId: departure.id,
  });

  const bookMutation = trpc.transport.public.bookPublic.useMutation({
    onSuccess: (data) => {
      setBookingRef(data?.bookingRef ?? "");
      setSuccess(true);
    },
  });

  const capacity = departure.availableSeats + (occupiedSeats?.length ?? 0);

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Ticket className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Réservation confirmée !</h3>
        <p className="text-gray-600">Votre référence de réservation :</p>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <p className="text-2xl font-bold font-mono text-[#6F4E37]">{bookingRef}</p>
        </div>
        <p className="text-sm text-gray-500">
          Présentez cette référence au guichet de la compagnie{" "}
          <strong>{departure.companyName}</strong> pour retirer votre billet.
        </p>
        <Button
          className="bg-[#6F4E37] hover:bg-[#5A3E2B] text-white w-full"
          onClick={onClose}
        >
          Fermer
        </Button>
      </div>
    );
  }

  const seats = Array.from({ length: capacity }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-2 text-[#5A3E2B] font-semibold">
          <MapPin className="h-4 w-4" />
          {departure.departureCity}
          <ArrowRight className="h-4 w-4" />
          {departure.arrivalCity}
        </div>
        <div className="flex gap-4 mt-1 text-sm text-[#6F4E37]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {departure.departureDate instanceof Date
              ? departure.departureDate.toLocaleDateString("fr-FR")
              : String(departure.departureDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {departure.departureTime}
          </span>
          {departure.priceXOF && (
            <span className="font-bold">
              {Number(departure.priceXOF).toLocaleString()} XOF
            </span>
          )}
        </div>
        <p className="text-xs text-[#6F4E37] mt-1">{departure.companyName}</p>
      </div>

      <div className="space-y-2">
        <Label>Choisissez votre siège *</Label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
          {seats.map((n) => {
            const isOccupied = (occupiedSeats ?? []).includes(n);
            const isSelected = seat === n;
            return (
              <button
                key={n}
                type="button"
                disabled={isOccupied}
                onClick={() => setSeat(n)}
                className={`w-9 h-9 rounded text-xs font-bold border-2 transition-colors ${
                  isOccupied
                    ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                    : isSelected
                    ? "bg-orange-500 border-[#6F4E37] text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:border-orange-400"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        {seat && (
          <p className="text-sm text-[#6F4E37] font-medium">Siège {seat} sélectionné</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Prénom *</Label>
          <Input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Prénom"
          />
        </div>
        <div className="space-y-1">
          <Label>Nom *</Label>
          <Input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Nom"
          />
        </div>
        <div className="space-y-1">
          <Label>Téléphone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+225..."
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@..."
          />
        </div>
        <div className="space-y-1">
          <Label>Genre</Label>
          <Select
            value={form.gender}
            onValueChange={(v) => setForm({ ...form, gender: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculin</SelectItem>
              <SelectItem value="F">Féminin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Nationalité</Label>
          <Input
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            placeholder="Nationalité"
          />
        </div>
        <div className="space-y-1">
          <Label>Pièce d'identité</Label>
          <Select
            value={form.idType}
            onValueChange={(v) => setForm({ ...form, idType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cni">CNI</SelectItem>
              <SelectItem value="passeport">Passeport</SelectItem>
              <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Numéro pièce</Label>
          <Input
            value={form.idNumber}
            onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            placeholder="N° pièce"
          />
        </div>
      </div>

      {bookMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {bookMutation.error.message}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <Button
          className="flex-1 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white"
          disabled={!seat || !form.firstName || !form.lastName || bookMutation.isPending}
          onClick={() =>
            bookMutation.mutate({
              tripId: departure.id,
              seatNumber: seat!,
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone || undefined,
              email: form.email || undefined,
              idType: form.idType || undefined,
              idNumber: form.idNumber || undefined,
              gender: form.gender || undefined,
              nationality: form.nationality || undefined,
            })
          }
        >
          {bookMutation.isPending ? "Réservation..." : "Confirmer la réservation"}
        </Button>
      </div>
    </div>
  );
}

// --- EXPEDITION FORM ----------------------------------------------------------
function ExpeditionForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "gps">("form");
  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    recipientName: "",
    recipientPhone: "",
    recipientCity: "",
    description: "",
    weight: "",
  });
  const [gpsShared, setGpsShared] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("gps");
  };

  const handleShareGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsShared(true);
        },
        () => {
          setGpsShared(true); // continue even if denied
        }
      );
    } else {
      setGpsShared(true);
    }
  };

  if (step === "gps") {
    return (
      <div className="text-center py-6 space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <MapPin className="h-8 w-8 text-sky-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Partagez votre position</h3>
        <p className="text-gray-600 text-sm">
          Partagez votre position GPS pour permettre au livreur de vous localiser facilement.
        </p>
        {!gpsShared ? (
          <Button
            className="bg-sky-500 hover:bg-sky-600 text-white w-full"
            onClick={handleShareGps}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Partager ma position GPS
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-semibold">
                {gpsCoords
                  ? `Position partagée : ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
                  : "Demande envoyée sans position GPS"}
              </p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <p className="text-sm text-[#6F4E37]">
                Votre demande d'expédition a bien été enregistrée. Un livreur vous contactera sous peu.
              </p>
            </div>
          </div>
        )}
        {gpsShared && (
          <Button
            className="bg-[#6F4E37] hover:bg-[#5A3E2B] text-white w-full"
            onClick={onClose}
          >
            Fermer
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-sky-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sky-800 font-semibold text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Formulaire d'expédition de colis
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nom expéditeur *</Label>
          <Input
            value={form.senderName}
            onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            placeholder="Votre nom"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Téléphone expéditeur *</Label>
          <Input
            value={form.senderPhone}
            onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
            placeholder="+225..."
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Nom destinataire *</Label>
          <Input
            value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            placeholder="Nom destinataire"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Téléphone destinataire *</Label>
          <Input
            value={form.recipientPhone}
            onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
            placeholder="+225..."
            required
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Ville de destination *</Label>
          <Input
            value={form.recipientCity}
            onChange={(e) => setForm({ ...form, recipientCity: e.target.value })}
            placeholder="Ville de livraison"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Poids estimé (kg)</Label>
          <Input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="Ex: 2.5"
          />
        </div>
        <div className="space-y-1">
          <Label>Description du colis</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Contenu, fragile..."
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
          disabled={!form.senderName || !form.senderPhone || !form.recipientName || !form.recipientCity}
        >
          Valider la demande
        </Button>
      </div>
    </form>
  );
}

// --- RESTAURANT ORDER FORM ----------------------------------------------------
// --- Types panier
type CartItem = { itemId: number; name: string; priceXOF: number; qty: number; photoUrl?: string | null; preparationTime?: number };

function RestaurantOrderForm({
  company,
  onClose,
}: {
  company: { id: number; companyName: string; logoUrl?: string | null };
  onClose: () => void;
}) {
  const [step, setStep] = useState<"menu" | "checkout" | "done">("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", notes: "", deliveryType: "livraison" as "livraison" | "sur_place" });

  const { data: menuData = [], isLoading: menuLoading } = trpc.menu.publicMenu.useQuery(
    { companyId: company.id },
    { staleTime: 60_000 }
  );
  const { data: publicZones = [] } = trpc.menu.publicDeliveryZones.useQuery(
    { companyId: company.id },
    { staleTime: 60_000 }
  );
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const createOrderMutation = trpc.menu.createOrder.useMutation();

  const selectedZone = (publicZones as any[]).find((z: any) => z.id === selectedZoneId) ?? null;

  const firstCatId = (menuData as any[])[0]?.id ?? null;
  const displayCatId = activeCatId ?? firstCatId;
  const activeCategory = (menuData as any[]).find((c: any) => c.id === displayCatId);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.priceXOF * i.qty, 0);
  const basePrepTime = cart.length > 0 ? Math.max(...cart.map((c) => c.preparationTime ?? 15)) : 0;
  const totalPrepTime = basePrepTime + (selectedZone ? selectedZone.extraMinutes : 0);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.itemId === item.id);
      if (ex) return prev.map((c) => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { itemId: item.id, name: item.name, priceXOF: parseInt(item.priceXOF), qty: 1, photoUrl: item.photoUrl, preparationTime: item.preparationTime }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.itemId === itemId);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter((c) => c.itemId !== itemId);
      return prev.map((c) => c.itemId === itemId ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const getQty = (itemId: number) => cart.find((c) => c.itemId === itemId)?.qty ?? 0;

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <UtensilsCrossed className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Commande envoyée !</h3>
        <p className="text-gray-600 text-sm">Votre commande a été transmise à <strong>{company.companyName}</strong>.</p>
        {orderRef && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-green-700 font-medium">Référence : </span>
            <span className="font-bold text-green-800">{orderRef}</span>
          </div>
        )}
        <div className="bg-orange-50 rounded-xl p-4 w-full text-left">
          <p className="font-semibold text-sm mb-2">Récapitulatif</p>
          {cart.map((c) => (
            <div key={c.itemId} className="flex justify-between text-sm">
              <span>{c.qty}× {c.name}</span>
              <span>{(c.priceXOF * c.qty).toLocaleString()} FCFA</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold"><span>Total</span><span>{totalPrice.toLocaleString()} FCFA</span></div>
        </div>
        <Button className="bg-[#6F4E37] hover:bg-[#5A3E2B] text-white w-full" onClick={onClose}>Fermer</Button>
      </div>
    );
  }

  if (step === "checkout") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep("menu")}>← Retour au menu</Button>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <p className="font-semibold text-sm mb-2 text-[#5A3E2B]">Votre commande ({totalItems} article{totalItems > 1 ? "s" : ""})</p>
          {cart.map((c) => (
            <div key={c.itemId} className="flex justify-between text-sm py-0.5">
              <span>{c.qty}× {c.name}</span>
              <span className="font-medium">{(c.priceXOF * c.qty).toLocaleString()} FCFA</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-[#6F4E37]"><span>Total</span><span>{totalPrice.toLocaleString()} FCFA</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Votre nom *</Label>
            <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nom et prénoms" />
          </div>
          <div className="space-y-1">
            <Label>Téléphone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225..." />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Type de service</Label>
            <div className="flex gap-2">
              {(["livraison", "sur_place"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, deliveryType: t })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.deliveryType === t ? "bg-[#6F4E37] text-white border-[#6F4E37]" : "border-gray-200 hover:border-orange-300"
                  }`}>
                  {t === "livraison" ? "🛵 Livraison" : "🏠 Sur place"}
                </button>
              ))}
            </div>
          </div>
          {form.deliveryType === "livraison" && (
            <>
              <div className="space-y-1 col-span-2">
                <Label>Adresse de livraison *</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Quartier, rue..." />
              </div>
              {(publicZones as any[]).length > 0 && (
                <div className="space-y-1 col-span-2">
                  <Label>Zone de livraison</Label>
                  <Select value={selectedZoneId ? String(selectedZoneId) : ""} onValueChange={(v) => setSelectedZoneId(v ? Number(v) : null)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choisir une zone (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(publicZones as any[]).map((z: any) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name}{z.description ? ` — ${z.description}` : ""} <span className="text-gray-400 text-xs">(+{z.extraMinutes} min)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedZone && (
                    <p className="text-xs text-[#6F4E37] mt-1">⏱ Délai total estimé : <strong>{totalPrepTime} min</strong> (préparation + livraison)</p>
                  )}
                </div>
              )}
            </>
          )}
          <div className="space-y-1 col-span-2">
            <Label>Instructions spéciales</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Sans piment, allergie..." rows={2} />
          </div>
        </div>
        {showPayment ? (
          <MobilePayment
            amountXOF={totalPrice}
            orderRef={`CMD-PREVIEW`}
            onSuccess={async (_method: string, _phone: string) => {
              setShowPayment(false);
              setSubmitting(true);
              try {
                const result = await createOrderMutation.mutateAsync({
                  companyId: company.id,
                  customerName: form.customerName,
                  customerPhone: form.phone,
                  deliveryType: form.deliveryType,
                  deliveryAddress: form.deliveryType === "livraison" ? form.address : undefined,
                  notes: form.notes || undefined,
                  items: cart.map((c) => ({
                    itemId: c.itemId,
                    name: c.name,
                    qty: c.qty,
                    priceXOF: c.priceXOF,
                    preparationTime: c.preparationTime,
                  })),
                });
                setOrderRef(result.orderRef);
                setStep("done");
              } catch {
                setStep("done");
              } finally {
                setSubmitting(false);
              }
            }}
            onCancel={() => setShowPayment(false)}
          />
        ) : (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button
              className="flex-1 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white"
              disabled={!form.customerName || !form.phone || (form.deliveryType === "livraison" && !form.address) || submitting}
              onClick={() => setShowPayment(true)}
            >
              {submitting ? "Envoi en cours..." : `Payer ${totalPrice.toLocaleString()} FCFA`}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Écran menu
  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-4">
      <div className="bg-gradient-to-r from-[#E8751A] to-[#E8751A] px-6 py-4 flex items-center gap-3">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.companyName} className="h-10 w-10 rounded-xl object-cover border-2 border-white/40" />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-bold text-white">{company.companyName}</p>
          <p className="text-white/70 text-xs">Sélectionnez vos plats</p>
        </div>
        {totalItems > 0 && (
          <button onClick={() => setStep("checkout")}
            className="bg-white text-[#6F4E37] rounded-full px-3 py-1.5 text-sm font-bold flex items-center gap-1.5 hover:bg-orange-50">
            <ShoppingCart className="h-4 w-4" />
            {totalItems} — {totalPrice.toLocaleString()} FCFA
          </button>
        )}
      </div>

      {menuLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#6F4E37] border-t-transparent" />
        </div>
      ) : (menuData as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-500">Carte non disponible</p>
          <p className="text-gray-400 text-sm mt-1">Ce restaurant n'a pas encore publié sa carte.</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>Fermer</Button>
        </div>
      ) : (
        <div className="flex h-[420px]">
          <div className="w-28 border-r bg-gray-50 flex flex-col overflow-y-auto">
            {(menuData as any[]).map((cat: any) => (
              <button key={cat.id} onClick={() => setActiveCatId(cat.id)}
                className={`px-3 py-3 text-left text-xs font-medium transition-colors border-b last:border-b-0 ${
                  displayCatId === cat.id ? "bg-[#6F4E37] text-white" : "text-gray-600 hover:bg-orange-50"
                }`}>
                {cat.name}
                <span className={`block text-[10px] mt-0.5 ${displayCatId === cat.id ? "text-white/70" : "text-gray-400"}`}>
                  {cat.items?.length ?? 0} plat{(cat.items?.length ?? 0) > 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {(activeCategory?.items ?? []).map((item: any) => {
                const qty = getQty(item.id);
                return (
                  <div key={item.id} className="flex gap-3 p-2 rounded-xl border bg-white hover:shadow-sm transition-shadow">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      {item.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>}
                      {item.preparationTime && (
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {item.preparationTime} min
                        </p>
                      )}
                      <p className="font-bold text-[#6F4E37] text-sm mt-1">{parseInt(item.priceXOF).toLocaleString()} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {qty > 0 ? (
                        <>
                          <button onClick={() => removeFromCart(item.id)}
                            className="h-7 w-7 rounded-full border border-orange-300 flex items-center justify-center hover:bg-orange-50 text-[#6F4E37]">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">{qty}</span>
                          <button onClick={() => addToCart(item)}
                            className="h-7 w-7 rounded-full bg-[#6F4E37] text-white flex items-center justify-center hover:bg-[#5A3E2B]">
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => addToCart(item)}
                          className="h-7 w-7 rounded-full bg-[#6F4E37] text-white flex items-center justify-center hover:bg-[#5A3E2B]">
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
      {totalItems > 0 && (
        <div className="border-t bg-white px-6 py-3">
          <Button className="w-full bg-[#6F4E37] hover:bg-[#5A3E2B] text-white" onClick={() => setStep("checkout")}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Voir mon panier ({totalItems} article{totalItems > 1 ? "s" : ""}) — {totalPrice.toLocaleString()} FCFA
          </Button>
        </div>
      )}
    </div>
  );
}// --- TODAY DEPARTURES ---------------------------------------------------------------
function TodayDepartures({
  countryId,
  onBook,
}: {
  countryId: number;
  onBook: (dep: any) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const { data: departures, isLoading } = trpc.transport.public.searchDepartures.useQuery(
    { countryId },
    { staleTime: 60_000, refetchInterval: 120_000 }
  );

  const upcomingDeps = (departures ?? [])
    .filter((d) => {
      const depDate = d.departureDate instanceof Date
        ? d.departureDate.toISOString().split("T")[0]
        : String(d.departureDate);
      return depDate >= today;
    })
    .slice(0, 12);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6F4E37] border-t-transparent" />
      </div>
    );
  }

  if (upcomingDeps.length === 0) {
    return (
      <div className="text-center py-12">
        <Bus className="h-14 w-14 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-500">Aucun départ disponible</h3>
        <p className="text-gray-400 mt-1 text-sm">Utilisez la recherche ci-dessus pour trouver des trajets.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#6F4E37]" />
          Prochains départs disponibles
        </h3>
        <span className="text-sm text-gray-400">{upcomingDeps.length} trajet{upcomingDeps.length > 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {upcomingDeps.map((dep) => {
          const depDate = dep.departureDate instanceof Date
            ? dep.departureDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
            : String(dep.departureDate);
          const isToday = (dep.departureDate instanceof Date
            ? dep.departureDate.toISOString().split("T")[0]
            : String(dep.departureDate)) === today;

          return (
            <Card
              key={dep.id}
              className="shadow-sm hover:shadow-md transition-all border hover:border-orange-300 group cursor-pointer"
              onClick={() => dep.availableSeats > 0 && onBook(dep)}
            >
              <CardContent className="p-4">
                {/* En-tête compagnie */}
                <div className="flex items-center gap-2 mb-3">
                  {dep.logoUrl ? (
                    <img src={dep.logoUrl} alt={dep.companyName ?? ""} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Bus className="h-4 w-4 text-orange-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{dep.companyName}</p>
                    <div className="flex items-center gap-1.5">
                      {isToday && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Aujourd'hui</span>
                      )}
                      <span className="text-[10px] text-gray-400">{depDate}</span>
                    </div>
                  </div>
                  {dep.availableSeats === 0 ? (
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Complet</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {dep.availableSeats} place{dep.availableSeats > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Trajet */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-center flex-1">
                    <p className="font-bold text-gray-900 text-base">{dep.departureTime}</p>
                    <p className="text-xs text-gray-500 truncate">{dep.departureCity}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 px-2">
                    <div className="w-16 h-px bg-gradient-to-r from-orange-300 to-orange-500" />
                    <ArrowRight className="h-3.5 w-3.5 text-[#6F4E37]" />
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-gray-900 text-base">{dep.arrivalCity}</p>
                    <p className="text-xs text-gray-500">
                      {dep.lineType === "international" ? "🌐 International" : "🚌 National"}
                    </p>
                  </div>
                </div>

                {/* Prix + bouton */}
                <div className="flex items-center justify-between">
                  {dep.priceXOF ? (
                    <div>
                      <p className="text-xs text-gray-400">Dès</p>
                      <p className="font-bold text-[#6F4E37] text-lg">{Number(dep.priceXOF).toLocaleString()} XOF</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {dep.availableSeats} place{dep.availableSeats > 1 ? "s" : ""}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className={`${
                      dep.availableSeats === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#6F4E37] hover:bg-[#5A3E2B] text-white group-hover:shadow-md"
                    }`}
                    disabled={dep.availableSeats === 0}
                    onClick={(e) => { e.stopPropagation(); onBook(dep); }}
                  >
                    {dep.availableSeats === 0 ? "Complet" : "Réserver"}
                    {dep.availableSeats > 0 && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// --- TRANSPORT SEARCH PANEL -----------------------------------------------------
function TransportSearchPanel() {
  const { t } = useI18n();
  const [transportType, setTransportType] = useState<"national" | "international">("national");
  // National
  const [natCountryId, setNatCountryId] = useState<number>(1);
  const [natCompanyId, setNatCompanyId] = useState<number | null>(null);
  const [natDepartureCity, setNatDepartureCity] = useState("");
  const [natArrivalCity, setNatArrivalCity] = useState("");
  // International
  const [intDepartureCountryId, setIntDepartureCountryId] = useState<number>(1);
  const [intArrivalCountryId, setIntArrivalCountryId] = useState<number>(2);
  const [intDepartureCity, setIntDepartureCity] = useState("");
  const [intArrivalCity, setIntArrivalCity] = useState("");
  const [intCompanyId, setIntCompanyId] = useState<number | null>(null);
  // Common
  const [travelDate, setTravelDate] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<any | null>(null);

  // Cities
  const natCities = getCitiesByCountry(natCountryId);
  const intDepCities = getCitiesByCountry(intDepartureCountryId);
  const intArrCities = getCitiesByCountry(intArrivalCountryId);

  // Companies for national
  const { data: natCompanies } = trpc.transport.public.companiesByCountry.useQuery(
    { countryId: natCountryId },
    { enabled: transportType === "national" }
  );
  // Companies for international (departure country)
  const { data: intCompanies } = trpc.transport.public.companiesByCountry.useQuery(
    { countryId: intDepartureCountryId },
    { enabled: transportType === "international" }
  );

  const companies = transportType === "national" ? natCompanies : intCompanies;
  const companyId = transportType === "national" ? natCompanyId : intCompanyId;
  const departureCity = transportType === "national" ? natDepartureCity : intDepartureCity;
  const arrivalCity = transportType === "national" ? natArrivalCity : intArrivalCity;
  const countryId = transportType === "national" ? natCountryId : intDepartureCountryId;

  const { data: departures, isLoading: loadingDepartures } =
    trpc.transport.public.searchDepartures.useQuery(
      {
        countryId,
        companyId: companyId ?? undefined,
        departureCity: departureCity || undefined,
        arrivalCity: arrivalCity || undefined,
        date: travelDate || undefined,
      },
      { enabled: searched }
    );

  const resetSearch = () => {
    setSearched(false);
    setNatCompanyId(null);
    setIntCompanyId(null);
    setNatDepartureCity("");
    setNatArrivalCity("");
    setIntDepartureCity("");
    setIntArrivalCity("");
    setTravelDate("");
  };

  return (
    <div>
      {/* Transport type tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-xl bg-orange-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => { setTransportType("national"); resetSearch(); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              transportType === "national"
                ? "bg-[#6F4E37] text-white shadow"
                : "text-[#6F4E37] hover:bg-orange-200"
            }`}
          >
            <Bus className="h-4 w-4" />
            {t("search", "national")}
          </button>
          <button
            type="button"
            onClick={() => { setTransportType("international"); resetSearch(); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              transportType === "international"
                ? "bg-[#6F4E37] text-white shadow"
                : "text-[#6F4E37] hover:bg-orange-200"
            }`}
          >
            <Globe className="h-4 w-4" />
            {t("search", "international")}
          </button>
        </div>
      </div>

      {/* Search form */}
      <Card className="shadow-2xl border-0">
        <CardContent className="p-6">
          {transportType === "national" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Country */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "country")}</Label>
                <Select
                  value={String(natCountryId)}
                  onValueChange={(v) => {
                    setNatCountryId(parseInt(v));
                    setNatCompanyId(null);
                    setNatDepartureCity("");
                    setNatArrivalCity("");
                    setSearched(false);
                  }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Company */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "company")}</Label>
                <Select
                  value={natCompanyId ? String(natCompanyId) : "all"}
                  onValueChange={(v) => { setNatCompanyId(v === "all" ? null : parseInt(v)); setSearched(false); }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search", "allCompanies")}</SelectItem>
                    {(natCompanies ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Departure city */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "departure")}</Label>
                <SearchableSelect
                  options={[
                    { value: "any", label: t("search", "allCities") },
                    ...natCities.map((c) => ({ value: c.name, label: c.name }))
                  ]}
                  value={natDepartureCity || "any"}
                  onChange={(v) => { setNatDepartureCity(v === "any" ? "" : v); setSearched(false); }}
                  placeholder={t("search", "departureCity")}
                  searchPlaceholder="Rechercher une ville..."
                />
              </div>
              {/* Arrival city */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "arrival")}</Label>
                <SearchableSelect
                  options={[
                    { value: "any", label: t("search", "allCities") },
                    ...natCities.map((c) => ({ value: c.name, label: c.name }))
                  ]}
                  value={natArrivalCity || "any"}
                  onChange={(v) => { setNatArrivalCity(v === "any" ? "" : v); setSearched(false); }}
                  placeholder={t("search", "arrivalCity")}
                  searchPlaceholder="Rechercher une ville..."
                />
              </div>
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "date")}</Label>
                <Input
                  type="date"
                  value={travelDate}
                  onChange={(e) => { setTravelDate(e.target.value); setSearched(false); }}
                  className="border-gray-200"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          ) : (
            /* INTERNATIONAL */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Departure country */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "departureCountry")}</Label>
                <Select
                  value={String(intDepartureCountryId)}
                  onValueChange={(v) => {
                    setIntDepartureCountryId(parseInt(v));
                    setIntDepartureCity("");
                    setIntCompanyId(null);
                    setSearched(false);
                  }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.flag} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Departure city */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "departureCity")}</Label>
                <Select
                  value={intDepartureCity || "any"}
                  onValueChange={(v) => { setIntDepartureCity(v === "any" ? "" : v); setSearched(false); }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Toutes</SelectItem>
                    {intDepCities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Arrival country */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "arrivalCountry")}</Label>
                <Select
                  value={String(intArrivalCountryId)}
                  onValueChange={(v) => {
                    setIntArrivalCountryId(parseInt(v));
                    setIntArrivalCity("");
                    setSearched(false);
                  }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.flag} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Arrival city */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "arrivalCity")}</Label>
                <Select
                  value={intArrivalCity || "any"}
                  onValueChange={(v) => { setIntArrivalCity(v === "any" ? "" : v); setSearched(false); }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Toutes</SelectItem>
                    {intArrCities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Company */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "company")}</Label>
                <Select
                  value={intCompanyId ? String(intCompanyId) : "all"}
                  onValueChange={(v) => { setIntCompanyId(v === "all" ? null : parseInt(v)); setSearched(false); }}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search", "all")}</SelectItem>
                    {(intCompanies ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("search", "date")}</Label>
                <Input
                  type="date"
                  value={travelDate}
                  onChange={(e) => { setTravelDate(e.target.value); setSearched(false); }}
                  className="border-gray-200"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              className="bg-[#6F4E37] hover:bg-[#5A3E2B] text-white px-8 h-11"
              onClick={() => setSearched(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              {t("search", "search")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mt-6">
        {!searched && (
          <TodayDepartures
            countryId={countryId}
            onBook={(dep) => setSelectedDeparture(dep)}
          />
        )}

        {searched && loadingDepartures && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6F4E37] border-t-transparent" />
          </div>
        )}

        {searched && !loadingDepartures && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {(departures ?? []).length} départ
                {(departures ?? []).length !== 1 ? "s" : ""} trouvé
                {(departures ?? []).length !== 1 ? "s" : ""}
                {departureCity && arrivalCity && ` · ${departureCity} → ${arrivalCity}`}
                {travelDate &&
                  ` · ${new Date(travelDate + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}`}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setSearched(false)}>
                {t("search", "modify")}
              </Button>
            </div>

            {(departures ?? []).length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-500">{t("search", "noDepartures")}</h4>
                <p className="text-gray-400 mt-2">{t("search", "tryModify")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(departures ?? []).map((dep) => (
                  <Card
                    key={dep.id}
                    className="shadow-sm hover:shadow-md transition-shadow border hover:border-orange-200"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          {dep.logoUrl ? (
                            <img
                              src={dep.logoUrl ?? ""}
                              alt={dep.companyName ?? ""}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <Bus className="h-5 w-5 text-orange-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{dep.companyName}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-0.5 ${
                                dep.lineType === "international"
                                  ? "border-sky-300 text-sky-600"
                                  : "border-orange-300 text-[#6F4E37]"
                              }`}
                            >
                              {dep.lineType === "international" ? "International" : "National"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-center">
                            <p className="font-bold text-gray-900">{dep.departureTime}</p>
                            <p className="text-sm text-gray-600">{dep.departureCity}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-1">
                            <div className="flex-1 h-px bg-gray-300" />
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 h-px bg-gray-300" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-gray-900">{dep.arrivalCity}</p>
                            <p className="text-sm text-gray-600">
                              {dep.departureDate instanceof Date
                                ? dep.departureDate.toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : String(dep.departureDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="h-3.5 w-3.5" />
                              <span>{dep.availableSeats} {t("search", "seats")}</span>
                            </div>
                            {dep.priceXOF && (
                              <p className="font-bold text-[#6F4E37] text-lg">
                                {Number(dep.priceXOF).toLocaleString()} XOF
                              </p>
                            )}
                          </div>
                          <Button
                            className="bg-[#6F4E37] hover:bg-[#5A3E2B] text-white"
                            disabled={dep.availableSeats === 0}
                            onClick={() => setSelectedDeparture(dep)}
                          >
                            {dep.availableSeats === 0 ? t("search", "full") : t("search", "book")}
                            {dep.availableSeats > 0 && <ChevronRight className="h-4 w-4 ml-1" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking dialog */}
      <Dialog open={!!selectedDeparture} onOpenChange={() => setSelectedDeparture(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("search", "bookYourSeat")}</DialogTitle>
          </DialogHeader>
          {selectedDeparture && (
            <BookingDialog
              departure={selectedDeparture}
              onClose={() => setSelectedDeparture(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- RESTAURANT PANEL ---------------------------------------------------------
function RestaurantPanel() {
  const [countryId, setCountryId] = useState<number>(1);
  const [cityFilter, setCityFilter] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const cities = getCitiesByCountry(countryId);

  const { data: companies, isLoading } = trpc.transport.public.companiesByCountry.useQuery(
    { countryId },
    { enabled: !!countryId }
  );

  // Filter by activity type restauration (client-side since we don't have a separate route)
  const restaurants = (companies ?? []).filter(
    (c: any) => !c.activityType || c.activityType === "restauration"
  );
  const filtered = cityFilter
    ? restaurants.filter((c: any) =>
        String(c.cityId ?? "").includes(cityFilter) ||
        c.companyName.toLowerCase().includes(cityFilter.toLowerCase())
      )
    : restaurants;

  return (
    <div>
      <Card className="shadow-2xl border-0 mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pays</Label>
              <Select
                value={String(countryId)}
                onValueChange={(v) => { setCountryId(parseInt(v)); setCityFilter(""); }}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</Label>
              <Select
                value={cityFilter || "any"}
                onValueChange={(v) => setCityFilter(v === "any" ? "" : v)}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Toutes les villes</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rechercher</Label>
              <Input
                placeholder="Nom du restaurant..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="border-gray-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6F4E37] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-500">Aucun restaurant disponible</h3>
          <p className="text-gray-400 mt-1 text-sm">Aucun restaurant n'est encore inscrit dans cette zone.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {filtered.map((c: any) => (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-300 h-full"
                onClick={() => setSelectedCompany(c)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.companyName} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                        <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{c.companyName}</p>
                      <Badge variant="outline" className="text-xs border-orange-300 text-[#6F4E37] mt-0.5">
                        Restauration
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-[#6F4E37] hover:bg-[#5A3E2B] text-white" size="sm">
                    Commander
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Passer une commande</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <RestaurantOrderForm
              company={selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- EXPEDITION PANEL ---------------------------------------------------------
function ExpeditionPanel() {
  const [countryId, setCountryId] = useState<number>(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const { data: companies, isLoading } = trpc.transport.public.companiesByCountry.useQuery(
    { countryId }
  );

  const expeditions = (companies ?? []).filter(
    (c: any) => !c.activityType || c.activityType === "expedition"
  );

  return (
    <div>
      <Card className="shadow-2xl border-0 mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pays</Label>
              <Select
                value={String(countryId)}
                onValueChange={(v) => setCountryId(parseInt(v))}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white w-full h-10"
                onClick={() => { setSelectedCompany(null); setShowForm(true); }}
              >
                <Package className="h-4 w-4 mr-2" />
                Faire une demande d'expédition
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : expeditions.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-500">Aucun service d'expédition disponible</h3>
          <p className="text-gray-400 mt-1 text-sm">Aucune société d'expédition n'est encore inscrite dans cette zone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expeditions.map((c: any) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-sky-300"
              onClick={() => { setSelectedCompany(c); setShowForm(true); }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.companyName} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-sky-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{c.companyName}</p>
                    <Badge variant="outline" className="text-xs border-sky-300 text-sky-600 mt-0.5">
                      Expédition
                    </Badge>
                  </div>
                </div>
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white" size="sm">
                  Expédier un colis
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? `Expédition via ${selectedCompany.companyName}` : "Demande d'expédition"}
            </DialogTitle>
          </DialogHeader>
          <ExpeditionForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- HOTEL PANEL ------------------------------------------------------------
function HotelPanel() {
  const { data: companies } = trpc.transport.public.listCompanies.useQuery(undefined);
  const hotels = (companies || []).filter((c: any) => c.activityType === "hotel");
  const [hotelReservationOpen, setHotelReservationOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<{ id: number; name: string } | null>(null);

  const handleReserveClick = (hotelId: number, hotelName: string) => {
    setSelectedHotel({ id: hotelId, name: hotelName });
    setHotelReservationOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hôtels partenaires</h2>
        <p className="text-gray-500 text-sm">Réservez votre hébergement directement auprès de nos hôtels partenaires</p>
      </div>
      {hotels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-purple-200">
          <div className="text-5xl mb-4">🏨</div>
          <h3 className="text-lg font-semibold text-gray-500">Aucun hôtel disponible</h3>
          <p className="text-gray-400 mt-1 text-sm">Aucun hôtel partenaire n'est encore inscrit dans cette zone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotels.map((c: any) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.companyName} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Hotel className="h-6 w-6 text-purple-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{c.companyName}</p>
                    <span className="text-xs border border-purple-300 text-purple-600 rounded-full px-2 py-0.5">Hôtel</span>
                  </div>
                </div>
                {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white" 
                  size="sm"
                  onClick={() => handleReserveClick(c.id, c.companyName)}
                >
                  Réserver une chambre
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedHotel && (
        <HotelReservationModal
          open={hotelReservationOpen}
          onOpenChange={setHotelReservationOpen}
          hotelId={selectedHotel.id}
          hotelName={selectedHotel.name}
        />
      )}
    </div>
  );
}

// --- BOUTIQUE PANEL ----------------------------------------------------------
function BoutiquePanel() {
  const { data: companies } = trpc.transport.public.listCompanies.useQuery(undefined);
  const boutiques = (companies || []).filter((c: any) => c.activityType === "boutique");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Boutiques partenaires</h2>
        <p className="text-gray-500 text-sm">Découvrez les boutiques et commerces partenaires</p>
      </div>
      {boutiques.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-pink-200">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-500">Aucune boutique disponible</h3>
          <p className="text-gray-400 mt-1 text-sm">Aucune boutique partenaire n'est encore inscrite dans cette zone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boutiques.map((c: any) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-pink-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.companyName} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-pink-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{c.companyName}</p>
                    <span className="text-xs border border-pink-300 text-pink-600 rounded-full px-2 py-0.5">Boutique</span>
                  </div>
                </div>
                {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white" size="sm">
                  Visiter la boutique
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- AGENCE DE VOYAGE PANEL -------------------------------------------------
function AgenceVoyagePanel() {
  const { data: companies } = trpc.transport.public.listCompanies.useQuery(undefined);
  const agences = (companies || []).filter((c: any) => c.activityType === "agence_voyage");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agences de Voyage partenaires</h2>
        <p className="text-gray-500 text-sm">Réservez vos billets d'avion et forfaits voyage avec nos agences partenaires</p>
      </div>

      {/* Bannière info */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center">
          <Plane className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sky-900 mb-1">Vols intérieurs & internationaux</h3>
          <p className="text-sky-700 text-sm">Nos agences partenaires proposent des billets d'avion pour toutes les destinations d'Afrique de l'Ouest et au-delà. Contactez directement l'agence pour obtenir un devis personnalisé.</p>
        </div>
      </div>

      {agences.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-sky-200">
          <div className="text-5xl mb-4">✈️</div>
          <h3 className="text-lg font-semibold text-gray-500">Aucune agence disponible</h3>
          <p className="text-gray-400 mt-1 text-sm">Aucune agence de voyage partenaire n'est encore inscrite dans cette zone.</p>
          <button
            className="mt-4 text-sm text-sky-600 hover:text-sky-800 underline"
            onClick={() => window.location.href = '/register-company'}
          >
            Inscrire mon agence →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agences.map((c: any) => (
            <div key={c.id} className="bg-white rounded-2xl border-2 border-sky-100 hover:border-sky-300 hover:shadow-md transition-all p-5 cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.companyName} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Plane className="h-6 w-6 text-sky-500" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{c.companyName}</p>
                  <span className="text-xs border border-sky-300 text-sky-600 rounded-full px-2 py-0.5">Agence de Voyage</span>
                </div>
              </div>
              {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
              <div className="flex gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      Appeler
                    </button>
                  </a>
                )}
                <button className="flex-1 flex items-center justify-center gap-1 border border-sky-300 text-sky-600 hover:bg-sky-50 text-sm font-medium py-2 rounded-lg transition-colors">
                  <Ticket className="h-3.5 w-3.5" />
                  Voir les vols
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- RECRUITMENT SECTION ----------------------------------------------------
function RecruitmentSection() {
  const { t } = useI18n();
  return (
    <section className="py-14 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden relative">
      {/* Motif décoratif */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#6F4E37] blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#6F4E37] blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Texte */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#6F4E37]/20 text-[#6F4E37] rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Briefcase className="h-4 w-4" />
              {t("recruit", "badge")}
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
              {t("recruit", "title")}
              <span className="text-[#6F4E37]"> HUB_RESA</span>
            </h2>
            <p className="text-gray-300 text-lg mb-6 max-w-xl">
              {t("recruit", "description")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: "🌍", label: t("recruit", "stat1Label"), sub: t("recruit", "stat1Sub") },
                { icon: "💼", label: t("recruit", "stat2Label"), sub: t("recruit", "stat2Sub") },
                { icon: "📈", label: t("recruit", "stat3Label"), sub: t("recruit", "stat3Sub") },
                { icon: "🎓", label: t("recruit", "stat4Label"), sub: t("recruit", "stat4Sub") },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href="/careers/apply"
                className="inline-flex items-center gap-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-900/30"
              >
                <Briefcase className="h-5 w-5" />
                {t("recruit", "apply")}
                <ChevronRight className="h-5 w-5" />
              </a>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <a
                  href="/bdev/login"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-3 rounded-2xl text-sm transition-all hover:scale-105"
                >
                  <LogIn className="h-4 w-4" />
                  Espace BDev
                </a>
                <a
                  href="/bdev/register"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-3 rounded-2xl text-sm transition-all hover:scale-105"
                >
                  <UserPlus className="h-4 w-4" />
                  Devenir BDev
                </a>
              </div>
            </div>
          </div>
          {/* Illustration */}
          <div className="hidden lg:flex flex-col gap-3 w-72">
            {[
              { name: "Aminata K.", country: "🇸🇳 Sénégal", status: "Retenue", color: "bg-green-500" },
              { name: "Kofi A.", country: "🇬🇭 Ghana", status: "En entretien", color: "bg-blue-500" },
              { name: "Fatou D.", country: "🇨🇮 Côte d'Ivoire", status: "Nouveau", color: "bg-orange-500" },
            ].map((c) => (
              <div key={c.name} className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#6F4E37]/30 flex items-center justify-center text-white font-bold text-sm">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{c.name}</p>
                  <p className="text-gray-400 text-xs">{c.country}</p>
                </div>
                <span className={`text-xs text-white px-2 py-0.5 rounded-full ${c.color}`}>{c.status}</span>
              </div>
            ))}
            <p className="text-center text-gray-500 text-xs mt-1">{t("recruit", "recentCandidates")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- MAIN PAGE ----------------------------------------------------------------
export default function HubVoyage() {
  const [, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useI18n();
  
  // Optimize SEO: Set title and description
  useEffect(() => {
    // Set title (30-60 characters)
    document.title = "HUB_RESA - Transport & Services";
    
    // Update meta description (50-160 characters)
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Réservez vos transports, commandes et expéditions en Afrique subsaharienne.');
    }
  }, []);
  
  useSEO({
    title: "HUB_RESA — Réservation Transport, Restauration & Expédition",
    description: "HUB_RESA : Réservez vos billets de bus, commandez vos repas et gérez vos expéditions en Afrique de l'Ouest. Plateforme officielle des compagnies partenaires HUB_RESA.",
    keywords: "réservation bus Afrique, billets transport Afrique Ouest, expédition colis, restauration en ligne, HUB_RESA",
    canonicalPath: "/",
  });
  const [activity, setActivity] = useState<ActivityType>("transport");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const activityConfig: Record<
    ActivityType,
    { label: string; icon: React.ReactNode; color: string; hero: string; subtitle: string }
  > = {
    transport: {
      label: t("activity", "transport"),
      icon: <Bus className="h-5 w-5" />,
      color: "orange",
      hero: t("hero", "tagline"),
      subtitle: t("hero", "subtitle"),
    },
    restauration: {
      label: t("activity", "restaurant"),
      icon: <UtensilsCrossed className="h-5 w-5" />,
      color: "amber",
      hero: t("hero", "restaurantTagline"),
      subtitle: t("hero", "restaurantSubtitle"),
    },
    expedition: {
      label: t("activity", "expedition"),
      icon: <Package className="h-5 w-5" />,
      color: "blue",
      hero: t("hero", "expeditionTagline"),
      subtitle: t("hero", "expeditionSubtitle"),
    },
    hotel: {
      label: "Hôtel",
      icon: <Hotel className="h-5 w-5" />,
      color: "purple",
      hero: "Réservez votre hébergement",
      subtitle: "Hôtels partenaires en Afrique de l'Ouest",
    },
    boutique: {
      label: "Boutique",
      icon: <ShoppingBag className="h-5 w-5" />,
      color: "pink",
      hero: "Découvrez nos boutiques",
      subtitle: "Commerces et boutiques partenaires",
    },
    agence_voyage: {
      label: "Agence de Voyage",
      icon: <Plane className="h-5 w-5" />,
      color: "sky",
      hero: "Réservez vos vols et forfaits voyage",
      subtitle: "Agences de voyage partenaires en Afrique de l'Ouest",
    },
    residence_meuble: {
      label: t("activity", "residenceMeuble"),
      icon: <Home className="h-5 w-5" />,
      color: "amber",
      hero: "Trouvez votre logement meublé",
      subtitle: "Résidences meublées partenaires en Afrique de l'Ouest",
    },
    loisirs: {
      label: t("activity", "loisirs"),
      icon: <Briefcase className="h-5 w-5" />,
      color: "green",
      hero: "Réservez vos activités de loisirs",
      subtitle: "Activités et loisirs partenaires en Afrique de l'Ouest",
    },
    location_vente: {
      label: t("activity", "locationVente"),
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "red",
      hero: "Gérez vos locations et ventes",
      subtitle: "Plateforme de location et vente en ligne",
    },
  };

  const cfg = activityConfig[activity];

  // Color map per activity for accent
  const accentMap: Record<ActivityType, string> = {
    transport:      "#f97316",
    restauration:   "#f59e0b",
    expedition:     "#3b82f6",
    hotel:          "#8b5cf6",
    boutique:       "#ec4899",
    agence_voyage:  "#0ea5e9",
    residence_meuble:"#f59e0b",
    loisirs:        "#22c55e",
    location_vente: "#ef4444",
  };
  const accent = accentMap[activity];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>

      {/* ══════════════ NAVBAR NEXUS ══════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${accent}99)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px ${accent}55` }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>N</span>
            </div>
            <div>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>NEXUS</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 6 }}>Multi-Services</span>
            </div>
          </div>

          {/* Nav centre — visible md+ */}
          <nav style={{ display: "flex", gap: 4, alignItems: "center" }} className="hidden md:flex">
            {[
              { label: "Annuaire", path: "/directory" },
              { label: "Bibliothèque", path: "/bibliotheque" },
              { label: "À propos", path: "/about" },
            ].map(l => (
              <button key={l.path} onClick={() => navigate(l.path)} style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >{l.label}</button>
            ))}
          </nav>

          {/* Actions droite */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <LanguageSwitcher variant="dark" />
            <button
              onClick={() => navigate("/register-company")}
              style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}
            >Espace compagnies</button>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{ color: "#fff", fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8, background: accent, border: "none", cursor: "pointer", boxShadow: `0 0 14px ${accent}66`, whiteSpace: "nowrap" }}
            >Connexion</button>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ══════════════ HERO NEXUS ══════════════ */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: 72, paddingBottom: 56 }} data-hero-section>
        {/* Ambient glow bg */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-20%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, transition: "background 0.5s" }} />
          <div style={{ position: "absolute", bottom: "0%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)` }} />
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 99, border: `1px solid ${accent}55`, background: `${accent}15`, color: accent, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block" }} />
              Plateforme Multi-Services · Afrique de l'Ouest
            </span>
          </div>

          {/* Titre animé */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activity}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ textAlign: "center", marginBottom: 40 }}
            >
              <h1 style={{ color: "#fff", fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 800, lineHeight: 1.12, letterSpacing: -1.5, marginBottom: 14 }}>
                {cfg.hero.split(" ").map((word, i) => (
                  <span key={i} style={{ color: i === 0 ? accent : "#fff" }}>{word}{" "}</span>
                ))}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, maxWidth: 540, margin: "0 auto" }}>{cfg.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* ── Activity Tabs ── */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px", borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", justifyContent: "center" }}>
              {(Object.entries(activityConfig) as [ActivityType, typeof activityConfig[ActivityType]][]).map(([key, val]) => {
                const isActive = activity === key;
                const tabAccent = accentMap[key];
                return (
                  <button
                    key={key}
                    onClick={() => { setActivity(key); setTimeout(() => document.querySelector('[data-hero-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 16px", borderRadius: 10,
                      border: isActive ? `1px solid ${tabAccent}55` : "1px solid transparent",
                      background: isActive ? `${tabAccent}22` : "transparent",
                      color: isActive ? tabAccent : "rgba(255,255,255,0.45)",
                      fontSize: 13, fontWeight: isActive ? 600 : 500,
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: isActive ? `0 0 12px ${tabAccent}33` : "none",
                    }}
                  >
                    {val.icon}
                    <span className="hidden sm:inline">{val.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search panel transport */}
          {activity === "transport" && (
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "24px", backdropFilter: "blur(10px)" }}>
                <TransportSearchPanel />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ GALERIE ══════════════ */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 1.5rem" }}>
          <CarrouselGalerie initialFilter={activity} />
        </div>
      </div>

      {/* ══════════════ ACTIVITY CAROUSEL STATS ══════════════ */}
      <div style={{ background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 1.5rem" }}>
          <ActivityCarousel onActivitySelect={setActivity} />
        </div>
      </div>

      {/* ══════════════ BANNER AD ══════════════ */}
      <div style={{ background: "#000", padding: "48px 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <HealthcareManagementBanner />
        </div>
      </div>

      {/* ══════════════ GALERIES PAR ACTIVITÉ ══════════════ */}
      <GalleriesByActivityType />

      {/* ══════════════ PANNEAUX NON-TRANSPORT ══════════════ */}
      <AnimatePresence mode="wait">
        {activity !== "transport" && (
          <motion.div
            key={activity}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 1.5rem" }}
          >
            {activity === "restauration" && <RestaurantPanel />}
            {activity === "expedition" && <ExpeditionPanel />}
            {activity === "hotel" && <HotelPanel />}
            {activity === "boutique" && <BoutiquePanel />}
            {activity === "agence_voyage" && <AgenceVoyagePanel />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ RECRUTEMENT ══════════════ */}
      <RecruitmentSection />

      {/* ══════════════ AD CAROUSEL ══════════════ */}
      <div style={{ background: "#000", padding: "48px 1.5rem" }}>
        <div style={{ width: "80%", margin: "0 auto" }}>
          <AdCarousel />
        </div>
      </div>

      {/* ══════════════ FOOTER NEXUS ══════════════ */}
      <footer style={{ background: "#06060a", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 0 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 1.5rem 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 48 }}>
            {/* Marque */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${accent}, ${accent}88)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>N</span>
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>NEXUS</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Multi-Services · Afrique</p>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                {t("footer", "description")}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {[Facebook, Instagram, Twitter].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>{t("footer", "services")}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: t("footer", "intercityTransport"), act: "transport" as ActivityType },
                  { label: t("footer", "onlineRestaurant"), act: "restauration" as ActivityType },
                  { label: t("footer", "parcelDelivery"), act: "expedition" as ActivityType },
                  { label: "Commande de Gaz", act: null },
                ].map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => item.act ? (setActivity(item.act), window.scrollTo(0,0)) : navigate("/gas-home")}
                      style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0, transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                    >{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Liens */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>{t("footer", "usefulLinks")}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: t("footer", "companiesSpace"), path: "/register-company" },
                  { label: t("footer", "directory"), path: "/directory" },
                  { label: t("footer", "about"), path: "/about" },
                  { label: t("footer", "legal"), path: "/legal" },
                  { label: "Conditions Générales", path: "/conditions" },
                ].map((l, i) => (
                  <li key={i}>
                    <button onClick={() => navigate(l.path)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                    >{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>{t("footer", "contact")}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <li style={{ display: "flex", gap: 10 }}>
                  <Phone size={15} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 }}>{t("footer", "customerService")}</p>
                    <a href="tel:+2250504921096" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "block", textDecoration: "none" }}>+225 0504921096</a>
                    <a href="tel:+2250701578857" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "block", textDecoration: "none" }}>0701578857</a>
                  </div>
                </li>
                <li style={{ display: "flex", gap: 10 }}>
                  <Mail size={15} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 }}>{t("footer", "email")}</p>
                    <a href="mailto:support@nexus.africa" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none" }}>support@nexus.africa</a>
                  </div>
                </li>
                <li style={{ display: "flex", gap: 10 }}>
                  <MapPin size={15} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 }}>{t("footer", "headquarters")}</p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Abidjan, Cocody Rivièra 2</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              © 2026 <span
                onClick={() => navigate("/transport/dashboard")}
                style={{ color: accent, cursor: "pointer", fontWeight: 600 }}
              >NEXUS</span> — Tous droits réservés
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={12} style={{ color: accent }} />
                Afrique de l'Ouest{" "}
                <span onClick={() => navigate("/csn/dashboard")} style={{ color: accent, cursor: "pointer", textDecoration: "underline dotted" }}>·</span>
              </span>
              <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>{t("footer", "csnPlatform")}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal admin */}
      <AdminLoginModal open={adminLoginOpen} onClose={() => setAdminLoginOpen(false)} />
    </div>
  );
}
