import DashboardLayout from "@/components/DashboardLayout";
import NewReservationModal from "@/components/NewReservationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  LogIn,
  LogOut,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-800" },
  confirmee: { label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  checkin: { label: "Check-in", color: "bg-emerald-100 text-emerald-800" },
  checkout: { label: "Check-out", color: "bg-gray-100 text-gray-700" },
  annulee: { label: "Annulée", color: "bg-red-100 text-red-800" },
  no_show: { label: "No Show", color: "bg-orange-100 text-orange-800" },
};

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Reservations() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refuseModal, setRefuseModal] = useState<{ id: number; ref: string } | null>(null);
  const [refuseReason, setRefuseReason] = useState("");

  const { data: reservations, isLoading } = trpc.reservations.list.useQuery({});

  const confirmMutation = trpc.reservations.confirm.useMutation({
    onSuccess: () => {
      toast.success("Réservation confirmée !");
      utils.reservations.list.invalidate();
      utils.reservations.getPending.invalidate();
      utils.dashboard.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const refuseMutation = trpc.reservations.refuse.useMutation({
    onSuccess: () => {
      toast.success("Réservation refusée.");
      utils.reservations.list.invalidate();
      utils.reservations.getPending.invalidate();
      utils.dashboard.getStats.invalidate();
      setRefuseModal(null);
      setRefuseReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.reservations.update.useMutation({
    onSuccess: () => {
      toast.success("Réservation mise à jour");
      utils.reservations.list.invalidate();
      utils.dashboard.getStats.invalidate();
      setShowDetail(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = reservations?.filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSearch =
      !search ||
      r.reference?.toLowerCase().includes(search.toLowerCase()) ||
      `${r.clientFirstName} ${r.clientLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      r.roomNumber?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  function handleCheckIn(res: any) {
    updateMutation.mutate({ id: res.id, status: "checkin", actualCheckIn: new Date() });
    // Update room status
  }

  function handleCheckOut(res: any) {
    updateMutation.mutate({ id: res.id, status: "checkout", actualCheckOut: new Date() });
  }

  function handleCancel(res: any) {
    if (confirm("Annuler cette réservation ?")) {
      updateMutation.mutate({ id: res.id, status: "annulee" });
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Réservations
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {reservations?.length ?? 0} réservation{(reservations?.length ?? 0) > 1 ? "s" : ""} au total
            </p>
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nouvelle réservation
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Toutes
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === key ? cfg.color + " ring-2 ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CalendarCheck className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-base font-medium">Aucune réservation trouvée</p>
              <Button className="mt-4" onClick={() => setShowNew(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Créer une réservation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Référence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Chambre</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Check-in</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Check-out</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Payé</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((res, idx) => {
                    const cfg = STATUS_CONFIG[res.status ?? "en_attente"];
                    const total = parseFloat(res.totalAmount ?? "0");
                    const paid = parseFloat(res.paidAmount ?? "0");
                    return (
                      <tr
                        key={res.id}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{res.reference}</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {res.clientFirstName} {res.clientLastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {res.roomNumber ? `Ch. ${res.roomNumber}` : "-"}
                          {res.roomTypeName && <span className="text-xs ml-1 opacity-60">({res.roomTypeName})</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(res.checkInDate)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(res.checkOutDate)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(total)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={paid >= total && total > 0 ? "text-emerald-600 font-medium" : "text-amber-600"}>
                            {formatCurrency(paid)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedRes(res); setShowDetail(true); }}
                              title="Voir détail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {res.status === "confirmee" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700"
                                onClick={() => handleCheckIn(res)}
                                title="Check-in"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {res.status === "checkin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleCheckOut(res)}
                                title="Check-out"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {res.status === "en_attente" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => confirmMutation.mutate({ id: res.id })}
                                  title="Confirmer"
                                  disabled={confirmMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => { setRefuseModal({ id: res.id, ref: res.reference }); setRefuseReason(""); }}
                                  title="Refuser"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {res.status === "confirmee" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-600"
                                onClick={() => handleCancel(res)}
                                title="Annuler"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showNew && <NewReservationModal onClose={() => setShowNew(false)} />}
      {showDetail && selectedRes && (
        <ReservationDetailModal
          reservation={selectedRes}
          onClose={() => { setShowDetail(false); setSelectedRes(null); }}
          onUpdate={(data) => updateMutation.mutate({ id: selectedRes.id, ...data })}
          isPending={updateMutation.isPending}
        />
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
                Réservation <strong className="text-primary">#{refuseModal.ref}</strong> — veuillez indiquer le motif du refus.
              </p>
              <div className="space-y-2">
                <Label htmlFor="refuse-reason">Motif du refus <span className="text-red-500">*</span></Label>
                <Textarea
                  id="refuse-reason"
                  placeholder="Ex : Chambre non disponible, tarif non applicable..."
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRefuseModal(null)}>Annuler</Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  if (!refuseReason.trim()) { toast.error("Veuillez saisir un motif."); return; }
                  refuseMutation.mutate({ id: refuseModal.id, reason: refuseReason.trim() });
                }}
                disabled={refuseMutation.isPending || !refuseReason.trim()}
              >
                <XCircle className="h-4 w-4" />
                {refuseMutation.isPending ? "Refus en cours..." : "Confirmer le refus"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}

function ReservationDetailModal({ reservation: res, onClose, onUpdate, isPending }: {
  reservation: any;
  onClose: () => void;
  onUpdate: (data: any) => void;
  isPending: boolean;
}) {
  const [editStatus, setEditStatus] = useState(res.status);
  const [editNotes, setEditNotes] = useState(res.notes ?? "");

  const { data: services } = trpc.reservations.getServices.useQuery({ reservationId: res.id });
  const { data: payments } = trpc.caisse.getPayments.useQuery({ reservationId: res.id });

  const cfg = STATUS_CONFIG[res.status ?? "en_attente"];
  const total = parseFloat(res.totalAmount ?? "0");
  const paid = parseFloat(res.paidAmount ?? "0");
  const balance = total - paid;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono">{res.reference}</DialogTitle>
            <Badge variant="secondary" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client & Room */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <p className="font-medium">{res.clientFirstName} {res.clientLastName}</p>
              {res.clientPhone && <p className="text-sm text-muted-foreground">{res.clientPhone}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Chambre</p>
              <p className="font-medium">Ch. {res.roomNumber}</p>
              <p className="text-sm text-muted-foreground">{res.roomTypeName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Check-in</p>
              <p className="font-medium">{formatDate(res.checkInDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Check-out</p>
              <p className="font-medium">{formatDate(res.checkOutDate)}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-foreground">{new Intl.NumberFormat("fr-FR").format(total)} FCFA</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Payé</p>
              <p className="font-bold text-emerald-700">{new Intl.NumberFormat("fr-FR").format(paid)} FCFA</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${balance > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
              <p className="text-xs text-muted-foreground">Solde</p>
              <p className={`font-bold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {new Intl.NumberFormat("fr-FR").format(Math.abs(balance))} FCFA
              </p>
            </div>
          </div>

          {/* Services */}
          {services && services.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Services additionnels</p>
              <div className="space-y-1">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">{s.serviceName} × {s.quantity}</span>
                    <span className="font-medium">{new Intl.NumberFormat("fr-FR").format(parseFloat(s.totalPrice ?? "0"))} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments && payments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Paiements</p>
              <div className="space-y-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">
                      {new Date(p.paidAt).toLocaleDateString("fr-FR")} — {p.method}
                    </span>
                    <span className="font-medium text-emerald-600">+{new Intl.NumberFormat("fr-FR").format(parseFloat(p.amount ?? "0"))} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Status */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Changer le statut</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
              <Button
                className="flex-1"
                disabled={isPending}
                onClick={() => onUpdate({ status: editStatus, notes: editNotes })}
              >
                {isPending ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
