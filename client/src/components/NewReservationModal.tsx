import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Props {
  onClose: () => void;
}

export default function NewReservationModal({ onClose }: Props) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery({});

  const [form, setForm] = useState({
    clientId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    adults: "1",
    notes: "",
    source: "direct" as const,
  });

  const createMutation = trpc.reservations.create.useMutation({
    onSuccess: (ref) => {
      toast.success(`Réservation ${ref} créée avec succès`);
      utils.dashboard.getStats.invalidate();
      utils.reservations.list.invalidate();
      onClose();
      setLocation("/reservations");
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  const availableRooms = rooms?.filter((r) => r.status === "libre") ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.roomId || !form.checkInDate || !form.checkOutDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    // Calculate nights and total
    const checkIn = new Date(form.checkInDate);
    const checkOut = new Date(form.checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const room = rooms?.find((r) => r.id === parseInt(form.roomId));
    const price = parseFloat(room?.priceOverride ?? room?.basePrice ?? "0");
    const total = (nights * price).toString();

    createMutation.mutate({
      clientId: parseInt(form.clientId),
      roomId: parseInt(form.roomId),
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      adults: parseInt(form.adults),
      source: form.source,
      notes: form.notes || undefined,
      totalAmount: total,
      status: "confirmee",
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Chambre disponible *</Label>
            <Select value={form.roomId} onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une chambre" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    Ch. {r.number} — {r.typeName} ({r.priceOverride ?? r.basePrice} FCFA/nuit)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check-in *</Label>
              <Input
                type="date"
                value={form.checkInDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out *</Label>
              <Input
                type="date"
                value={form.checkOutDate}
                min={form.checkInDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Adultes</Label>
              <Input
                type="number"
                min="1"
                value={form.adults}
                onChange={(e) => setForm((f) => ({ ...f, adults: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v: any) => setForm((f) => ({ ...f, source: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="expedia">Expedia</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              placeholder="Notes optionnelles..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer la réservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
