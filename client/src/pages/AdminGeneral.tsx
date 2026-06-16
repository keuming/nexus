/**
 * AdminGeneral.tsx
 * Page d'administration générale pour configurer :
 * - Menus des restaurants
 * - Expéditions et tarifs
 * - Hôtels et chambres
 * - Boutiques et produits
 * - Agences de voyage
 * - Résidences meublées
 * - Loisirs
 * - Location & Vente
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UtensilsCrossed, Package, Hotel, ShoppingBag, Plane, Home, Zap, Car,
  Plus, Trash2, Edit2, Check, X, Loader2
} from "lucide-react";

const ACTIVITY_TYPES = [
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, color: "bg-orange-100 text-orange-600" },
  { id: "expedition", label: "Expédition", icon: Package, color: "bg-blue-100 text-blue-600" },
  { id: "hotel", label: "Hôtel", icon: Hotel, color: "bg-purple-100 text-purple-600" },
  { id: "boutique", label: "Boutique", icon: ShoppingBag, color: "bg-pink-100 text-pink-600" },
  { id: "agence", label: "Agence de Voyage", icon: Plane, color: "bg-sky-100 text-sky-600" },
  { id: "residence", label: "Résidence Meublée", icon: Home, color: "bg-green-100 text-green-600" },
  { id: "loisirs", label: "Loisirs", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
  { id: "location", label: "Location & Vente", icon: Car, color: "bg-red-100 text-red-600" },
];

// ─── Onglet Restaurant ────────────────────────────────────────────────────────
function RestaurantTab() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrepTime, setItemPrepTime] = useState("15");

  const seedMenus = trpc.menu.seedTestMenus.useMutation({
    onSuccess: () => {
      toast.success("✅ Menus de test créés avec succès !");
      setSelectedCompanyId("");
    },
    onError: (err) => {
      toast.error(`❌ Erreur: ${(err as any).message}`);
    },
  });

  const handleSeedMenus = () => {
    if (!selectedCompanyId) {
      toast.error("Sélectionnez un restaurant");
      return;
    }
    seedMenus.mutate({ companyId: Number(selectedCompanyId) });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-orange-600" />
            Configuration Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sélectionner un restaurant</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un restaurant..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Bushman Café</SelectItem>
                <SelectItem value="2">Le Montparnasse Restaurant</SelectItem>
                <SelectItem value="3">Restaurant Saakan</SelectItem>
                <SelectItem value="4">BACHALP HOTEL</SelectItem>
                <SelectItem value="5">Chez Ambroise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">🚀 Créer un menu de test</h4>
            <p className="text-sm text-gray-600 mb-3">
              Cliquez sur le bouton ci-dessous pour créer automatiquement un menu complet avec :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc">
              <li>4 catégories (Entrées, Plats, Boissons, Desserts)</li>
              <li>8 plats avec prix et temps de préparation</li>
              <li>2 zones de livraison</li>
            </ul>
            <Button
              onClick={handleSeedMenus}
              disabled={!selectedCompanyId || seedMenus.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {seedMenus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le menu de test
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div>
              <Label>Catégorie</Label>
              <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Ex: Entrées" />
            </div>
            <div>
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="5000" />
            </div>
            <div className="col-span-2">
              <Label>Nom du plat</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex: Poulet Rôti" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Description du plat" rows={2} />
            </div>
            <div>
              <Label>Temps de préparation (min)</Label>
              <Input type="number" value={itemPrepTime} onChange={(e) => setItemPrepTime(e.target.value)} placeholder="15" />
            </div>
            <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Onglet Expédition ────────────────────────────────────────────────────────
function ExpeditionTab() {
  const [companyName, setCompanyName] = useState("");
  const [tariffZone, setTariffZone] = useState("");
  const [tariffPrice, setTariffPrice] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Configuration Expédition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">📦 Ajouter une compagnie d'expédition</h4>
            <p className="text-sm text-gray-600 mb-3">
              Créez une nouvelle compagnie d'expédition avec ses tarifs par zone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nom de la compagnie</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Express Logistique" />
            </div>
            <div>
              <Label>Zone</Label>
              <Input value={tariffZone} onChange={(e) => setTariffZone(e.target.value)} placeholder="Ex: Abidjan Centre" />
            </div>
            <div>
              <Label>Tarif (FCFA)</Label>
              <Input type="number" value={tariffPrice} onChange={(e) => setTariffPrice(e.target.value)} placeholder="5000" />
            </div>
            <Button className="col-span-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la compagnie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Onglet Hôtel ────────────────────────────────────────────────────────────
function HotelTab() {
  const [hotelName, setHotelName] = useState("");
  const [roomType, setRoomType] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("2");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-purple-600" />
            Configuration Hôtels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">🏨 Ajouter une chambre</h4>
            <p className="text-sm text-gray-600 mb-3">
              Configurez les chambres disponibles avec leurs tarifs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Hôtel</Label>
              <Select value={hotelName} onValueChange={setHotelName}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un hôtel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casa">Casa Hôtel Résidence</SelectItem>
                  <SelectItem value="palais">Palais Wia</SelectItem>
                  <SelectItem value="avenue">L'Avenue Hotel Apartment</SelectItem>
                  <SelectItem value="novotel">Novotel Abidjan</SelectItem>
                  <SelectItem value="tiama">Hotel Tiama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de chambre</Label>
              <Input value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="Ex: Suite Deluxe" />
            </div>
            <div>
              <Label>Capacité</Label>
              <Input type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} placeholder="2" />
            </div>
            <div>
              <Label>Prix/nuit (FCFA)</Label>
              <Input type="number" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} placeholder="150000" />
            </div>
            <Button className="col-span-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la chambre
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Onglet Boutique ──────────────────────────────────────────────────────────
function BoutiqueTab() {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-pink-600" />
            Configuration Boutiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">🛍️ Ajouter un produit</h4>
            <p className="text-sm text-gray-600 mb-3">
              Configurez les produits disponibles dans les boutiques.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nom du produit</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: T-shirt Mode" />
            </div>
            <div>
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="15000" />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" placeholder="50" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Description du produit" rows={2} />
            </div>
            <Button className="col-span-2 bg-pink-600 hover:bg-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le produit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminGeneral() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎛️ Administration Générale</h1>
          <p className="text-gray-600 mt-2">Configurez facilement tous les types d'activité</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="restaurant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
            {ACTIVITY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.id} value={type.id} className="flex flex-col items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">{type.label.split(" ")[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="restaurant">
            <RestaurantTab />
          </TabsContent>

          <TabsContent value="expedition">
            <ExpeditionTab />
          </TabsContent>

          <TabsContent value="hotel">
            <HotelTab />
          </TabsContent>

          <TabsContent value="boutique">
            <BoutiqueTab />
          </TabsContent>

          <TabsContent value="agence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-sky-600" />
                  Configuration Agences de Voyage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Module en développement...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="residence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Configuration Résidences Meublées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Module en développement...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loisirs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Configuration Loisirs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Module en développement...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-red-600" />
                  Configuration Location & Vente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Module en développement...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
