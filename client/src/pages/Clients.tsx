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
  CalendarCheck,
  Edit,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

export default function Clients() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [viewClient, setViewClient] = useState<any>(null);

  const { data: clients, isLoading } = trpc.clients.list.useQuery({ search: search || undefined });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { toast.success("Client créé"); utils.clients.list.invalidate(); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Client mis à jour"); utils.clients.list.invalidate(); setShowModal(false); setEditClient(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { toast.success("Client supprimé"); utils.clients.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Clients
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {clients?.length ?? 0} client{(clients?.length ?? 0) > 1 ? "s" : ""} enregistré{(clients?.length ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => { setEditClient(null); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card className="border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : !clients?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-base font-medium">Aucun client trouvé</p>
              <Button className="mt-4" onClick={() => { setEditClient(null); setShowModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Contact</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nationalité</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Séjours</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">CA Total</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Depuis</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, idx) => (
                    <tr
                      key={client.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {client.firstName?.[0]}{client.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {client.firstName} {client.lastName}
                            </p>
                            {client.company && (
                              <p className="text-xs text-muted-foreground">{client.company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{client.nationality || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${client.clientType === "vip" ? "bg-amber-100 text-amber-800" : client.clientType === "corporate" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                          {client.clientType === "vip" ? "VIP" : client.clientType === "corporate" ? "Corporate" : "Standard"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-foreground font-medium">
                        {client.totalStays ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-amber-600">
                        {formatCurrency(parseFloat(client.totalRevenue ?? "0"))}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(client.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewClient(client)} title="Voir profil">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditClient(client); setShowModal(true); }} title="Modifier">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600"
                            onClick={() => { if (confirm("Supprimer ce client ?")) deleteMutation.mutate({ id: client.id }); }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showModal && (
        <ClientModal
          client={editClient}
          onClose={() => { setShowModal(false); setEditClient(null); }}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {viewClient && (
        <ClientProfileModal
          client={viewClient}
          onClose={() => setViewClient(null)}
          onEdit={() => { setEditClient(viewClient); setViewClient(null); setShowModal(true); }}
        />
      )}
    </DashboardLayout>
  );
}

function ClientModal({ client, onClose, onCreate, onUpdate, isPending }: {
  client: any;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (id: number, data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    nationality: client?.nationality ?? "",
    idType: client?.idType ?? "passeport",
    idNumber: client?.idNumber ?? "",
    address: client?.address ?? "",
    company: client?.company ?? "",
    clientType: client?.clientType ?? "standard",
    notes: client?.notes ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error("Prénom et nom obligatoires"); return; }
    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      nationality: form.nationality || undefined,
      idType: form.idType as any,
      idNumber: form.idNumber || undefined,
      address: form.address || undefined,
      company: form.company || undefined,
      clientType: form.clientType as any,
      notes: form.notes || undefined,
    };
    if (client) onUpdate(client.id, data);
    else onCreate(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nationalité</Label>
              <Input value={form.nationality} onChange={(e) => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="Française, Sénégalaise..." />
            </div>
            <div className="space-y-1.5">
              <Label>Type de client</Label>
              <Select value={form.clientType} onValueChange={(v) => setForm(f => ({ ...f, clientType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="groupe">Groupe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de pièce d'identité</Label>
              <Select value={form.idType} onValueChange={(v) => setForm(f => ({ ...f, idType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passeport">Passeport</SelectItem>
                  <SelectItem value="cni">CNI</SelectItem>
                  <SelectItem value="permis">Permis de conduire</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Numéro de pièce</Label>
              <Input value={form.idNumber} onChange={(e) => setForm(f => ({ ...f, idNumber: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Entreprise</Label>
            <Input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Préférences</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Préférences, allergies, notes spéciales..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Enregistrement..." : client ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClientProfileModal({ client, onClose, onEdit }: { client: any; onClose: () => void; onEdit: () => void }) {
  const { data: reservations } = trpc.clients.getReservations.useQuery({ clientId: client.id });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Profil client</DialogTitle>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Modifier
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {client.firstName?.[0]}{client.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{client.firstName} {client.lastName}</h3>
                <Badge variant="secondary" className={`text-xs ${client.clientType === "vip" ? "bg-amber-100 text-amber-800" : client.clientType === "corporate" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                  {client.clientType === "vip" ? "VIP" : client.clientType === "corporate" ? "Corporate" : "Standard"}
                </Badge>
              </div>
              {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                {client.email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />{client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />{client.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Séjours</p>
              <p className="text-2xl font-bold text-foreground">{client.totalStays ?? 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">CA Total</p>
              <p className="text-lg font-bold text-amber-700">{new Intl.NumberFormat("fr-FR").format(parseFloat(client.totalRevenue ?? "0"))} FCFA</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Client depuis</p>
              <p className="text-sm font-bold text-foreground">{formatDate(client.createdAt)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {client.nationality && (
              <div><span className="text-muted-foreground">Nationalité :</span> <span className="font-medium">{client.nationality}</span></div>
            )}
            {client.idNumber && (
              <div><span className="text-muted-foreground">{client.idType} :</span> <span className="font-medium">{client.idNumber}</span></div>
            )}
            {client.address && (
              <div className="col-span-2"><span className="text-muted-foreground">Adresse :</span> <span className="font-medium">{client.address}</span></div>
            )}
          </div>

          {client.notes && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs font-medium text-amber-800 mb-1">Notes / Préférences</p>
              <p className="text-sm text-amber-700">{client.notes}</p>
            </div>
          )}

          {/* Reservation History */}
          {reservations && reservations.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Historique des séjours
              </p>
              <div className="space-y-2">
                {reservations.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                    <div>
                      <span className="font-mono text-primary text-xs">{r.reference}</span>
                      <span className="text-muted-foreground ml-2">Ch. {r.roomNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground text-xs">{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}</span>
                      <span className="ml-3 font-medium">{new Intl.NumberFormat("fr-FR").format(parseFloat(r.totalAmount ?? "0"))} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
