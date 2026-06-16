import DashboardLayout from "@/components/DashboardLayout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  Edit2,
  Gift,
  Percent,
  Plus,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Offer = {
  id: number;
  title: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: string;
  minNights: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  badgeLabel: string | null;
  active: boolean;
  createdAt: Date;
};

function formatDiscount(offer: Offer) {
  const val = parseFloat(offer.discountValue);
  return offer.discountType === "percent"
    ? `-${val}%`
    : `-${new Intl.NumberFormat("fr-FR").format(val)} FCFA`;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(offer: Offer) {
  if (!offer.validUntil) return false;
  return new Date(offer.validUntil) < new Date();
}

function isUpcoming(offer: Offer) {
  if (!offer.validFrom) return false;
  return new Date(offer.validFrom) > new Date();
}

export default function OffresSpeciales() {
  return (
    <DashboardLayout>
      <OffresContent />
    </DashboardLayout>
  );
}

function OffresContent() {
  const utils = trpc.useUtils();
  const { data: offers, isLoading } = trpc.specialOffers.listAdmin.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);

  const deleteMutation = trpc.specialOffers.delete.useMutation({
    onSuccess: () => { utils.specialOffers.listAdmin.invalidate(); toast.success("Offre supprimée"); },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.specialOffers.update.useMutation({
    onSuccess: () => { utils.specialOffers.listAdmin.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const activeOffers = offers?.filter((o) => o.active && !isExpired(o) && !isUpcoming(o)) ?? [];
  const inactiveOffers = offers?.filter((o) => !o.active || isExpired(o) || isUpcoming(o)) ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Offres spéciales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos promotions affichées sur votre page publique
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => { setEditing(null); setShowModal(true); }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle offre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{offers?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeOffers.length}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-500/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inactiveOffers.length}</p>
              <p className="text-xs text-muted-foreground">Inactives / expirées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !offers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Gift className="h-14 w-14 mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">Aucune offre spéciale</p>
            <p className="text-xs text-center max-w-xs">
              Créez des promotions pour attirer plus de clients sur votre page publique.
            </p>
            <Button
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              size="sm"
              onClick={() => { setEditing(null); setShowModal(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une offre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const expired = isExpired(offer);
            const upcoming = isUpcoming(offer);
            const statusLabel = expired ? "Expirée" : upcoming ? "À venir" : offer.active ? "Active" : "Inactive";
            const statusColor = expired
              ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              : upcoming
              ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
              : offer.active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400";

            return (
              <Card key={offer.id} className={`transition-all ${!offer.active || expired ? "opacity-70" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Discount badge */}
                      <div className="h-14 w-14 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                        <Percent className="h-4 w-4 text-amber-500 mb-0.5" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight text-center">
                          {formatDiscount(offer as Offer)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{offer.title}</h3>
                          {offer.badgeLabel && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0 text-xs">
                              {offer.badgeLabel}
                            </Badge>
                          )}
                          <Badge className={`text-xs border-0 ${statusColor}`}>{statusLabel}</Badge>
                        </div>

                        {offer.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{offer.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {offer.minNights && offer.minNights > 1 && (
                            <span>Minimum {offer.minNights} nuit{offer.minNights > 1 ? "s" : ""}</span>
                          )}
                          {(offer.validFrom || offer.validUntil) && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(offer.validFrom)} → {formatDate(offer.validUntil)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle active */}
                      <button
                        onClick={() => toggleMutation.mutate({ id: offer.id, active: !offer.active })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={offer.active ? "Désactiver" : "Activer"}
                      >
                        {offer.active
                          ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                          : <ToggleLeft className="h-6 w-6" />
                        }
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditing(offer as Offer); setShowModal(true); }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm("Supprimer cette offre ?")) deleteMutation.mutate({ id: offer.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <OfferModal
          offer={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => {
            utils.specialOffers.listAdmin.invalidate();
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function OfferModal({ offer, onClose, onSaved }: { offer: Offer | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!offer;

  const [form, setForm] = useState({
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    discountType: (offer?.discountType ?? "percent") as "percent" | "fixed",
    discountValue: offer ? parseFloat(offer.discountValue) : 0,
    minNights: offer?.minNights ?? 1,
    validFrom: offer?.validFrom ? new Date(offer.validFrom).toISOString().split("T")[0] : "",
    validUntil: offer?.validUntil ? new Date(offer.validUntil).toISOString().split("T")[0] : "",
    badgeLabel: offer?.badgeLabel ?? "",
    active: offer?.active ?? true,
  });

  const createMutation = trpc.specialOffers.create.useMutation({
    onSuccess: () => { toast.success("Offre créée !"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.specialOffers.update.useMutation({
    onSuccess: () => { toast.success("Offre mise à jour !"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }
    if (form.discountValue <= 0) { toast.error("La remise doit être supérieure à 0"); return; }

    const payload = {
      title: form.title,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minNights: form.minNights,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
      badgeLabel: form.badgeLabel || undefined,
      active: form.active,
    };

    if (isEdit && offer) {
      updateMutation.mutate({ id: offer.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            {isEdit ? "Modifier l'offre" : "Nouvelle offre spéciale"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titre de l'offre *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Offre été 2026, Pack romantique..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez les conditions et avantages de cette offre..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de remise *</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => setForm(f => ({ ...f, discountType: v as "percent" | "fixed" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valeur de la remise *</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={form.discountType === "percent" ? 1 : 500}
                  value={form.discountValue}
                  onChange={(e) => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {form.discountType === "percent" ? "%" : "FCFA"}
                </span>
              </div>
            </div>
          </div>

          {/* Badge label */}
          <div className="space-y-1.5">
            <Label>Étiquette badge <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input
              value={form.badgeLabel}
              onChange={(e) => setForm(f => ({ ...f, badgeLabel: e.target.value }))}
              placeholder="Ex: Promo été, -20%, Offre limitée..."
              maxLength={50}
            />
          </div>

          {/* Min nights */}
          <div className="space-y-1.5">
            <Label>Nombre de nuits minimum</Label>
            <Input
              type="number"
              min={1}
              value={form.minNights}
              onChange={(e) => setForm(f => ({ ...f, minNights: parseInt(e.target.value) || 1 }))}
            />
          </div>

          {/* Validity dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valide à partir du</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valide jusqu'au</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Offre active</p>
              <p className="text-xs text-muted-foreground">Visible sur la page publique</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))}
            />
          </div>

          {/* Preview */}
          {form.title && form.discountValue > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Aperçu du badge</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-white border-0">
                  {form.badgeLabel || (form.discountType === "percent" ? `-${form.discountValue}%` : `-${form.discountValue} FCFA`)}
                </Badge>
                <span className="text-sm font-medium text-foreground">{form.title}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isPending}
            >
              {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer l'offre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
