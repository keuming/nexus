import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  ShoppingCart,
  User,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

interface CompanyBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: number;
    companyName: string;
    activityType: string;
    logoUrl?: string;
  } | null;
}

type BookingStep = "service" | "company" | "details" | "payment" | "confirmation";

interface BookingData {
  service: string;
  selectedCompanyId?: number;
  quantity: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: string;
  specialRequests: string;
}

// Prix des bouteilles de gaz
const GAS_PRICES: Record<string, { price: number; delivery: number }> = {
  B6: { price: 2300, delivery: 200 },
  B12: { price: 5500, delivery: 300 },
};

export function CompanyBookingModal({
  open,
  onOpenChange,
  company,
}: CompanyBookingModalProps) {
  const [step, setStep] = useState<BookingStep>("service");
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    service: "",
    quantity: 1,
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
    paymentMethod: "cash",
    specialRequests: "",
  });

  // Charger les compagnies de même type
  const { data: allCompanies = [] } = trpc.transport.public.listCompanies.useQuery();
  
  const filteredCompanies = useMemo(() => {
    if (!company) return [];
    return allCompanies.filter((c: any) => c.activityType === company.activityType);
  }, [allCompanies, company]);

  if (!company) return null;

  const isTransport = company.activityType === "transport";
  const isRestaurant = company.activityType === "restauration";
  const isHotel = company.activityType === "hotel";
  const isExpedition = company.activityType === "expedition";
  const isGas = company.activityType === "gas"; // Pour les bouteilles de gaz

  const handleServiceChange = (field: string, value: any) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDetailsChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === "service") {
      if (!bookingData.service) {
        alert("Veuillez sélectionner un service");
        return;
      }
      // Si c'est du gaz ou une compagnie unique, aller directement aux détails
      if (isGas || filteredCompanies.length === 1) {
        setStep("details");
      } else {
        setStep("company");
      }
    } else if (step === "company") {
      if (!bookingData.selectedCompanyId) {
        alert("Veuillez sélectionner une compagnie");
        return;
      }
      setStep("details");
    } else if (step === "details") {
      if (!bookingData.firstName || !bookingData.phone) {
        alert("Veuillez remplir les champs obligatoires");
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      setStep("confirmation");
    }
  };

  const handlePreviousStep = () => {
    if (step === "company") setStep("service");
    else if (step === "details") {
      if (isGas || filteredCompanies.length === 1) {
        setStep("service");
      } else {
        setStep("company");
      }
    } else if (step === "payment") setStep("details");
    else if (step === "confirmation") setStep("payment");
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Simuler l'envoi de la commande
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // La confirmation s'affiche automatiquement
    } catch (error) {
      alert("Erreur lors de la réservation");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("service");
    setBookingData({
      service: "",
      quantity: 1,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      notes: "",
      paymentMethod: "cash",
      specialRequests: "",
    });
    onOpenChange(false);
  };

  // Calculer le total pour le gaz
  const calculateGasTotal = () => {
    if (!isGas || !bookingData.service) return 0;
    const priceInfo = GAS_PRICES[bookingData.service as keyof typeof GAS_PRICES];
    if (!priceInfo) return 0;
    return (priceInfo.price + priceInfo.delivery) * bookingData.quantity;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.companyName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                {company.companyName[0]}
              </div>
            )}
            <div>
              <DialogTitle>{company.companyName}</DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                {isTransport && "Réservation de transport"}
                {isRestaurant && "Commande de restauration"}
                {isHotel && "Réservation d'hôtel"}
                {isExpedition && "Expédition de colis"}
                {isGas && "Commande de gaz"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6 px-1">
          {(["service", "company", "details", "payment", "confirmation"] as const).map(
            (s, idx) => {
              // Masquer "company" si pas nécessaire
              if (s === "company" && (isGas || filteredCompanies.length === 1)) {
                return null;
              }
              return (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all ${
                      step === s
                        ? "bg-orange-500 text-white"
                        : ["service", "company", "details", "payment"].indexOf(s) <
                            ["service", "company", "details", "payment", "confirmation"].indexOf(step)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {["service", "company", "details", "payment"].indexOf(s) <
                    ["service", "company", "details", "payment", "confirmation"].indexOf(step) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        ["service", "company", "details", "payment"].indexOf(s) <
                        ["service", "company", "details", "payment", "confirmation"].indexOf(step)
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            }
          )}
        </div>

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Sélectionnez votre service
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {isTransport && (
                  <>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "ticket"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "ticket")}
                    >
                      <div className="font-semibold text-sm">Billet de transport</div>
                      <div className="text-xs text-gray-500 mt-1">Réserver un siège</div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "group"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "group")}
                    >
                      <div className="font-semibold text-sm">Réservation groupe</div>
                      <div className="text-xs text-gray-500 mt-1">10+ personnes</div>
                    </Card>
                  </>
                )}

                {isRestaurant && (
                  <>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "delivery"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "delivery")}
                    >
                      <div className="font-semibold text-sm">Livraison</div>
                      <div className="text-xs text-gray-500 mt-1">À domicile</div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "onsite"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "onsite")}
                    >
                      <div className="font-semibold text-sm">Sur place</div>
                      <div className="text-xs text-gray-500 mt-1">Au restaurant</div>
                    </Card>
                  </>
                )}

                {isHotel && (
                  <>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "room"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "room")}
                    >
                      <div className="font-semibold text-sm">Chambre</div>
                      <div className="text-xs text-gray-500 mt-1">Nuitée</div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "event"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "event")}
                    >
                      <div className="font-semibold text-sm">Événement</div>
                      <div className="text-xs text-gray-500 mt-1">Salle de réception</div>
                    </Card>
                  </>
                )}

                {isExpedition && (
                  <>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "standard"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "standard")}
                    >
                      <div className="font-semibold text-sm">Standard</div>
                      <div className="text-xs text-gray-500 mt-1">3-5 jours</div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "express"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "express")}
                    >
                      <div className="font-semibold text-sm">Express</div>
                      <div className="text-xs text-gray-500 mt-1">24h</div>
                    </Card>
                  </>
                )}

                {isGas && (
                  <>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "B6"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "B6")}
                    >
                      <div className="font-semibold text-sm">Bouteille B6</div>
                      <div className="text-xs text-gray-500 mt-1">6kg</div>
                      <div className="text-lg font-bold text-orange-600 mt-2">
                        {GAS_PRICES.B6.price} XOF
                      </div>
                      <div className="text-xs text-gray-500">
                        +{GAS_PRICES.B6.delivery} XOF livraison
                      </div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer border-2 transition-all ${
                        bookingData.service === "B12"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleServiceChange("service", "B12")}
                    >
                      <div className="font-semibold text-sm">Bouteille B12</div>
                      <div className="text-xs text-gray-500 mt-1">12kg</div>
                      <div className="text-lg font-bold text-orange-600 mt-2">
                        {GAS_PRICES.B12.price} XOF
                      </div>
                      <div className="text-xs text-gray-500">
                        +{GAS_PRICES.B12.delivery} XOF livraison
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {bookingData.service && (
              <div>
                <Label htmlFor="quantity" className="text-sm">
                  Quantité
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={bookingData.quantity}
                  onChange={(e) =>
                    handleServiceChange("quantity", parseInt(e.target.value))
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Company Selection (if multiple companies) */}
        {step === "company" && filteredCompanies.length > 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Sélectionnez une compagnie
              </Label>
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredCompanies.map((c: any) => (
                  <Card
                    key={c.id}
                    className={`p-4 cursor-pointer border-2 transition-all ${
                      bookingData.selectedCompanyId === c.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => handleServiceChange("selectedCompanyId", c.id)}
                  >
                    <div className="flex items-center gap-3">
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt={c.companyName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{c.companyName}</div>
                        {c.phone && (
                          <div className="text-xs text-gray-500">{c.phone}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm">
                  Prénom *
                </Label>
                <Input
                  id="firstName"
                  value={bookingData.firstName}
                  onChange={(e) => handleDetailsChange("firstName", e.target.value)}
                  placeholder="Jean"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm">
                  Nom *
                </Label>
                <Input
                  id="lastName"
                  value={bookingData.lastName}
                  onChange={(e) => handleDetailsChange("lastName", e.target.value)}
                  placeholder="Dupont"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm">
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingData.phone}
                  onChange={(e) => handleDetailsChange("phone", e.target.value)}
                  placeholder="+225 07 12 34 56 78"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => handleDetailsChange("email", e.target.value)}
                  placeholder="jean@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm">
                Adresse
              </Label>
              <Input
                id="address"
                value={bookingData.address}
                onChange={(e) => handleDetailsChange("address", e.target.value)}
                placeholder="123 Rue de la Paix"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="city" className="text-sm">
                Ville
              </Label>
              <Input
                id="city"
                value={bookingData.city}
                onChange={(e) => handleDetailsChange("city", e.target.value)}
                placeholder="Abidjan"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm">
                Notes spéciales
              </Label>
              <Textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => handleDetailsChange("notes", e.target.value)}
                placeholder="Allergies, préférences, etc."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-blue-900">Résumé de votre réservation</div>
                  <div className="text-sm text-blue-800 mt-2 space-y-1">
                    <div>Service: <span className="font-semibold">{bookingData.service}</span></div>
                    <div>Quantité: <span className="font-semibold">{bookingData.quantity}</span></div>
                    <div>Nom: <span className="font-semibold">{bookingData.firstName} {bookingData.lastName}</span></div>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Mode de paiement
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {["cash", "mobile_money", "card", "bank_transfer"].map((method) => (
                  <Card
                    key={method}
                    className={`p-4 cursor-pointer border-2 transition-all ${
                      bookingData.paymentMethod === method
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => handleServiceChange("paymentMethod", method)}
                  >
                    <div className="font-semibold text-sm">
                      {method === "cash" && "Espèces"}
                      {method === "mobile_money" && "Mobile Money"}
                      {method === "card" && "Carte bancaire"}
                      {method === "bank_transfer" && "Virement"}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total estimé:</span>
                <span className="text-2xl font-bold text-orange-600">
                  {isGas ? calculateGasTotal().toLocaleString() : (bookingData.quantity * 15000).toLocaleString()} XOF
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Montant estimé, peut varier selon le service
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === "confirmation" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Réservation confirmée!</h3>
              <p className="text-gray-600 mt-2">
                Votre réservation a été envoyée à {company.companyName}
              </p>
            </div>
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro de réservation:</span>
                  <span className="font-semibold">RES-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-semibold">{bookingData.firstName} {bookingData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-semibold">{bookingData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold capitalize">{bookingData.service}</span>
                </div>
              </div>
            </Card>
            <p className="text-xs text-gray-500">
              Vous recevrez une confirmation par SMS et email
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          {step !== "service" && (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="flex-1"
            >
              Précédent
            </Button>
          )}
          {step !== "confirmation" && (
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Suivant <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === "confirmation" && (
            <Button
              onClick={handleClose}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Fermer
            </Button>
          )}
          {step === "payment" && (
            <Button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {loading ? "Traitement..." : "Confirmer la réservation"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
