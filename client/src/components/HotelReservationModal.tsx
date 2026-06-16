import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface HotelReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: number;
  hotelName: string;
  roomId?: number;
  roomName?: string;
  roomPrice?: number;
}

export function HotelReservationModal({
  open,
  onOpenChange,
  hotelId,
  hotelName,
  roomId,
  roomName,
  roomPrice,
}: HotelReservationModalProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfNights: 1,
    numberOfRooms: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientPhone || !formData.checkInDate || !formData.checkOutDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationNumber = `RES-${Date.now()}`;
      toast.success(`Réservation confirmée! Numéro: ${reservationNumber}`);
      onOpenChange(false);
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        checkInDate: "",
        checkOutDate: "",
        numberOfNights: 1,
        numberOfRooms: 1,
      });
    } catch (error) {
      toast.error("Erreur lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (field: "checkInDate" | "checkOutDate", value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (updated.checkInDate && updated.checkOutDate) {
        const checkIn = new Date(updated.checkInDate);
        const checkOut = new Date(updated.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        updated.numberOfNights = Math.max(1, nights);
      }
      return updated;
    });
  };

  const totalPrice = roomPrice ? roomPrice * formData.numberOfNights * formData.numberOfRooms : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Réserver une chambre</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hotel Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Hôtel</p>
            <p className="font-semibold">{hotelName}</p>
            {roomName && (
              <>
                <p className="text-sm text-gray-600 mt-2">Chambre</p>
                <p className="font-semibold">{roomName}</p>
              </>
            )}
            {roomPrice && (
              <>
                <p className="text-sm text-gray-600 mt-2">Prix par nuit</p>
                <p className="font-semibold">{roomPrice.toLocaleString()} FCFA</p>
              </>
            )}
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="clientName">Nom complet *</Label>
              <Input
                id="clientName"
                placeholder="Jean Dupont"
                value={formData.clientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="clientPhone">Téléphone *</Label>
              <Input
                id="clientPhone"
                placeholder="+225 07 12 34 56 78"
                value={formData.clientPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="jean@example.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="checkInDate">Date d'arrivée *</Label>
              <Input
                id="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={(e) => handleDateChange("checkInDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="checkOutDate">Date de départ *</Label>
              <Input
                id="checkOutDate"
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => handleDateChange("checkOutDate", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="numberOfNights">Nuits</Label>
                <Input
                  id="numberOfNights"
                  type="number"
                  min="1"
                  value={formData.numberOfNights}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numberOfNights: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <Label htmlFor="numberOfRooms">Chambres</Label>
                <Input
                  id="numberOfRooms"
                  type="number"
                  min="1"
                  value={formData.numberOfRooms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numberOfRooms: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>

          {/* Total Price */}
          {roomPrice && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-bold text-lg">{totalPrice.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Confirmer la Réservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
