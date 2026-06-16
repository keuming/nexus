import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPrice(v: string | null | undefined) {
  if (!v) return "0 FCFA";
  return new Intl.NumberFormat("fr-FR").format(parseFloat(v)) + " FCFA";
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export default function ReservationsEnAttente() {
  const utils = trpc.useUtils();
  const { data: pending = [], isLoading, refetch } = trpc.reservations.getPending.useQuery();

  const [refuseModal, setRefuseModal] = useState<{ id: number; ref: string } | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: number; ref: string } | null>(null);

  const confirmMutation = trpc.reservations.confirm.useMutation({
    onSuccess: () => {
      toast.success("Réservation confirmée avec succès !");
      utils.reservations.getPending.invalidate();
      utils.reservations.list.invalidate();
      utils.dashboard.getStats.invalidate();
      setConfirmModal(null);
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const refuseMutation = trpc.reservations.refuse.useMutation({
    onSuccess: () => {
      toast.success("Réservation refusée.");
      utils.reservations.getPending.invalidate();
      utils.reservations.list.invalidate();
      utils.dashboard.getStats.invalidate();
      setRefuseModal(null);
      setRefuseReason("");
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-amber-500" />
              Réservations en attente
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {pending.length} réservation{pending.length !== 1 ? "s" : ""} en attente de traitement
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Empty state */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 opacity-60" />
              <p className="text-lg font-medium">Aucune réservation en attente</p>
              <p className="text-sm">Toutes les réservations ont été traitées.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pending.map((r: any) => {
              const nights = nightsBetween(r.checkInDate, r.checkOutDate);
              return (
                <Card key={r.id} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Infos principales */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-foreground text-base">#{r.reference}</span>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                          {r.source && r.source !== "direct" && (
                            <Badge variant="outline" className="text-xs capitalize">{r.source}</Badge>
                          )}
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground">
                            {r.clientFirstName} {r.clientLastName}
                          </span>
                          {r.clientEmail && (
                            <a href={`mailto:${r.clientEmail}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="text-xs">{r.clientEmail}</span>
                            </a>
                          )}
                          {r.clientPhone && (
                            <a href={`tel:${r.clientPhone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="text-xs">{r.clientPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Chambre & dates */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <BedDouble className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Chambre</p>
                              <p className="font-medium">{r.roomNumber ?? `#${r.roomId}`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Arrivée</p>
                              <p className="font-medium">{formatDate(r.checkInDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-red-400 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Départ</p>
                              <p className="font-medium">{formatDate(r.checkOutDate)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Nuits & montant */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            <strong className="text-foreground">{nights}</strong> nuit{nights > 1 ? "s" : ""}
                            {r.adults ? ` · ${r.adults} adulte${r.adults > 1 ? "s" : ""}` : ""}
                            {r.children ? ` · ${r.children} enfant${r.children > 1 ? "s" : ""}` : ""}
                          </span>
                          <span className="font-bold text-primary">{formatPrice(r.totalAmount)}</span>
                        </div>

                        {r.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1">
                            💬 {r.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Button
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none sm:w-36"
                          onClick={() => setConfirmModal({ id: r.id, ref: r.reference })}
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmer
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-red-300 text-red-600 hover:bg-red-50 flex-1 sm:flex-none sm:w-36"
                          onClick={() => { setRefuseModal({ id: r.id, ref: r.reference }); setRefuseReason(""); }}
                          disabled={refuseMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Confirmation */}
      {confirmModal && (
        <Dialog open onOpenChange={() => setConfirmModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                Confirmer la réservation
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Vous êtes sur le point de <strong className="text-foreground">confirmer</strong> la réservation{" "}
                <strong className="text-primary">#{confirmModal.ref}</strong>.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Le statut passera à <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">Confirmée</Badge>.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Annuler</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => confirmMutation.mutate({ id: confirmModal.id })}
                disabled={confirmMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirmMutation.isPending ? "Confirmation..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Refus */}
      {refuseModal && (
        <Dialog open onOpenChange={() => setRefuseModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Refuser la réservation
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous êtes sur le point de <strong className="text-foreground">refuser</strong> la réservation{" "}
                <strong className="text-primary">#{refuseModal.ref}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Motif du refus <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ex : Chambre non disponible sur cette période, tarif non applicable..."
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Ce motif sera enregistré dans l'historique de la réservation.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRefuseModal(null)}>Annuler</Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  if (!refuseReason.trim()) {
                    toast.error("Veuillez saisir un motif de refus.");
                    return;
                  }
                  refuseMutation.mutate({ id: refuseModal.id, reason: refuseReason.trim() });
                }}
                disabled={refuseMutation.isPending || !refuseReason.trim()}
              >
                <XCircle className="h-4 w-4" />
                {refuseMutation.isPending ? "Refus en cours..." : "Refuser"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
