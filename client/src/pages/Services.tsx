import DashboardLayout from "@/components/DashboardLayout";
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
  Edit,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  restauration: { label: "Restauration", color: "bg-orange-100 text-orange-800" },
  spa: { label: "Spa & Bien-être", color: "bg-purple-100 text-purple-800" },
  blanchisserie: { label: "Blanchisserie", color: "bg-blue-100 text-blue-800" },
  transport: { label: "Transport", color: "bg-green-100 text-green-800" },
  excursion: { label: "Excursion", color: "bg-teal-100 text-teal-800" },
  autre: { label: "Autre", color: "bg-gray-100 text-gray-700" },
};

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

export default function Services() {
  const utils = trpc.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [showAddToRes, setShowAddToRes] = useState(false);

  const { data: services, isLoading } = trpc.services.list.useQuery();

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => { toast.success("Service créé"); utils.services.list.invalidate(); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => { toast.success("Service mis à jour"); utils.services.list.invalidate(); setShowModal(false); setEditService(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => { toast.success("Service supprimé"); utils.services.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const grouped = services?.reduce((acc, s) => {
    const cat = s.category ?? "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, typeof services>) ?? {};

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Services
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {services?.length ?? 0} service{(services?.length ?? 0) > 1 ? "s" : ""} disponible{(services?.length ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddToRes(true)} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Facturer un service
            </Button>
            <Button onClick={() => { setEditService(null); setShowModal(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau service
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !services?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Utensils className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-base font-medium">Aucun service configuré</p>
            <Button className="mt-4" onClick={() => { setEditService(null); setShowModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un service
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => {
              const cfg = CATEGORIES[cat] ?? CATEGORIES.autre;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</Badge>
                    <span className="text-xs text-muted-foreground">({items?.length ?? 0} service{(items?.length ?? 0) > 1 ? "s" : ""})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items?.map((service) => (
                      <Card key={service.id} className="border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{service.name}</h3>
                              {service.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className={`ml-2 text-xs shrink-0 ${service.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                              {service.active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="text-lg font-bold text-primary">{formatCurrency(parseFloat(service.price ?? "0"))}</p>
                              {service.unit && <p className="text-xs text-muted-foreground">par {service.unit}</p>}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setEditService(service); setShowModal(true); }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-600"
                                onClick={() => { if (confirm("Supprimer ce service ?")) deleteMutation.mutate({ id: service.id }); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          service={editService}
          onClose={() => { setShowModal(false); setEditService(null); }}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {showAddToRes && (
        <AddServiceToReservationModal
          services={services ?? []}
          onClose={() => setShowAddToRes(false)}
          onSuccess={() => { utils.reservations.list.invalidate(); setShowAddToRes(false); }}
        />
      )}
    </DashboardLayout>
  );
}

function ServiceModal({ service, onClose, onCreate, onUpdate, isPending }: {
  service: any;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (id: number, data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service?.price ?? "",
    category: service?.category ?? "restauration",
    unit: service?.unit ?? "unité",
    isActive: service?.isActive ?? true,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error("Nom et prix obligatoires"); return; }
    const data = {
      name: form.name,
      description: form.description || undefined,
      price: form.price,
      category: form.category as any,
      unit: form.unit || undefined,
      isActive: form.isActive,
    };
    if (service) onUpdate(service.id, data);
    else onCreate(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Modifier le service" : "Nouveau service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom du service *</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Petit-déjeuner continental" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix (FCFA) *</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="personne, nuit, kg..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <Label htmlFor="isActive">Service actif</Label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Enregistrement..." : service ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddServiceToReservationModal({ services, onClose, onSuccess }: {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ reservationId: "", serviceId: "", quantity: "1", notes: "" });
  const { data: reservations } = trpc.reservations.list.useQuery({});

  const addMutation = trpc.reservations.addService.useMutation({
    onSuccess: () => { toast.success("Service facturé avec succès"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const activeServices = services.filter(s => s.active !== false);
  const selectedService = activeServices.find(s => s.id === parseInt(form.serviceId));
  const total = selectedService ? parseFloat(selectedService.price ?? "0") * parseInt(form.quantity || "1") : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reservationId || !form.serviceId) { toast.error("Réservation et service obligatoires"); return; }
    const qty = parseInt(form.quantity);
    const unitPrice = selectedService ? selectedService.price : "0";
    const totalPriceVal = selectedService ? (parseFloat(selectedService.price ?? "0") * qty).toString() : "0";
    addMutation.mutate({
      reservationId: parseInt(form.reservationId),
      serviceId: parseInt(form.serviceId),
      quantity: qty,
      unitPrice,
      totalPrice: totalPriceVal,
      notes: form.notes || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Facturer un service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Réservation *</Label>
            <Select value={form.reservationId} onValueChange={(v) => setForm(f => ({ ...f, reservationId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une réservation" /></SelectTrigger>
              <SelectContent>
                {reservations?.filter(r => r.status === "checkin" || r.status === "confirmee").map(r => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.reference} — {r.clientFirstName} {r.clientLastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service *</Label>
            <Select value={form.serviceId} onValueChange={(v) => setForm(f => ({ ...f, serviceId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
              <SelectContent>
                {activeServices.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} — {new Intl.NumberFormat("fr-FR").format(parseFloat(s.price ?? "0"))} FCFA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantité</Label>
            <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          {total > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total à facturer</span>
              <span className="font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={addMutation.isPending}>{addMutation.isPending ? "Facturation..." : "Facturer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
