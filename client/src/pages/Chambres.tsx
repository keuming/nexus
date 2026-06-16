import DashboardLayout from "@/components/DashboardLayout";
import GaleriePhotos from "@/components/GaleriePhotos";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BedDouble,
  Camera,
  Edit,
  Grid3X3,
  List,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  libre: { label: "Libre", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  occupee: { label: "Occupée", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  maintenance: { label: "Maintenance", color: "bg-red-100 text-red-800", dot: "bg-red-500" },
  reservee: { label: "Réservée", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  nettoyage: { label: "Nettoyage", color: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
};

type RoomStatus = "libre" | "occupee" | "maintenance" | "reservee" | "nettoyage";

export default function Chambres() {
  const utils = trpc.useUtils();
  const { data: rooms, isLoading } = trpc.rooms.list.useQuery();
  const { data: roomTypes } = trpc.roomTypes.list.useQuery();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [editType, setEditType] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [galerieRoom, setGalerieRoom] = useState<{ id: number; number: string } | null>(null);

  const createRoom = trpc.rooms.create.useMutation({
    onSuccess: () => { toast.success("Chambre créée"); utils.rooms.list.invalidate(); utils.dashboard.getStats.invalidate(); setShowRoomModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoom = trpc.rooms.update.useMutation({
    onSuccess: () => { toast.success("Chambre mise à jour"); utils.rooms.list.invalidate(); utils.dashboard.getStats.invalidate(); setShowRoomModal(false); setEditRoom(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRoom = trpc.rooms.delete.useMutation({
    onSuccess: () => { toast.success("Chambre supprimée"); utils.rooms.list.invalidate(); utils.dashboard.getStats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const createType = trpc.roomTypes.create.useMutation({
    onSuccess: () => { toast.success("Type créé"); utils.roomTypes.list.invalidate(); setShowTypeModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateType = trpc.roomTypes.update.useMutation({
    onSuccess: () => { toast.success("Type mis à jour"); utils.roomTypes.list.invalidate(); setShowTypeModal(false); setEditType(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteType = trpc.roomTypes.delete.useMutation({
    onSuccess: () => { toast.success("Type supprimé"); utils.roomTypes.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filteredRooms = rooms?.filter((r) => filterStatus === "all" || r.status === filterStatus) ?? [];

  const statusCounts = rooms?.reduce((acc, r) => {
    acc[r.status ?? "libre"] = (acc[r.status ?? "libre"] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Chambres
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {rooms?.length ?? 0} chambre{(rooms?.length ?? 0) > 1 ? "s" : ""} au total
            </p>
          </div>
          <Button onClick={() => { setEditRoom(null); setShowRoomModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle chambre
          </Button>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Toutes ({rooms?.length ?? 0})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === key ? cfg.color + " ring-2 ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {cfg.label} ({statusCounts[key] ?? 0})
            </button>
          ))}
        </div>

        <Tabs defaultValue="chambres">
          <TabsList>
            <TabsTrigger value="chambres">Chambres</TabsTrigger>
            <TabsTrigger value="types">Types de chambres</TabsTrigger>
          </TabsList>

          <TabsContent value="chambres" className="mt-4">
            <div className="flex justify-end mb-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setView("grid")} className={view === "grid" ? "bg-muted" : ""}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("list")} className={view === "list" ? "bg-muted" : ""}>
                <List className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <BedDouble className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-base font-medium">Aucune chambre trouvée</p>
                <p className="text-sm mt-1">Ajoutez d'abord des types de chambres, puis créez vos chambres.</p>
                <Button className="mt-4" onClick={() => { setEditRoom(null); setShowRoomModal(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une chambre
                </Button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRooms.map((room) => {
                  const cfg = STATUS_CONFIG[room.status ?? "libre"];
                  return (
                    <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer group border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${cfg.dot}`} />
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setGalerieRoom({ id: room.id, number: room.number }); }}
                              className="p-1 rounded hover:bg-blue-50"
                              title="Galerie photos"
                            >
                              <Camera className="h-3.5 w-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditRoom(room); setShowRoomModal(true); }}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer cette chambre ?")) deleteRoom.mutate({ id: room.id }); }}
                              className="p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{room.number}</div>
                        <div className="text-xs text-muted-foreground mb-2">Étage {room.floor}</div>
                        <Badge variant="secondary" className={`text-xs ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                        <div className="mt-2 text-xs font-medium text-muted-foreground">
                          {room.typeName}
                        </div>
                        <div className="text-xs text-amber-600 font-semibold mt-0.5">
                          {parseFloat(room.priceOverride ?? room.basePrice ?? "0").toLocaleString("fr-FR")} FCFA/nuit
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">N°</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Étage</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tarif/nuit</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Capacité</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRooms.map((room, idx) => {
                        const cfg = STATUS_CONFIG[room.status ?? "libre"];
                        return (
                          <tr key={room.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                            <td className="px-4 py-3 text-sm font-bold text-foreground">Ch. {room.number}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{room.floor}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{room.typeName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-amber-600">
                              {parseFloat(room.priceOverride ?? room.basePrice ?? "0").toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{room.capacity} pers.</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700" onClick={() => setGalerieRoom({ id: room.id, number: room.number })} title="Galerie photos">
                                  <Camera className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditRoom(room); setShowRoomModal(true); }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => { if (confirm("Supprimer cette chambre ?")) deleteRoom.mutate({ id: room.id }); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditType(null); setShowTypeModal(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau type
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomTypes?.map((type) => (
                <Card key={type.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditType(type); setShowTypeModal(true); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm("Supprimer ce type ?")) deleteType.mutate({ id: type.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{type.description || "Aucune description"}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarif de base</span>
                      <span className="font-semibold text-amber-600">{parseFloat(type.basePrice ?? "0").toLocaleString("fr-FR")} FCFA/nuit</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Capacité</span>
                      <span className="font-medium">{type.capacity} personnes</span>
                    </div>
                    {type.amenities && (
                      <div className="mt-2 text-xs text-muted-foreground">{type.amenities}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!roomTypes || roomTypes.length === 0) && (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Wrench className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">Aucun type de chambre défini</p>
                  <Button className="mt-3" onClick={() => { setEditType(null); setShowTypeModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un type
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Room Modal */}
      {showRoomModal && (
        <RoomModal
          room={editRoom}
          roomTypes={roomTypes ?? []}
          onClose={() => { setShowRoomModal(false); setEditRoom(null); }}
          onCreate={(data) => createRoom.mutate(data)}
          onUpdate={(id, data) => updateRoom.mutate({ id, ...data })}
          isPending={createRoom.isPending || updateRoom.isPending}
        />
      )}

      {/* Room Type Modal */}
      {showTypeModal && (
        <RoomTypeModal
          type={editType}
          onClose={() => { setShowTypeModal(false); setEditType(null); }}
          onCreate={(data) => createType.mutate(data)}
          onUpdate={(id, data) => updateType.mutate({ id, ...data })}
          isPending={createType.isPending || updateType.isPending}
        />
      )}
      {/* Galerie Photos Modal */}
      {galerieRoom && (
        <GaleriePhotos
          roomId={galerieRoom.id}
          roomNumber={galerieRoom.number}
          open={!!galerieRoom}
          onClose={() => setGalerieRoom(null)}
        />
      )}
    </DashboardLayout>
  );
}

function RoomModal({ room, roomTypes, onClose, onCreate, onUpdate, isPending }: { room: any; roomTypes: any[]; onClose: () => void; onCreate: (data: any) => void; onUpdate: (id: number, data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    number: room?.number ?? "",
    floor: room?.floor?.toString() ?? "1",
    roomTypeId: room?.roomTypeId?.toString() ?? "",
    status: room?.status ?? "libre",
    priceOverride: room?.priceOverride ?? "",
    notes: room?.notes ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.number || !form.roomTypeId) { toast.error("Numéro et type obligatoires"); return; }
    const data = {
      number: form.number,
      floor: parseInt(form.floor) || 1,
      roomTypeId: parseInt(form.roomTypeId),
      status: form.status as RoomStatus,
      priceOverride: form.priceOverride || undefined,
      notes: form.notes || undefined,
    };
    if (room) onUpdate(room.id, data);
    else onCreate(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room ? "Modifier la chambre" : "Nouvelle chambre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Numéro *</Label>
              <Input value={form.number} onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))} placeholder="101" />
            </div>
            <div className="space-y-1.5">
              <Label>Étage</Label>
              <Input type="number" value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Type de chambre *</Label>
            <Select value={form.roomTypeId} onValueChange={(v) => setForm(f => ({ ...f, roomTypeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
              <SelectContent>
                {roomTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name} — {parseFloat(t.basePrice).toLocaleString("fr-FR")} FCFA/nuit</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tarif personnalisé (FCFA)</Label>
              <Input type="number" value={form.priceOverride} onChange={(e) => setForm(f => ({ ...f, priceOverride: e.target.value }))} placeholder="Optionnel" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Enregistrement..." : room ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoomTypeModal({ type, onClose, onCreate, onUpdate, isPending }: { type: any; onClose: () => void; onCreate: (data: any) => void; onUpdate: (id: number, data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    name: type?.name ?? "",
    description: type?.description ?? "",
    basePrice: type?.basePrice ?? "",
    capacity: type?.capacity?.toString() ?? "2",
    amenities: type?.amenities ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.basePrice) { toast.error("Nom et tarif obligatoires"); return; }
    const data = { name: form.name, description: form.description || undefined, basePrice: form.basePrice, capacity: parseInt(form.capacity) || 2, amenities: form.amenities || undefined };
    if (type) onUpdate(type.id, data);
    else onCreate(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type ? "Modifier le type" : "Nouveau type de chambre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Standard, Deluxe, Suite..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tarif de base (FCFA) *</Label>
              <Input type="number" value={form.basePrice} onChange={(e) => setForm(f => ({ ...f, basePrice: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacité (personnes)</Label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Équipements</Label>
            <Input value={form.amenities} onChange={(e) => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="WiFi, Clim, TV, Minibar..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Enregistrement..." : type ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
