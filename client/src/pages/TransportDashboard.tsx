import { useAuth } from "@/_core/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { COUNTRIES, getCitiesByCountry, getAllCityNames } from "@/lib/transport-geo";
import { trpc } from "@/lib/trpc";
import { QUERY_CACHE_CONFIG } from "@/lib/trpc-config";
import {
  BarChart3,
  BookOpen,
  Bus,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Images,
  LayoutDashboard,
  LogIn,
  MapPin,
  MessageSquare,
  Package,
  Plane,
  Plus,
  Printer,
  Search,
  Settings,
  ShoppingCart,
  ShoppingBag,
  Ticket,
  Truck,
  UtensilsCrossed,
  Users,
  Hotel,
  BedDouble,
  Scissors,
  Waves,
  Coffee,
  Tag,
  Archive,
  TrendingUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { CompanyQRCode } from "@/components/CompanyQRCode";
import { GalleryManager } from "@/components/GalleryManager";
import CreditsHub from "./CreditsHub";
import CompanyCreditsCard from "@/components/CompanyCreditsCard";
import CompanyDashboardLayout from "@/components/CompanyDashboardLayout";
import TeamManager from "@/components/TeamManager";
import CompanyInbox from "@/components/CompanyInbox";
import PhotoGalleryManager from "@/components/PhotoGalleryManager";
import FinanceModule from "@/components/FinanceModule";
import EmbarquementModule from "@/components/EmbarquementModule";
import ManifesteModule from "@/components/ManifesteModule";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import TicketPrintModal from "@/components/TicketPrintModal";
import LinesManagement from "@/pages/LinesManagement";

const ALL_CITIES = getAllCityNames();

// ─── SEAT MAP ─────────────────────────────────────────────────────────────────
function SeatMap({
  capacity,
  occupied,
  selected,
  onSelect,
}: {
  capacity: number;
  occupied: number[];
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  const seats = Array.from({ length: capacity }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
      {seats.map((n) => {
        const isOccupied = occupied.includes(n);
        const isSelected = selected === n;
        return (
          <button
            key={n}
            type="button"
            disabled={isOccupied}
            onClick={() => onSelect(n)}
            className={`w-9 h-9 rounded text-xs font-bold border-2 transition-colors ${
              isOccupied
                ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                : isSelected
                ? "bg-orange-500 border-orange-600 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:border-orange-400"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ─── TICKET FORM ──────────────────────────────────────────────────────────────
function TicketForm({ companyId, onClose }: { companyId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: departures } = trpc.transport.company.departures.list.useQuery();
  const [departureId, setDepartureId] = useState<number | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", idType: "", idNumber: "",
    gender: "", nationality: "", dropOffCity: "", priceXOF: "", paymentMethod: "cash",
  });

  const { data: occupiedSeats } = trpc.transport.company.departures.occupiedSeats.useQuery(
    { departureId: departureId! },
    { enabled: !!departureId }
  );

  const selectedDeparture = departures?.find((d) => d.id === departureId);
  const capacity = selectedDeparture?.busCapacity ?? 0;

  const createMutation = trpc.transport.company.tickets.create.useMutation({
    onSuccess: () => {
      utils.transport.company.tickets.list.invalidate();
      utils.transport.company.stats.invalidate();
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Départ *</Label>
          <Select value={departureId ? String(departureId) : ""} onValueChange={(v) => { setDepartureId(parseInt(v)); setSeat(null); }}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un départ" /></SelectTrigger>
            <SelectContent>
              {(departures ?? []).filter(d => d.status !== "annule" && d.status !== "arrive").map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.departureCity} → {d.arrivalCity} · {d.departureDate instanceof Date ? d.departureDate.toLocaleDateString("fr-FR") : String(d.departureDate)} {d.departureTime}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {departureId && capacity > 0 && (
          <div className="col-span-2 space-y-1">
            <Label>Siège * {seat && <span className="text-orange-600 font-bold">→ Siège {seat} sélectionné</span>}</Label>
            <SeatMap capacity={capacity} occupied={occupiedSeats ?? []} selected={seat} onSelect={setSeat} />
          </div>
        )}
        <div className="space-y-1">
          <Label>Prénom *</Label>
          <Input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} placeholder="Prénom" />
        </div>
        <div className="space-y-1">
          <Label>Nom *</Label>
          <Input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} placeholder="Nom de famille" />
        </div>
        <div className="space-y-1">
          <Label>Téléphone</Label>
          <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+225..." />
        </div>
        <div className="space-y-1">
          <Label>Genre</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
            <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculin</SelectItem>
              <SelectItem value="F">Féminin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Pièce d'identité</Label>
          <Select value={form.idType} onValueChange={(v) => setForm({...form, idType: v})}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cni">CNI</SelectItem>
              <SelectItem value="passeport">Passeport</SelectItem>
              <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
              <SelectItem value="carte_resident">Carte résident</SelectItem>
              <SelectItem value="laissez_passer">Laissez-passer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Numéro pièce</Label>
          <Input value={form.idNumber} onChange={(e) => setForm({...form, idNumber: e.target.value})} placeholder="N° pièce" />
        </div>
        <div className="space-y-1">
          <Label>Nationalité</Label>
          <Input value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} placeholder="Nationalité" />
        </div>
        <div className="space-y-1">
          <Label>Ville de descente</Label>
          <Input list="cities-list" value={form.dropOffCity} onChange={(e) => setForm({...form, dropOffCity: e.target.value})} placeholder="Ville intermédiaire" />
          <datalist id="cities-list">{ALL_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="space-y-1">
          <Label>Prix (FCFA)</Label>
          <Input type="number" value={form.priceXOF} onChange={(e) => setForm({...form, priceXOF: e.target.value})} placeholder="5000" />
        </div>
        <div className="space-y-1">
          <Label>Paiement</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => setForm({...form, paymentMethod: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Espèces</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="virement">Virement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!departureId || !seat || !form.firstName || !form.lastName || createMutation.isPending}
          onClick={() => createMutation.mutate({
            departureId: departureId!,
            seatNumber: seat!,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            idType: form.idType as any || undefined,
            idNumber: form.idNumber || undefined,
            gender: form.gender as any || undefined,
            nationality: form.nationality || undefined,
            dropOffCity: form.dropOffCity || undefined,
            priceXOF: form.priceXOF || undefined,
            paymentMethod: form.paymentMethod as any,
          })}
        >
          {createMutation.isPending ? "Création..." : "Créer le billet"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── SHIPMENT FORM ────────────────────────────────────────────────────────────
function ShipmentForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    senderName: "", senderPhone: "", senderCity: "",
    receiverName: "", receiverPhone: "", receiverCity: "",
    description: "", weight: "", priceXOF: "",
  });

  const createMutation = trpc.transport.company.shipments.create.useMutation({
    onSuccess: () => {
      utils.transport.company.shipments.list.invalidate();
      utils.transport.company.stats.invalidate();
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 text-sm font-semibold text-gray-700 border-b pb-1">Expéditeur</div>
        <div className="space-y-1">
          <Label>Nom expéditeur *</Label>
          <Input value={form.senderName} onChange={(e) => setForm({...form, senderName: e.target.value})} placeholder="Nom complet" />
        </div>
        <div className="space-y-1">
          <Label>Téléphone</Label>
          <Input value={form.senderPhone} onChange={(e) => setForm({...form, senderPhone: e.target.value})} placeholder="+225..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Ville d'envoi</Label>
          <Input list="cities-list2" value={form.senderCity} onChange={(e) => setForm({...form, senderCity: e.target.value})} placeholder="Ville" />
          <datalist id="cities-list2">{ALL_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="col-span-2 text-sm font-semibold text-gray-700 border-b pb-1 mt-2">Destinataire</div>
        <div className="space-y-1">
          <Label>Nom destinataire *</Label>
          <Input value={form.receiverName} onChange={(e) => setForm({...form, receiverName: e.target.value})} placeholder="Nom complet" />
        </div>
        <div className="space-y-1">
          <Label>Téléphone</Label>
          <Input value={form.receiverPhone} onChange={(e) => setForm({...form, receiverPhone: e.target.value})} placeholder="+225..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Ville de destination</Label>
          <Input list="cities-list3" value={form.receiverCity} onChange={(e) => setForm({...form, receiverCity: e.target.value})} placeholder="Ville" />
          <datalist id="cities-list3">{ALL_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="col-span-2 text-sm font-semibold text-gray-700 border-b pb-1 mt-2">Colis</div>
        <div className="col-span-2 space-y-1">
          <Label>Description du colis</Label>
          <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Nature du colis..." rows={2} />
        </div>
        <div className="space-y-1">
          <Label>Poids (kg)</Label>
          <Input type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} placeholder="5.0" />
        </div>
        <div className="space-y-1">
          <Label>Prix (FCFA)</Label>
          <Input type="number" value={form.priceXOF} onChange={(e) => setForm({...form, priceXOF: e.target.value})} placeholder="2000" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!form.senderName || !form.receiverName || createMutation.isPending}
          onClick={() => createMutation.mutate({
            senderName: form.senderName,
            senderPhone: form.senderPhone || undefined,
            senderCity: form.senderCity || undefined,
            receiverName: form.receiverName,
            receiverPhone: form.receiverPhone || undefined,
            receiverCity: form.receiverCity || undefined,
            description: form.description || undefined,
            weight: form.weight || undefined,
            priceXOF: form.priceXOF || undefined,
          })}
        >
          {createMutation.isPending ? "Enregistrement..." : "Enregistrer l'expédition"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── DEPARTURE FORM ───────────────────────────────────────────────────────────
function DepartureForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: busLines } = trpc.transport.company.busLines.list.useQuery();
  const { data: buses } = trpc.transport.company.buses.list.useQuery();
  const { data: routes } = trpc.routes.listActiveRoutes.useQuery();
  const [form, setForm] = useState({
    busLineId: "", busId: "", departureDate: "", departureTime: "", driverName: "", notes: "", routeId: "",
  });

  // Pré-remplir les informations quand une route est sélectionnée
  const handleRouteSelect = (routeId: string) => {
    const selectedRoute = routes?.find(r => r.id === parseInt(routeId));
    if (selectedRoute) {
      setForm(prev => ({
        ...prev,
        routeId,
        notes: prev.notes || `Route: ${selectedRoute.name} - Distance: ${selectedRoute.distance}km - Durée: ${selectedRoute.estimatedDuration}min`,
      }));
    }
  };

  const createMutation = trpc.transport.company.departures.upsert.useMutation({
    onSuccess: () => {
      utils.transport.company.departures.list.invalidate();
      utils.transport.company.stats.invalidate();
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Trajet prédéfini (optionnel)</Label>
          <Select value={form.routeId} onValueChange={handleRouteSelect}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un trajet" /></SelectTrigger>
            <SelectContent>
              {(routes ?? []).map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name} - {r.basePrice} XOF
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Ligne *</Label>
          <Select value={form.busLineId} onValueChange={(v) => setForm({...form, busLineId: v})}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une ligne" /></SelectTrigger>
            <SelectContent>
              {(busLines ?? []).map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.departureCity} → {l.arrivalCity} ({l.lineType === "international" ? "Intl" : "National"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Bus</Label>
          <Select value={form.busId} onValueChange={(v) => setForm({...form, busId: v})}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un bus" /></SelectTrigger>
            <SelectContent>
              {(buses ?? []).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.registration} ({b.capacity} places)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Chauffeur</Label>
          <Input value={form.driverName} onChange={(e) => setForm({...form, driverName: e.target.value})} placeholder="Nom du chauffeur" />
        </div>
        <div className="space-y-1">
          <Label>Date de départ *</Label>
          <Input type="date" value={form.departureDate} onChange={(e) => setForm({...form, departureDate: e.target.value})} />
        </div>
        <div className="space-y-1">
          <Label>Heure de départ *</Label>
          <Input type="time" value={form.departureTime} onChange={(e) => setForm({...form, departureTime: e.target.value})} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Informations complémentaires..." rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!form.busLineId || !form.departureDate || !form.departureTime || createMutation.isPending}
          onClick={() => createMutation.mutate({
            busLineId: parseInt(form.busLineId),
            busId: form.busId ? parseInt(form.busId) : undefined,
            departureDate: form.departureDate,
            departureTime: form.departureTime,
            driverName: form.driverName || undefined,
            notes: form.notes || undefined,
          })}
        >
          {createMutation.isPending ? "Création..." : "Créer le départ"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TransportDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [showDepartureForm, setShowDepartureForm] = useState(false);
  const [showBusLineForm, setShowBusLineForm] = useState(false);
  const [showBusForm, setShowBusForm] = useState(false);
  const [busLineForm, setBusLineForm] = useState({ departureCity: "", arrivalCity: "", lineType: "national" as "national" | "international" });
  const [busForm, setBusForm] = useState({ registration: "", model: "", capacity: "50" });
  // Filtres commandes en ligne
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  // Zones de livraison
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: "", description: "", extraMinutes: "15" });
  const [printTicketId, setPrintTicketId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: myCompany, isLoading: loadingCompany } = trpc.transport.myCompany.useQuery(undefined, { 
    enabled: !!user,
    ...QUERY_CACHE_CONFIG.STATIC,
  });
  const { data: stats } = trpc.transport.company.stats.useQuery(undefined, { 
    enabled: !!user && myCompany?.status === "active",
    ...QUERY_CACHE_CONFIG.SEMI_STATIC,
  });
  const { data: tickets } = trpc.transport.company.tickets.list.useQuery({ limit: 50 }, { 
    enabled: !!user && myCompany?.status === "active" && activeTab === "tickets",
    ...QUERY_CACHE_CONFIG.DYNAMIC,
  });
  const { data: shipments } = trpc.transport.company.shipments.list.useQuery({ limit: 50 }, { 
    enabled: !!user && myCompany?.status === "active" && activeTab === "shipments",
    ...QUERY_CACHE_CONFIG.DYNAMIC,
  });
  const { data: departures } = trpc.transport.company.departures.list.useQuery(undefined, { 
    enabled: !!user && myCompany?.status === "active",
    ...QUERY_CACHE_CONFIG.SEMI_STATIC,
  });
  const { data: busLines } = trpc.transport.company.busLines.list.useQuery(undefined, { 
    enabled: !!user && myCompany?.status === "active",
    ...QUERY_CACHE_CONFIG.STATIC,
  });
  const { data: buses } = trpc.transport.company.buses.list.useQuery(undefined, { 
    enabled: !!user && myCompany?.status === "active",
    ...QUERY_CACHE_CONFIG.STATIC,
  });
  const { data: bookings } = trpc.transport.company.bookings.list.useQuery({ limit: 50 }, { 
    enabled: !!user && myCompany?.status === "active" && activeTab === "bookings",
    ...QUERY_CACHE_CONFIG.DYNAMIC,
  });
  const { data: onlineOrders } = trpc.menu.listOrders.useQuery(undefined, {
    enabled: !!user && myCompany?.status === "active" && activeTab === "online-orders",
    refetchInterval: activeTab === "online-orders" ? 30000 : false,
    ...QUERY_CACHE_CONFIG.DYNAMIC,
  });
  // Query séparée pour le badge (toujours actif, polling 30s)
  const { data: allOrdersForBadge } = trpc.menu.listOrders.useQuery(undefined, {
    enabled: !!user && myCompany?.status === "active" && myCompany?.activityType === "restauration",
    refetchInterval: 30000,
    ...QUERY_CACHE_CONFIG.DYNAMIC,
  });
  const newOrdersCount = (allOrdersForBadge ?? []).filter((o) => o.status === "nouvelle").length;
  const { data: restaurantStats } = trpc.menu.restaurantStats.useQuery(undefined, {
    enabled: !!user && myCompany?.status === "active" && myCompany?.activityType === "restauration" && activeTab === "finance",
    refetchInterval: activeTab === "finance" ? 60000 : false,
    ...QUERY_CACHE_CONFIG.SEMI_STATIC,
  });
  const { data: deliveryZones } = trpc.menu.listDeliveryZones.useQuery(undefined, {
    enabled: !!user && myCompany?.status === "active" && myCompany?.activityType === "restauration",
    ...QUERY_CACHE_CONFIG.STATIC,
  });
  const filteredOrders = useMemo(() => {
    return (onlineOrders ?? []).filter((o) => {
      const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const q = orderSearch.toLowerCase();
      const matchSearch = !q || o.orderRef.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
      return matchStatus && matchSearch;
    });
  }, [onlineOrders, orderStatusFilter, orderSearch]);

  // Badge messages non lus + notifications push navigateur
  const { unreadCount: unreadMsgCount } = usePushNotifications({
    role: "company",
    title: "HUB_RESA — Nouveau message HUB_RESA",
    sound: true,
    interval: 30_000,
  });

  const updateDepartureMutation = trpc.transport.company.departures.updateStatus.useMutation({
    onSuccess: () => utils.transport.company.departures.list.invalidate(),
  });
  const updateTicketMutation = trpc.transport.company.tickets.updateStatus.useMutation({
    onSuccess: () => utils.transport.company.tickets.list.invalidate(),
  });
  const updateShipmentMutation = trpc.transport.company.shipments.updateStatus.useMutation({
    onSuccess: () => utils.transport.company.shipments.list.invalidate(),
  });
  const updateBookingMutation = trpc.transport.company.bookings.updateStatus.useMutation({
    onSuccess: () => utils.transport.company.bookings.list.invalidate(),
  });
  const upsertBusLineMutation = trpc.transport.company.busLines.upsert.useMutation({
    onSuccess: () => { utils.transport.company.busLines.list.invalidate(); setShowBusLineForm(false); setBusLineForm({ departureCity: "", arrivalCity: "", lineType: "national" }); },
  });
  const upsertBusMutation = trpc.transport.company.buses.upsert.useMutation({
    onSuccess: () => { utils.transport.company.buses.list.invalidate(); setShowBusForm(false); setBusForm({ registration: "", model: "", capacity: "50" }); },
  });
  const updateOrderStatusMutation = trpc.menu.updateOrderStatus.useMutation({
    onSuccess: () => utils.menu.listOrders.invalidate(),
  });
  const upsertZoneMutation = trpc.menu.upsertDeliveryZone.useMutation({
    onSuccess: () => { utils.menu.listDeliveryZones.invalidate(); setShowZoneForm(false); setZoneForm({ name: "", description: "", extraMinutes: "15" }); },
  });
  const deleteZoneMutation = trpc.menu.deleteDeliveryZone.useMutation({
    onSuccess: () => utils.menu.listDeliveryZones.invalidate(),
  });

  if (loading || loadingCompany) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Bus className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => (window.location.href = getLoginUrl())}>
              <LogIn className="mr-2 h-4 w-4" />Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!myCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Aucune compagnie associée</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-gray-600">Vous n'avez pas encore créé de compte compagnie.</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate("/register-company")}>
              Créer mon compte compagnie
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myCompany.status !== "active") {
    const isPending = myCompany.status === "pending";
    const isSuspended = myCompany.status === "suspended";
    const isRejected = myCompany.status === "rejected";
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isPending ? "bg-gradient-to-br from-amber-50 to-orange-50"
        : isSuspended ? "bg-gradient-to-br from-red-50 to-rose-50"
        : "bg-gradient-to-br from-gray-50 to-slate-100"
      }`}>
        <Card className="max-w-lg w-full shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              isPending ? "bg-amber-100" : isSuspended ? "bg-red-100" : "bg-gray-100"
            }`}>
              {isPending && <Clock className="h-10 w-10 text-amber-600" />}
              {isSuspended && <Settings className="h-10 w-10 text-red-600" />}
              {isRejected && <FileText className="h-10 w-10 text-gray-500" />}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
              isPending ? "bg-amber-100 text-amber-700"
              : isSuspended ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
            }`}>
              {isPending ? "En attente de validation" : isSuspended ? "Compte suspendu" : "Demande refusée"}
            </div>
            <CardTitle className="text-xl">{myCompany.companyName}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isPending && (
              <>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Votre dossier d'inscription a bien été reçu et est en cours d'examen par l'équipe HUB_RESA.
                  Vous recevrez une notification dès que votre compte sera validé.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Délai de traitement</p>
                  <p className="text-xs text-amber-700">Généralement sous 24 à 48 heures ouvrées. Pour toute urgence, contactez-nous au +225 0504921096.</p>
                </div>
              </>
            )}
            {isSuspended && (
              <>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Votre compte a été temporairement suspendu par l'administration HUB_RESA.
                  L'accès à votre dashboard est bloqué jusqu'à la levée de la suspension.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                  <p className="text-xs font-semibold text-red-800 mb-1">Que faire ?</p>
                  <p className="text-xs text-red-700">Contactez l'équipe HUB_RESA au <strong>+225 0504921096</strong> ou par email pour connaître les raisons de la suspension et régulariser votre situation.</p>
                </div>
              </>
            )}
            {isRejected && (
              <>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Votre demande d'inscription a été refusée par l'équipe HUB_RESA.
                </p>
                {(myCompany as any).rejectionReason && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Motif du refus</p>
                    <p className="text-xs text-gray-600">{(myCompany as any).rejectionReason}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500">Vous pouvez soumettre une nouvelle demande en vous réinscrivant ou en contactant notre support.</p>
              </>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-400">HUB_RESA — Plateforme de Gestion Multi-Activités · Afrique de l'Ouest</p>
              <p className="text-xs text-gray-400">+225 0504921096 / 0701578857</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derive activity type from company data (default: transport)
  const activityType = (myCompany as any).activityType ?? "transport";
  const isRestaurant = activityType === "restauration";
  const isExpedition = activityType === "expedition";
  const isHotel = activityType === "hotel";
  const isBoutique = activityType === "boutique";
  const isAgenceVoyage = activityType === "agence_voyage";
  const isTransport = !isRestaurant && !isExpedition && !isHotel && !isBoutique && !isAgenceVoyage;

  const statusColors: Record<string, string> = {
    programme: "bg-blue-100 text-blue-800",
    embarquement: "bg-amber-100 text-amber-800",
    en_route: "bg-green-100 text-green-800",
    arrive: "bg-gray-100 text-gray-800",
    annule: "bg-red-100 text-red-800",
    actif: "bg-green-100 text-green-800",
    utilise: "bg-gray-100 text-gray-800",
    en_attente: "bg-amber-100 text-amber-800",
    confirme: "bg-green-100 text-green-800",
    enregistre: "bg-blue-100 text-blue-800",
    en_transit: "bg-purple-100 text-purple-800",
    livre: "bg-gray-100 text-gray-800",
    encaisse: "bg-green-100 text-green-800",
  };

  return (
    <CompanyDashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      companyName={myCompany.companyName}
    >
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {myCompany.logoUrl ? (
              <img src={myCompany.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isHotel ? "bg-purple-500" : isBoutique ? "bg-pink-500" : isAgenceVoyage ? "bg-sky-500" : isRestaurant ? "bg-amber-500" : isExpedition ? "bg-blue-500" : "bg-orange-500"
              }`}>
                {isHotel ? <Hotel className="h-5 w-5 text-white" /> :
                 isBoutique ? <ShoppingBag className="h-5 w-5 text-white" /> :
                 isAgenceVoyage ? <Plane className="h-5 w-5 text-white" /> :
                 isRestaurant ? <UtensilsCrossed className="h-5 w-5 text-white" /> :
                 isExpedition ? <Package className="h-5 w-5 text-white" /> :
                 <Bus className="h-5 w-5 text-white" />}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{myCompany.companyName}</h1>
              <p className="text-xs text-gray-500">
                {isAgenceVoyage ? "HUB_RESA — Agence de Voyage" :
                 isRestaurant ? "HUB_RESA — Restauration & Livraison" :
                 isExpedition ? "HUB_RESA — Expédition & Logistique" :
                 isHotel ? "HUB_RESA — Hôtellerie & Services" :
                 isBoutique ? "HUB_RESA — Commerce & Boutique" :
                 "HUB_RESA — Transport Terrestre"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Accueil public
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/transport/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-4 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Accueil</TabsTrigger>
            {isTransport && <TabsTrigger value="departures" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Départs</TabsTrigger>}
            {isTransport && <TabsTrigger value="tickets" className="gap-1.5"><Ticket className="h-3.5 w-3.5" />Billetterie</TabsTrigger>}
            {isTransport && <TabsTrigger value="bookings" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Réservations</TabsTrigger>}
            {isRestaurant && <TabsTrigger value="orders" className="gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" />Commandes</TabsTrigger>}
            {isRestaurant && (
              <TabsTrigger value="online-orders" className="gap-1.5 relative">
                <ShoppingCart className="h-3.5 w-3.5" />
                Commandes en ligne
                {newOrdersCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {newOrdersCount}
                  </span>
                )}
              </TabsTrigger>
            )}
            {(isTransport || isExpedition) && <TabsTrigger value="shipments" className="gap-1.5"><Package className="h-3.5 w-3.5" />{isExpedition ? "Expéditions agence" : "Expéditions"}</TabsTrigger>}
            {isExpedition && <TabsTrigger value="bookings" className="gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />Demandes en ligne</TabsTrigger>}
            {isTransport && <TabsTrigger value="lines" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Lignes</TabsTrigger>}
            {isTransport && <TabsTrigger value="fleet" className="gap-1.5"><Bus className="h-3.5 w-3.5" />Flotte</TabsTrigger>}
            {isTransport && <TabsTrigger value="embarquement" className="gap-1.5"><Users className="h-3.5 w-3.5" />Embarquement</TabsTrigger>}
            {isTransport && <TabsTrigger value="manifeste" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Manifeste</TabsTrigger>}
            {isHotel && <TabsTrigger value="rooms" className="gap-1.5"><BedDouble className="h-3.5 w-3.5" />Chambres</TabsTrigger>}
            {isHotel && <TabsTrigger value="reservations" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Réservations</TabsTrigger>}
            {isHotel && <TabsTrigger value="services" className="gap-1.5"><Coffee className="h-3.5 w-3.5" />Services</TabsTrigger>}
            {isBoutique && <TabsTrigger value="catalog" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />Catalogue</TabsTrigger>}
            {isBoutique && <TabsTrigger value="sales" className="gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />Ventes / Caisse</TabsTrigger>}
            {isBoutique && <TabsTrigger value="stock" className="gap-1.5"><Archive className="h-3.5 w-3.5" />Stock</TabsTrigger>}
            {isAgenceVoyage && <TabsTrigger value="flights" className="gap-1.5"><Plane className="h-3.5 w-3.5" />Vols</TabsTrigger>}
            {isAgenceVoyage && <TabsTrigger value="flight-tickets" className="gap-1.5"><Ticket className="h-3.5 w-3.5" />Billets avion</TabsTrigger>}
            {isAgenceVoyage && <TabsTrigger value="packages" className="gap-1.5"><Package className="h-3.5 w-3.5" />Forfaits voyage</TabsTrigger>}
            <TabsTrigger value="finance" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Finance</TabsTrigger>
            <TabsTrigger value="qrcode" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />QR Code</TabsTrigger>
            <TabsTrigger value="credits" className="gap-1.5 text-[#E8751A] font-semibold"><Coins className="h-3.5 w-3.5" />CRÉDITS HUB_RESA</TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" />Équipe</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5 relative">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages HUB_RESA
              {unreadMsgCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadMsgCount > 99 ? "99+" : unreadMsgCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="galerie" className="gap-1.5"><Images className="h-3.5 w-3.5" />Galerie photos</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW */}
          <TabsContent value="overview">
            {/* Stats cards adaptatées par type d'activité */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {isTransport && [
                { label: "Billets aujourd'hui", value: stats?.ticketsSoldToday ?? 0, icon: Ticket, color: "text-orange-500" },
                { label: "Recette billets", value: `${(stats?.ticketsRevenueToday ?? 0).toLocaleString()} XOF`, icon: CreditCard, color: "text-green-500" },
                { label: "Expéditions", value: stats?.shipmentsToday ?? 0, icon: Package, color: "text-blue-500" },
                { label: "Recette expéd.", value: `${(stats?.shipmentsRevenueToday ?? 0).toLocaleString()} XOF`, icon: Truck, color: "text-purple-500" },
                { label: "Départs du jour", value: stats?.departuresToday ?? 0, icon: MapPin, color: "text-indigo-500" },
                { label: "Réservations en attente", value: stats?.pendingBookings ?? 0, icon: Users, color: "text-amber-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
              {isRestaurant && [
                { label: "Commandes du jour", value: stats?.ticketsSoldToday ?? 0, icon: UtensilsCrossed, color: "text-amber-500" },
                { label: "Recette commandes", value: `${(stats?.ticketsRevenueToday ?? 0).toLocaleString()} XOF`, icon: CreditCard, color: "text-green-500" },
                { label: "Commandes en ligne", value: stats?.pendingBookings ?? 0, icon: ShoppingCart, color: "text-blue-500" },
                { label: "Expéditions livraison", value: stats?.shipmentsToday ?? 0, icon: Truck, color: "text-purple-500" },
                { label: "Recette livraisons", value: `${(stats?.shipmentsRevenueToday ?? 0).toLocaleString()} XOF`, icon: Package, color: "text-orange-500" },
                { label: "Chiffre d'affaires", value: `${((stats?.ticketsRevenueToday ?? 0) + (stats?.shipmentsRevenueToday ?? 0)).toLocaleString()} XOF`, icon: BarChart3, color: "text-indigo-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
              {isExpedition && [
                { label: "Expéditions agence", value: stats?.shipmentsToday ?? 0, icon: Package, color: "text-blue-500" },
                { label: "Recette expéditions", value: `${(stats?.shipmentsRevenueToday ?? 0).toLocaleString()} XOF`, icon: CreditCard, color: "text-green-500" },
                { label: "Demandes en ligne", value: stats?.pendingBookings ?? 0, icon: ShoppingCart, color: "text-orange-500" },
                { label: "En transit", value: stats?.departuresToday ?? 0, icon: Truck, color: "text-purple-500" },
                { label: "Livrées", value: stats?.ticketsSoldToday ?? 0, icon: MapPin, color: "text-indigo-500" },
                { label: "Chiffre d'affaires", value: `${((stats?.ticketsRevenueToday ?? 0) + (stats?.shipmentsRevenueToday ?? 0)).toLocaleString()} XOF`, icon: BarChart3, color: "text-amber-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
              {isHotel && [
                { label: "Chambres occupées", value: "—", icon: BedDouble, color: "text-purple-500" },
                { label: "Arrivées du jour", value: "—", icon: Users, color: "text-green-500" },
                { label: "Départs du jour", value: "—", icon: MapPin, color: "text-orange-500" },
                { label: "Recette hébergement", value: "—", icon: CreditCard, color: "text-blue-500" },
                { label: "Restauration", value: "—", icon: UtensilsCrossed, color: "text-amber-500" },
                { label: "Services (pressing/piscine)", value: "—", icon: Scissors, color: "text-indigo-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
              {isBoutique && [
                { label: "Ventes du jour", value: "—", icon: ShoppingBag, color: "text-pink-500" },
                { label: "Recette du jour", value: "—", icon: CreditCard, color: "text-green-500" },
                { label: "Articles en stock", value: "—", icon: Archive, color: "text-blue-500" },
                { label: "Tickets de caisse", value: "—", icon: Ticket, color: "text-orange-500" },
                { label: "Commandes en ligne", value: "—", icon: ShoppingCart, color: "text-purple-500" },
                { label: "Chiffre d'affaires", value: "—", icon: TrendingUp, color: "text-indigo-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
              {isAgenceVoyage && [
                { label: "Billets vendus", value: "—", icon: Plane, color: "text-sky-500" },
                { label: "Recette billets", value: "—", icon: CreditCard, color: "text-green-500" },
                { label: "Réservations en attente", value: "—", icon: Clock, color: "text-amber-500" },
                { label: "Forfaits vendus", value: "—", icon: Package, color: "text-blue-500" },
                { label: "Clients du jour", value: "—", icon: Users, color: "text-purple-500" },
                { label: "Chiffre d'affaires", value: "—", icon: TrendingUp, color: "text-indigo-500" },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick actions adaptées par type d'activité */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isTransport && [
                { label: "Nouveau billet", icon: Ticket, action: () => setShowTicketForm(true), color: "bg-orange-500 hover:bg-orange-600" },
                { label: "Nouvelle expédition", icon: Package, action: () => setShowShipmentForm(true), color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Nouveau départ", icon: MapPin, action: () => setShowDepartureForm(true), color: "bg-green-500 hover:bg-green-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
              {isRestaurant && [
                { label: "Nouvelle commande", icon: UtensilsCrossed, action: () => setShowTicketForm(true), color: "bg-amber-500 hover:bg-amber-600" },
                { label: "Nouvelle livraison", icon: Truck, action: () => setShowShipmentForm(true), color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Gérer la carte", icon: BookOpen, action: () => navigate("/transport/menu"), color: "bg-green-500 hover:bg-green-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
              {isExpedition && [
                { label: "Nouvelle expédition", icon: Package, action: () => setShowShipmentForm(true), color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
              {isHotel && [
                { label: "Nouvelle réservation", icon: BedDouble, action: () => setActiveTab("reservations"), color: "bg-purple-500 hover:bg-purple-600" },
                { label: "Check-in / Check-out", icon: Users, action: () => setActiveTab("rooms"), color: "bg-green-500 hover:bg-green-600" },
                { label: "Services hôteliers", icon: Coffee, action: () => setActiveTab("services"), color: "bg-amber-500 hover:bg-amber-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
              {isBoutique && [
                { label: "Nouveau ticket de caisse", icon: Ticket, action: () => setActiveTab("sales"), color: "bg-pink-500 hover:bg-pink-600" },
                { label: "Gérer le catalogue", icon: ShoppingBag, action: () => setActiveTab("catalog"), color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Gérer le stock", icon: Archive, action: () => setActiveTab("stock"), color: "bg-orange-500 hover:bg-orange-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
              {isAgenceVoyage && [
                { label: "Nouveau billet avion", icon: Plane, action: () => setActiveTab("flight-tickets"), color: "bg-sky-500 hover:bg-sky-600" },
                { label: "Rechercher un vol", icon: Search, action: () => setActiveTab("flights"), color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Forfaits voyage", icon: Package, action: () => setActiveTab("packages"), color: "bg-green-500 hover:bg-green-600" },
                { label: "Paramètres", icon: Settings, action: () => setActiveTab("configuration"), color: "bg-gray-500 hover:bg-gray-600" },
              ].map((a) => (
                <Button key={a.label} className={`${a.color} text-white h-16 flex-col gap-1`} onClick={a.action}>
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* ─── DEPARTURES */}
          <TabsContent value="departures">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gestion des départs</h2>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowDepartureForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Nouveau départ
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["Ligne", "Date", "Heure", "Bus", "Chauffeur", "Statut", "Action"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(departures ?? []).map((d) => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{d.departureCity} → {d.arrivalCity}</td>
                          <td className="px-4 py-3">{d.departureDate instanceof Date ? d.departureDate.toLocaleDateString("fr-FR") : String(d.departureDate)}</td>
                          <td className="px-4 py-3">{d.departureTime}</td>
                          <td className="px-4 py-3">{d.busRegistration ?? "—"}</td>
                          <td className="px-4 py-3">{d.driverName ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[d.status ?? "programme"] ?? ""}>{d.status ?? "programme"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Select value={d.status ?? "programme"} onValueChange={(v) => updateDepartureMutation.mutate({ id: d.id, status: v as any })}>
                              <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="programme">Programmé</SelectItem>
                                <SelectItem value="embarquement">Embarquement</SelectItem>
                                <SelectItem value="en_route">En route</SelectItem>
                                <SelectItem value="arrive">Arrivé</SelectItem>
                                <SelectItem value="annule">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(departures ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucun départ enregistré</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TICKETS */}
          <TabsContent value="tickets">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Billetterie guichet</h2>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowTicketForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Nouveau billet
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["N° Billet", "Passager", "Trajet", "Siège", "Prix", "Paiement", "Caisse", "Embarquement", ""].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(tickets ?? []).map((t) => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs font-bold text-orange-600">{t.ticketNumber}</td>
                          <td className="px-3 py-2">{t.firstName} {t.lastName}</td>
                          <td className="px-3 py-2 text-xs">{t.departureCity} → {t.arrivalCity}</td>
                          <td className="px-3 py-2 text-center font-bold">{t.seatNumber}</td>
                          <td className="px-3 py-2">{t.priceXOF ? `${Number(t.priceXOF).toLocaleString()} XOF` : "—"}</td>
                          <td className="px-3 py-2">
                            <Badge className={statusColors[t.cashStatus ?? "en_attente"] ?? ""}>{t.cashStatus === "encaisse" ? "Encaissé" : "En attente"}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Select value={t.cashStatus ?? "en_attente"} onValueChange={(v) => updateTicketMutation.mutate({ ticketId: t.id, cashStatus: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="encaisse">Encaissé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Select value={t.boardingStatus ?? "non_embarque"} onValueChange={(v) => updateTicketMutation.mutate({ ticketId: t.id, boardingStatus: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="non_embarque">Non embarqué</SelectItem>
                                <SelectItem value="embarque">Embarqué</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                              onClick={() => setPrintTicketId(t.id)}
                            >
                              <Printer className="h-3 w-3 mr-1" />Imprimer
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(tickets ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucun billet vendu</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TICKET PRINT MODAL */}
          {printTicketId && (
            <TicketPrintModal
              ticketId={printTicketId}
              onClose={() => setPrintTicketId(null)}
            />
          )}

          {/* ─── BOOKINGS */}
          <TabsContent value="bookings">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Réservations en ligne</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["Référence", "Client", "Trajet", "Date", "Siège", "Prix", "Statut", "Action"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(bookings ?? []).map((b) => (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">{b.bookingRef}</td>
                          <td className="px-3 py-2">{b.firstName} {b.lastName}</td>
                          <td className="px-3 py-2 text-xs">{b.departureCity} → {b.arrivalCity}</td>
                          <td className="px-3 py-2 text-xs">{b.departureDate instanceof Date ? b.departureDate.toLocaleDateString("fr-FR") : String(b.departureDate)}</td>
                          <td className="px-3 py-2 text-center font-bold">{b.seatNumber}</td>
                          <td className="px-3 py-2">{b.priceXOF ? `${Number(b.priceXOF).toLocaleString()} XOF` : "—"}</td>
                          <td className="px-3 py-2">
                            <Badge className={statusColors[b.status ?? "en_attente"] ?? ""}>{b.status}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Select value={b.status ?? "en_attente"} onValueChange={(v) => updateBookingMutation.mutate({ bookingId: b.id, status: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="confirme">Confirmé</SelectItem>
                                <SelectItem value="annule">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(bookings ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucune réservation en ligne</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SHIPMENTS */}
          <TabsContent value="shipments">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Gestion des expéditions</h2>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowShipmentForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Nouvelle expédition
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["N° Suivi", "Expéditeur", "Destinataire", "Trajet", "Poids", "Prix", "Statut", "Caisse"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(shipments ?? []).map((s) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs font-bold text-purple-600">{s.trackingNumber}</td>
                          <td className="px-3 py-2">{s.senderName}<br/><span className="text-xs text-gray-400">{s.senderCity}</span></td>
                          <td className="px-3 py-2">{s.receiverName}<br/><span className="text-xs text-gray-400">{s.receiverCity}</span></td>
                          <td className="px-3 py-2 text-xs">{s.senderCity} → {s.receiverCity}</td>
                          <td className="px-3 py-2">{s.weight ? `${s.weight} kg` : "—"}</td>
                          <td className="px-3 py-2">{s.priceXOF ? `${Number(s.priceXOF).toLocaleString()} XOF` : "—"}</td>
                          <td className="px-3 py-2">
                            <Select value={s.status ?? "enregistre"} onValueChange={(v) => updateShipmentMutation.mutate({ shipmentId: s.id, status: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="enregistre">Enregistré</SelectItem>
                                <SelectItem value="en_transit">En transit</SelectItem>
                                <SelectItem value="arrive">Arrivé</SelectItem>
                                <SelectItem value="livre">Livré</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Select value={s.cashStatus ?? "en_attente"} onValueChange={(v) => updateShipmentMutation.mutate({ shipmentId: s.id, status: s.status as any ?? "enregistre", cashStatus: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="encaisse">Encaissé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(shipments ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucune expédition enregistrée</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── LIGNES */}
          <TabsContent value="lines">
            <LinesManagement />
          </TabsContent>

          {/* ─── FLEET */}
          <TabsContent value="fleet">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bus Lines */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Lignes de bus</CardTitle>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowBusLineForm(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(busLines ?? []).map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{l.departureCity} → {l.arrivalCity}</p>
                          <Badge className={l.lineType === "international" ? "bg-blue-100 text-blue-800 text-xs" : "bg-green-100 text-green-800 text-xs"}>
                            {l.lineType === "international" ? "International" : "National"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(busLines ?? []).length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Aucune ligne définie</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Buses */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Flotte de bus</CardTitle>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowBusForm(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(buses ?? []).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{b.registration}</p>
                          <p className="text-xs text-gray-500">{b.model ?? "—"} · {b.capacity} places</p>
                        </div>
                        <Badge className={statusColors[b.status ?? "disponible"] ?? "bg-gray-100 text-gray-800"}>
                          {b.status ?? "disponible"}
                        </Badge>
                      </div>
                    ))}
                    {(buses ?? []).length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Aucun bus enregistré</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── COMMANDES RESTAURATION (en salle / à emporter) */}
          <TabsContent value="orders">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Commandes en salle / à emporter</h2>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowTicketForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Nouvelle commande
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["N° Commande", "Client", "Type", "Articles", "Prix", "Paiement", "Statut"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(tickets ?? []).map((t) => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs font-bold text-amber-600">{t.ticketNumber}</td>
                          <td className="px-3 py-2">{t.firstName} {t.lastName}</td>
                          <td className="px-3 py-2 text-xs">{t.departureCity}</td>
                          <td className="px-3 py-2 text-xs">{t.arrivalCity || "—"}</td>
                          <td className="px-3 py-2">{t.priceXOF ? `${Number(t.priceXOF).toLocaleString()} XOF` : "—"}</td>
                          <td className="px-3 py-2">
                            <Select value={t.cashStatus ?? "en_attente"} onValueChange={(v) => updateTicketMutation.mutate({ ticketId: t.id, cashStatus: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="encaisse">Encaissé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Select value={t.boardingStatus ?? "non_embarque"} onValueChange={(v) => updateTicketMutation.mutate({ ticketId: t.id, boardingStatus: v as any })}>
                              <SelectTrigger className="h-6 text-xs w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="non_embarque">En préparation</SelectItem>
                                <SelectItem value="embarque">Servi</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(tickets ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucune commande enregistrée</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── COMMANDES EN LIGNE RESTAURATION */}
          <TabsContent value="online-orders">
            {/* Header avec compteurs */}
            <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
              <h2 className="text-lg font-semibold">Commandes en ligne</h2>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">{(onlineOrders ?? []).filter(o => o.status === "nouvelle").length} nouvelles</span>
                <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">{(onlineOrders ?? []).filter(o => o.status === "en_preparation").length} en préparation</span>
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">{(onlineOrders ?? []).filter(o => o.status === "prete").length} prêtes</span>
              </div>
            </div>
            {/* Barre de recherche + filtre statut */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9 h-9 text-sm"
                  placeholder="Rechercher par référence, nom ou téléphone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouvelle">Nouvelles</SelectItem>
                  <SelectItem value="en_preparation">En préparation</SelectItem>
                  <SelectItem value="prete">Prêtes</SelectItem>
                  <SelectItem value="livree">Livrées</SelectItem>
                  <SelectItem value="annulee">Annulées</SelectItem>
                </SelectContent>
              </Select>
              {(orderSearch || orderStatusFilter !== "all") && (
                <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-500" onClick={() => { setOrderSearch(""); setOrderStatusFilter("all"); }}>
                  Réinitialiser
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {filteredOrders.length === 0 && (
                <Card><CardContent className="text-center text-gray-400 py-12">
                  {(onlineOrders ?? []).length === 0 ? "Aucune commande en ligne pour le moment" : "Aucune commande ne correspond à votre recherche"}
                </CardContent></Card>
              )}
              {filteredOrders.map((order) => {
                const items: any[] = (() => { try { return JSON.parse(order.itemsJson); } catch { return []; } })();
                const orderStatusColors: Record<string, string> = {
                  nouvelle: "bg-amber-100 text-amber-800 border-amber-200",
                  en_preparation: "bg-blue-100 text-blue-800 border-blue-200",
                  prete: "bg-green-100 text-green-800 border-green-200",
                  livree: "bg-gray-100 text-gray-700 border-gray-200",
                  annulee: "bg-red-100 text-red-700 border-red-200",
                };
                const orderStatusLabels: Record<string, string> = {
                  nouvelle: "Nouvelle",
                  en_preparation: "En préparation",
                  prete: "Prête",
                  livree: "Livrée",
                  annulee: "Annulée",
                };
                const nextStatus: Record<string, string> = {
                  nouvelle: "en_preparation",
                  en_preparation: "prete",
                  prete: "livree",
                };
                const nextLabel: Record<string, string> = {
                  nouvelle: "Démarrer la préparation",
                  en_preparation: "Marquer prête",
                  prete: "Marquer livrée",
                };
                return (
                  <Card key={order.id} className={`border-l-4 ${order.status === "nouvelle" ? "border-l-amber-400" : order.status === "en_preparation" ? "border-l-blue-400" : order.status === "prete" ? "border-l-green-400" : "border-l-gray-300"}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-4 items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-blue-600">{order.orderRef}</span>
                            <Badge className={`text-xs border ${orderStatusColors[order.status] ?? ""}`}>{orderStatusLabels[order.status] ?? order.status}</Badge>
                            {order.deliveryType === "livraison" ? (
                              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5">🚵 Livraison</span>
                            ) : (
                              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">🏠 Sur place</span>
                            )}
                          </div>
                          <p className="font-semibold text-sm">{order.customerName} — <span className="text-gray-500 font-normal">{order.customerPhone}</span></p>
                          {order.deliveryAddress && <p className="text-xs text-gray-500 mt-0.5">📍 {order.deliveryAddress}</p>}
                          {order.estimatedPrepTime && <p className="text-xs text-gray-400 mt-0.5">⏱ Temps estimé : {order.estimatedPrepTime} min</p>}
                          <div className="mt-2 space-y-0.5">
                            {items.map((it: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600">{it.qty}× {it.name} — <span className="font-medium">{(it.priceXOF * it.qty).toLocaleString()} FCFA</span></div>
                            ))}
                          </div>
                          {order.notes && <p className="text-xs text-gray-400 mt-1 italic">“{order.notes}”</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-bold text-base text-orange-600">{Number(order.totalXOF).toLocaleString()} FCFA</p>
                          <p className="text-xs text-gray-400">{order.createdAt instanceof Date ? order.createdAt.toLocaleString("fr-FR") : new Date(order.createdAt).toLocaleString("fr-FR")}</p>
                          <div className="flex gap-1.5 flex-wrap justify-end">
                            {nextStatus[order.status] && (
                              <Button size="sm" className="text-xs h-7 bg-[#E8751A] hover:bg-[#D06015] text-white"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: nextStatus[order.status] as any })}>
                                {nextLabel[order.status]}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-xs h-7 text-gray-600 border-gray-200 hover:bg-gray-50"
                              onClick={() => {
                                const itemsArr: any[] = (() => { try { return JSON.parse(order.itemsJson); } catch { return []; } })();
                                const dateStr = order.createdAt instanceof Date ? order.createdAt.toLocaleString("fr-FR") : new Date(order.createdAt).toLocaleString("fr-FR");
                                const rows = itemsArr.map((it: any) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${it.qty}× ${it.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${(it.priceXOF * it.qty).toLocaleString()} FCFA</td></tr>`).join("");
                                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bon de commande ${order.orderRef}</title><style>body{font-family:Arial,sans-serif;max-width:400px;margin:20px auto;padding:20px;font-size:13px}h2{text-align:center;color:#E8751A;margin:0 0 4px}p{margin:2px 0}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f5f5f5;padding:6px 8px;text-align:left;font-size:12px}td{font-size:12px}.total{font-weight:bold;font-size:15px;text-align:right;padding:8px 0;border-top:2px solid #E8751A}.footer{text-align:center;font-size:11px;color:#888;margin-top:16px;border-top:1px dashed #ccc;padding-top:8px}@media print{button{display:none}}</style></head><body><h2>HUB_RESA</h2><p style="text-align:center;color:#888;font-size:11px">Bon de commande</p><hr style="margin:10px 0"><p><strong>Référence :</strong> ${order.orderRef}</p><p><strong>Client :</strong> ${order.customerName}</p><p><strong>Téléphone :</strong> ${order.customerPhone}</p>${order.deliveryAddress ? `<p><strong>Adresse :</strong> ${order.deliveryAddress}</p>` : ""}<p><strong>Type :</strong> ${order.deliveryType === "livraison" ? "Livraison" : "Sur place"}</p><p><strong>Date :</strong> ${dateStr}</p><table><thead><tr><th>Article</th><th style="text-align:right">Prix</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total : ${Number(order.totalXOF).toLocaleString()} FCFA</div>${order.estimatedPrepTime ? `<p style="color:#888;font-size:11px">⏱ Temps de préparation estimé : ${order.estimatedPrepTime} min</p>` : ""}${order.notes ? `<p style="color:#888;font-size:11px;font-style:italic">Note : ${order.notes}</p>` : ""}<div class="footer">HUB_RESA &mdash; clients@hub_resa.com<br>+225 0504921096 / 0701578857</div></body></html>`;
                                const w = window.open("", "_blank", "width=500,height=700");
                                if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
                              }}>
                              <Printer className="h-3 w-3 mr-1" />
                              Imprimer
                            </Button>
                            {order.status !== "annulee" && order.status !== "livree" && (
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "annulee" })}>
                                Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ─── EMBARQUEMENT */}
          <TabsContent value="embarquement">
            {isTransport && myCompany && (
              <EmbarquementModule companyId={myCompany.id} departures={[]} />
            )}
          </TabsContent>

          {/* ─── MANIFESTE */}
          <TabsContent value="manifeste">
            {isTransport && myCompany && (
              <ManifesteModule companyId={myCompany.id} departures={[]} />
            )}
          </TabsContent>

          {/* ─── FINANCE */}
          <TabsContent value="finance">
            {isTransport && myCompany && (
              <FinanceModule companyId={myCompany.id} />
            )}
            {!isTransport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Résumé du jour</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {myCompany?.activityType === "transport" && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm text-gray-700">Recette billetterie</span>
                        <span className="font-bold text-[#E8751A]">{(stats?.ticketsRevenueToday ?? 0).toLocaleString()} XOF</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                        <span className="text-sm text-gray-700">Recette expéditions</span>
                        <span className="font-bold text-sky-600">{(stats?.shipmentsRevenueToday ?? 0).toLocaleString()} XOF</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                        <span className="text-sm font-semibold text-gray-700">Total du jour</span>
                        <span className="font-bold text-green-600 text-lg">
                          {((stats?.ticketsRevenueToday ?? 0) + (stats?.shipmentsRevenueToday ?? 0)).toLocaleString()} XOF
                        </span>
                      </div>
                    </>
                  )}
                  {myCompany?.activityType === "restauration" && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm text-gray-700">CA commandes du jour</span>
                        <span className="font-bold text-[#E8751A]">{(restaurantStats?.caToday ?? 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-700">Commandes livrées</span>
                        <span className="font-bold text-green-600">{restaurantStats?.ordersDelivered ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                        <span className="text-sm text-gray-700">Panier moyen</span>
                        <span className="font-bold text-sky-600">{(restaurantStats?.avgBasket ?? 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                        <span className="text-sm text-gray-700">Total commandes du jour</span>
                        <span className="font-bold text-amber-600">{restaurantStats?.ordersTotal ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                        <span className="text-sm font-semibold text-gray-700">CA total du jour</span>
                        <span className="font-bold text-green-600 text-lg">{(restaurantStats?.caToday ?? 0).toLocaleString()} FCFA</span>
                      </div>
                    </>
                  )}
                  {myCompany?.activityType === "expedition" && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                        <span className="text-sm text-gray-700">Recette expéditions</span>
                        <span className="font-bold text-sky-600">{(stats?.shipmentsRevenueToday ?? 0).toLocaleString()} XOF</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Frais HUB_RESA</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
                    {myCompany?.activityType === "transport" && (
                      <><p>• <strong>200 FCFA</strong> par billet vendu</p><p>• <strong>100 FCFA</strong> par expédition encaissée</p></>
                    )}
                    {myCompany?.activityType === "restauration" && (
                      <><p>• <strong>50 FCFA</strong> par commande livrée</p><p>• Commission mensuelle selon volume</p></>
                    )}
                    {myCompany?.activityType === "expedition" && (
                      <p>• <strong>100 FCFA</strong> par expédition encaissée</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Facturation mensuelle générée par l'équipe HUB_RESA</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
            {/* Zones de livraison (restauration uniquement) */}
            {myCompany?.activityType === "restauration" && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-base">Zones de livraison</h3>
                  <Button size="sm" className="bg-[#E8751A] hover:bg-[#D06015] text-white h-8 text-xs" onClick={() => { setEditingZoneId(null); setZoneForm({ name: "", description: "", extraMinutes: "15" }); setShowZoneForm(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une zone
                  </Button>
                </div>
                {showZoneForm && (
                  <Card className="mb-4 border-[#E8751A]/30">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nom de la zone *</Label>
                          <Input className="h-8 text-sm" placeholder="Ex: Zone Centre-ville" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input className="h-8 text-sm" placeholder="Ex: Rayon 3 km" value={zoneForm.description} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Délai supplémentaire (min) *</Label>
                          <Input className="h-8 text-sm" type="number" min="0" max="120" value={zoneForm.extraMinutes} onChange={(e) => setZoneForm({ ...zoneForm, extraMinutes: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="bg-[#E8751A] hover:bg-[#D06015] text-white h-7 text-xs"
                          disabled={!zoneForm.name || upsertZoneMutation.isPending}
                          onClick={() => upsertZoneMutation.mutate({ id: editingZoneId ?? undefined, name: zoneForm.name, description: zoneForm.description || undefined, extraMinutes: parseInt(zoneForm.extraMinutes) || 15 })}>
                          {upsertZoneMutation.isPending ? "Enregistrement..." : editingZoneId ? "Modifier" : "Ajouter"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowZoneForm(false)}>Annuler</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-2">
                  {(deliveryZones ?? []).length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Aucune zone de livraison configurée</p>}
                  {(deliveryZones ?? []).map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{zone.name}</p>
                        {zone.description && <p className="text-xs text-gray-500">{zone.description}</p>}
                        <p className="text-xs text-[#E8751A] font-medium mt-0.5">+{zone.extraMinutes} min de livraison</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingZoneId(zone.id); setZoneForm({ name: zone.name, description: zone.description ?? "", extraMinutes: String(zone.extraMinutes) }); setShowZoneForm(true); }}>Modifier</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => deleteZoneMutation.mutate({ id: zone.id })}>Supprimer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          {/* --- QR CODE & LIEN DIRECT */}
          <TabsContent value="qrcode">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code */}
              <CompanyQRCode
                companyId={(myCompany as any).id}
                companyName={(myCompany as any).companyName}
                activityType={activityType as "transport" | "restauration" | "expedition"}
              />
              {/* Gallery Manager */}
              <GalleryManager companyId={(myCompany as any).id} />
            </div>
          </TabsContent>

          {/* ─── CREDITS HUB_RESA */}
          <TabsContent value="credits">
            {myCompany && (
              <div className="space-y-6">
                <CompanyCreditsCard companyId={myCompany.id} />
              </div>
            )}
          </TabsContent>

          {/* ─── ÉQUIPE */}
          <TabsContent value="team">
            <TeamManager />
          </TabsContent>

          {/* ─── MESSAGES HUB_RESA */}
          <TabsContent value="messages">
            <CompanyInbox />
          </TabsContent>

          {/* ─── GALERIE PHOTOS */}
          <TabsContent value="galerie">
            <PhotoGalleryManager />
          </TabsContent>
          <TabsContent value="configuration">
            <ConfigurationPanel />
          </TabsContent>

          {/* ─── HÔTEL : CHAMBRES */}
          <TabsContent value="rooms">
            {isHotel && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Gestion des chambres</h2>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Ajouter une chambre
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {["Standard", "Supérieure", "Suite", "Familiale"].map((type) => (
                    <Card key={type} className="shadow-sm border-purple-100">
                      <CardContent className="p-4 text-center">
                        <BedDouble className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <div className="font-semibold text-gray-700">{type}</div>
                        <div className="text-xs text-gray-400 mt-1">Configurer les chambres</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Plan des chambres — Check-in / Check-out</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {["101","102","103","201","202","203"].map((room) => (
                        <div key={room} className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">Chambre {room}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 text-xs">Libre</Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">Module de gestion des chambres — à configurer avec vos données</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── HÔTEL : RÉSERVATIONS */}
          <TabsContent value="reservations">
            {isHotel && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Réservations hôtelières</h2>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Nouvelle réservation
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["N° Résa", "Client", "Chambre", "Arrivée", "Départ", "Nuits", "Montant", "Statut"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={8} className="text-center text-gray-400 py-8">Aucune réservation enregistrée</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── HÔTEL : SERVICES */}
          <TabsContent value="services">
            {isHotel && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Services hôteliers</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Restauration", icon: UtensilsCrossed, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500", desc: "Petit-déjeuner, dîjeuner, dîner" },
                    { label: "Pressing", icon: Scissors, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-500", desc: "Lavage, repassage, nettoyage" },
                    { label: "Piscine", icon: Waves, color: "bg-cyan-50 border-cyan-200", iconColor: "text-cyan-500", desc: "Accès piscine, serviettes" },
                    { label: "Room Service", icon: Coffee, color: "bg-green-50 border-green-200", iconColor: "text-green-500", desc: "Service en chambre 24h/24" },
                    { label: "Spa & Bien-être", icon: Waves, color: "bg-pink-50 border-pink-200", iconColor: "text-pink-500", desc: "Massages, soins, sauna" },
                    { label: "Transport", icon: Bus, color: "bg-orange-50 border-orange-200", iconColor: "text-orange-500", desc: "Navette aéroport, taxi" },
                    { label: "Salle de conférence", icon: Users, color: "bg-purple-50 border-purple-200", iconColor: "text-purple-500", desc: "Réunions, séminaires" },
                    { label: "Parking", icon: MapPin, color: "bg-gray-50 border-gray-200", iconColor: "text-gray-500", desc: "Parking sécurisé" },
                  ].map((s) => (
                    <Card key={s.label} className={`shadow-sm border ${s.color}`}>
                      <CardContent className="p-4 text-center">
                        <s.icon className={`h-8 w-8 ${s.iconColor} mx-auto mb-2`} />
                        <div className="font-semibold text-sm text-gray-700">{s.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                        <Button size="sm" variant="outline" className="mt-3 h-7 text-xs w-full">Configurer</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── BOUTIQUE : CATALOGUE */}
          <TabsContent value="catalog">
            {isBoutique && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Catalogue produits</h2>
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Ajouter un produit
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["Réf.", "Produit", "Catégorie", "Prix unitaire", "Stock", "Statut", "Action"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={7} className="text-center text-gray-400 py-8">Aucun produit dans le catalogue</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── BOUTIQUE : VENTES / CAISSE */}
          <TabsContent value="sales">
            {isBoutique && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Ventes & Tickets de caisse</h2>
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Nouvelle vente
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["N° Ticket", "Date", "Client", "Articles", "Total", "Paiement", "Statut", "Action"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={8} className="text-center text-gray-400 py-8">Aucun ticket de caisse enregistré</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── BOUTIQUE : STOCK */}
          <TabsContent value="stock">
            {isBoutique && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Gestion du stock</h2>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Entrée de stock
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Articles en stock", value: "—", icon: Archive, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Alertes stock faible", value: "—", icon: Tag, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Valeur du stock", value: "— XOF", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                  ].map((s) => (
                    <Card key={s.label} className={`shadow-sm ${s.bg}`}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <s.icon className={`h-8 w-8 ${s.color}`} />
                        <div>
                          <div className="text-xl font-bold text-gray-900">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["Réf.", "Produit", "Stock actuel", "Stock min.", "Dernière entrée", "Statut"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={6} className="text-center text-gray-400 py-8">Aucun article en stock</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── AGENCE VOYAGE : VOLS */}
          <TabsContent value="flights">
            {isAgenceVoyage && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recherche & Gestion des vols</h2>
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Ajouter un vol
                  </Button>
                </div>
                <Card className="mb-4">
                  <CardHeader><CardTitle className="text-base">Rechercher un vol</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Origine</Label>
                        <Input placeholder="Ex: ABJ (Abidjan)" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Destination</Label>
                        <Input placeholder="Ex: CDG (Paris)" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date aller</Label>
                        <Input type="date" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Passagers</Label>
                        <Input type="number" min="1" defaultValue="1" className="h-9 text-sm" />
                      </div>
                    </div>
                    <Button className="mt-3 bg-sky-500 hover:bg-sky-600 text-white">
                      <Search className="h-4 w-4 mr-1" />Rechercher
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["N° Vol", "Compagnie aérienne", "Origine", "Destination", "Départ", "Arrivée", "Places dispo", "Tarif", "Action"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={9} className="text-center text-gray-400 py-8">Aucun vol disponible</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── AGENCE VOYAGE : BILLETS AVION */}
          <TabsContent value="flight-tickets">
            {isAgenceVoyage && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Billets d'avion vendus</h2>
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Nouveau billet
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["N° Billet", "Passager", "Vol", "Origine", "Destination", "Date vol", "Classe", "Prix", "Statut", "Action"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={10} className="text-center text-gray-400 py-8">Aucun billet vendu</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── AGENCE VOYAGE : FORFAITS */}
          <TabsContent value="packages">
            {isAgenceVoyage && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Forfaits voyage</h2>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="h-4 w-4 mr-1" />Nouveau forfait
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Tout inclus", desc: "Vol + Hôtel + Transferts", icon: Package, color: "bg-green-50 border-green-200", iconColor: "text-green-500" },
                    { label: "Vol + Hôtel", desc: "Billet aller-retour + hébergement", icon: Plane, color: "bg-sky-50 border-sky-200", iconColor: "text-sky-500" },
                    { label: "Voyage sur mesure", desc: "Personnalisé selon les besoins", icon: MapPin, color: "bg-purple-50 border-purple-200", iconColor: "text-purple-500" },
                  ].map((p) => (
                    <Card key={p.label} className={`shadow-sm border ${p.color}`}>
                      <CardContent className="p-4 text-center">
                        <p.icon className={`h-8 w-8 ${p.iconColor} mx-auto mb-2`} />
                        <div className="font-semibold text-sm text-gray-700">{p.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{p.desc}</div>
                        <Button size="sm" variant="outline" className="mt-3 h-7 text-xs w-full">Créer un forfait</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["N° Forfait", "Client", "Destination", "Départ", "Retour", "Personnes", "Prix total", "Statut"].map(h => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={8} className="text-center text-gray-400 py-8">Aucun forfait enregistré</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── DIALOGS */}
      <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Créer un billet</DialogTitle></DialogHeader>
          {myCompany && <TicketForm companyId={myCompany.id} onClose={() => setShowTicketForm(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showShipmentForm} onOpenChange={setShowShipmentForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle expédition</DialogTitle></DialogHeader>
          <ShipmentForm onClose={() => setShowShipmentForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showDepartureForm} onOpenChange={setShowDepartureForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau départ</DialogTitle></DialogHeader>
          <DepartureForm onClose={() => setShowDepartureForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showBusLineForm} onOpenChange={setShowBusLineForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle ligne de bus</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ville de départ</Label>
                <Input list="cities-dep" value={busLineForm.departureCity} onChange={(e) => setBusLineForm({...busLineForm, departureCity: e.target.value})} placeholder="Abidjan" />
                <datalist id="cities-dep">{ALL_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="space-y-1">
                <Label>Ville d'arrivée</Label>
                <Input list="cities-arr" value={busLineForm.arrivalCity} onChange={(e) => setBusLineForm({...busLineForm, arrivalCity: e.target.value})} placeholder="Accra" />
                <datalist id="cities-arr">{ALL_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Type de ligne</Label>
                <Select value={busLineForm.lineType} onValueChange={(v) => setBusLineForm({...busLineForm, lineType: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBusLineForm(false)}>Annuler</Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!busLineForm.departureCity || !busLineForm.arrivalCity || upsertBusLineMutation.isPending}
                onClick={() => upsertBusLineMutation.mutate(busLineForm)}>
                {upsertBusLineMutation.isPending ? "Création..." : "Créer la ligne"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBusForm} onOpenChange={setShowBusForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter un bus</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Immatriculation *</Label>
                <Input value={busForm.registration} onChange={(e) => setBusForm({...busForm, registration: e.target.value})} placeholder="CI-1234-AB" />
              </div>
              <div className="space-y-1">
                <Label>Modèle</Label>
                <Input value={busForm.model} onChange={(e) => setBusForm({...busForm, model: e.target.value})} placeholder="Mercedes Sprinter" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Nombre de sièges *</Label>
                <Input type="number" min="1" max="100" value={busForm.capacity} onChange={(e) => setBusForm({...busForm, capacity: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBusForm(false)}>Annuler</Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!busForm.registration || !busForm.capacity || upsertBusMutation.isPending}
                onClick={() => upsertBusMutation.mutate({ registration: busForm.registration, model: busForm.model || undefined, capacity: parseInt(busForm.capacity) })}>
                {upsertBusMutation.isPending ? "Ajout..." : "Ajouter le bus"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </CompanyDashboardLayout>
  );
}
