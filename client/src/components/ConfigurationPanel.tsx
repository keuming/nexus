import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ConfigurationPanel() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("routes");
  
  // ─── ROUTES ───────────────────────────────────────────────────────────────
  const { data: routes } = trpc.routes.listRoutes.useQuery();
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeForm, setRouteForm] = useState({
    name: "", departureCity: "", arrivalCity: "", distance: 0, estimatedDuration: 0, basePrice: "", description: "",
  });
  
  const createRouteMutation = trpc.routes.createRoute.useMutation({
    onSuccess: () => {
      utils.routes.listRoutes.invalidate();
      utils.routes.listActiveRoutes.invalidate();
      setShowRouteForm(false);
      setRouteForm({ name: "", departureCity: "", arrivalCity: "", distance: 0, estimatedDuration: 0, basePrice: "", description: "" });
      toast.success("Ligne créée avec succès");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRouteMutation = trpc.routes.deleteRoute.useMutation({
    onSuccess: () => {
      utils.routes.listRoutes.invalidate();
      utils.routes.listActiveRoutes.invalidate();
      toast.success("Ligne supprimée");
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── BUS ──────────────────────────────────────────────────────────────────
  const { data: buses } = trpc.transport.company.buses.list.useQuery();
  const [showBusForm, setShowBusForm] = useState(false);
  const [busForm, setBusForm] = useState({
    registration: "", capacity: 0, lineType: "national" as "national" | "international",
  });

  const createBusMutation = trpc.transport.company.buses.upsert.useMutation({
    onSuccess: () => {
      utils.transport.company.buses.list.invalidate();
      setShowBusForm(false);
      setBusForm({ registration: "", capacity: 0, lineType: "national" });
      toast.success("Bus créé avec succès");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteBusMutation = trpc.transport.company.buses.delete.useMutation({
    onSuccess: () => {
      utils.transport.company.buses.list.invalidate();
      toast.success("Bus supprimé");
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── STOPS ────────────────────────────────────────────────────────────────
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopForm, setStopForm] = useState({
    name: "", city: "", description: "",
  });

  // ─── STATIONS (GARES) ─────────────────────────────────────────────────────
  const { data: stations } = trpc.stations.listStations.useQuery({ companyId: 1 });
  const [showStationForm, setShowStationForm] = useState(false);
  const [stationForm, setStationForm] = useState({
    companyId: 1,
    name: "",
    city: "",
    countryId: undefined as number | undefined,
    address: "",
  });

  const createStationMutation = trpc.stations.createStation.useMutation({
    onSuccess: () => {
      utils.stations.listStations.invalidate();
      utils.stations.listActiveStations.invalidate();
      setShowStationForm(false);
      setStationForm({ companyId: 1, name: "", city: "", countryId: undefined, address: "" });
      toast.success("Gare créée avec succès");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteStationMutation = trpc.stations.deleteStation.useMutation({
    onSuccess: () => {
      utils.stations.listStations.invalidate();
      utils.stations.listActiveStations.invalidate();
      toast.success("Gare supprimée");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes">Lignes</TabsTrigger>
          <TabsTrigger value="buses">Bus</TabsTrigger>
          <TabsTrigger value="stops">Arrêts</TabsTrigger>
          <TabsTrigger value="stations">Gares</TabsTrigger>
        </TabsList>

        {/* ─── ROUTES TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Lignes</h3>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowRouteForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter une ligne
            </Button>
          </div>

          <div className="grid gap-4">
            {(routes ?? []).map((route) => (
              <div key={route.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{route.name}</h4>
                    <p className="text-sm text-gray-600">{route.departureCity} → {route.arrivalCity}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <p><span className="font-medium">Distance:</span> {route.distance} km</p>
                      <p><span className="font-medium">Durée:</span> {route.estimatedDuration} min</p>
                      <p><span className="font-medium">Prix:</span> {route.basePrice} XOF</p>
                      <p><span className="font-medium">Statut:</span> {route.isActive ? "✓ Actif" : "✗ Inactif"}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRouteMutation.mutate({ id: route.id })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Route Form Dialog */}
          <Dialog open={showRouteForm} onOpenChange={setShowRouteForm}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Ajouter une ligne</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nom de la ligne *</Label>
                  <Input value={routeForm.name} onChange={(e) => setRouteForm({...routeForm, name: e.target.value})} placeholder="Ex: Abidjan-Accra Express" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Ville de départ *</Label>
                    <Input value={routeForm.departureCity} onChange={(e) => setRouteForm({...routeForm, departureCity: e.target.value})} placeholder="Abidjan" />
                  </div>
                  <div className="space-y-1">
                    <Label>Ville d'arrivée *</Label>
                    <Input value={routeForm.arrivalCity} onChange={(e) => setRouteForm({...routeForm, arrivalCity: e.target.value})} placeholder="Accra" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Distance (km)</Label>
                    <Input type="number" value={routeForm.distance} onChange={(e) => setRouteForm({...routeForm, distance: parseInt(e.target.value) || 0})} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label>Durée estimée (min)</Label>
                    <Input type="number" value={routeForm.estimatedDuration} onChange={(e) => setRouteForm({...routeForm, estimatedDuration: parseInt(e.target.value) || 0})} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Prix de base (XOF) *</Label>
                  <Input value={routeForm.basePrice} onChange={(e) => setRouteForm({...routeForm, basePrice: e.target.value})} placeholder="5000" />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={routeForm.description} onChange={(e) => setRouteForm({...routeForm, description: e.target.value})} placeholder="Informations supplémentaires..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRouteForm(false)}>Annuler</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!routeForm.name || !routeForm.departureCity || !routeForm.arrivalCity || !routeForm.basePrice || createRouteMutation.isPending}
                  onClick={() => createRouteMutation.mutate(routeForm)}
                >
                  {createRouteMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── BUS TAB ────────────────────────────────────────────────────────── */}
        <TabsContent value="buses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Bus</h3>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowBusForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter un bus
            </Button>
          </div>

          <div className="grid gap-4">
            {(buses ?? []).map((bus) => (
              <div key={bus.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{bus.registration}</h4>
                    <p className="text-sm text-gray-600">{bus.capacity} places · {bus.model ?? "Bus"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBusMutation.mutate({ id: bus.id })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bus Form Dialog */}
          <Dialog open={showBusForm} onOpenChange={setShowBusForm}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Ajouter un bus</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Immatriculation *</Label>
                  <Input value={busForm.registration} onChange={(e) => setBusForm({...busForm, registration: e.target.value})} placeholder="CI 1234 AB" />
                </div>
                <div className="space-y-1">
                  <Label>Nombre de places *</Label>
                  <Input type="number" value={busForm.capacity} onChange={(e) => setBusForm({...busForm, capacity: parseInt(e.target.value) || 0})} placeholder="50" />
                </div>
                <div className="space-y-1">
                  <Label>Type de ligne</Label>
                  <Select value={busForm.lineType} onValueChange={(v) => setBusForm({...busForm, lineType: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBusForm(false)}>Annuler</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!busForm.registration || !busForm.capacity || createBusMutation.isPending}
                  onClick={() => createBusMutation.mutate(busForm)}
                >
                  {createBusMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── STOPS TAB ──────────────────────────────────────────────────────── */}
        <TabsContent value="stops" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Arrêts</h3>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowStopForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter un arrêt
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-gray-600">
            <p>Les arrêts seront gérés ici</p>
          </div>

          {/* Stop Form Dialog */}
          <Dialog open={showStopForm} onOpenChange={setShowStopForm}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Ajouter un arrêt</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nom de l'arrêt *</Label>
                  <Input value={stopForm.name} onChange={(e) => setStopForm({...stopForm, name: e.target.value})} placeholder="Gare routière centrale" />
                </div>
                <div className="space-y-1">
                  <Label>Ville *</Label>
                  <Input value={stopForm.city} onChange={(e) => setStopForm({...stopForm, city: e.target.value})} placeholder="Abidjan" />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={stopForm.description} onChange={(e) => setStopForm({...stopForm, description: e.target.value})} placeholder="Adresse, horaires..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowStopForm(false)}>Annuler</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!stopForm.name || !stopForm.city}
                  onClick={() => {
                    toast.info("Fonctionnalité en développement");
                    setShowStopForm(false);
                  }}
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── STATIONS (GARES) TAB ───────────────────────────────────────────── */}
        <TabsContent value="stations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Gares</h3>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowStationForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter une gare
            </Button>
          </div>

          <div className="grid gap-4">
            {(stations ?? []).map((station) => (
              <div key={station.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{station.name}</h4>
                    <p className="text-sm text-gray-600">{station.city}</p>
                    {station.address && <p className="text-sm text-gray-500 mt-1">{station.address}</p>}
                    <p className="text-sm mt-2"><span className="font-medium">Statut:</span> {station.active ? "✓ Actif" : "✗ Inactif"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteStationMutation.mutate({ id: station.id })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Station Form Dialog */}
          <Dialog open={showStationForm} onOpenChange={setShowStationForm}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Ajouter une gare</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nom de la gare *</Label>
                  <Input value={stationForm.name} onChange={(e) => setStationForm({...stationForm, name: e.target.value})} placeholder="Gare routière centrale" />
                </div>
                <div className="space-y-1">
                  <Label>Ville *</Label>
                  <Input value={stationForm.city} onChange={(e) => setStationForm({...stationForm, city: e.target.value})} placeholder="Abidjan" />
                </div>
                <div className="space-y-1">
                  <Label>Adresse</Label>
                  <Input value={stationForm.address} onChange={(e) => setStationForm({...stationForm, address: e.target.value})} placeholder="123 Rue de la Gare" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowStationForm(false)}>Annuler</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!stationForm.name || !stationForm.city || createStationMutation.isPending}
                  onClick={() => createStationMutation.mutate(stationForm)}
                >
                  {createStationMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
