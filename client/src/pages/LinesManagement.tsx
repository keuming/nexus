import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  MapPin,
  DollarSign,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

export default function LinesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    departureCity: "",
    arrivalCity: "",
    distance: "",
    estimatedDuration: "",
    basePrice: "",
    description: "",
  });

  // Récupérer les lignes
  const { data: routes = [], isLoading, refetch } = trpc.routes.listRoutes.useQuery();

  // Mutations
  const createRoute = trpc.routes.createRoute.useMutation({
    onSuccess: () => {
      toast.success("Ligne créée avec succès");
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateRoute = trpc.routes.updateRoute.useMutation({
    onSuccess: () => {
      toast.success("Ligne mise à jour");
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteRoute = trpc.routes.deleteRoute.useMutation({
    onSuccess: () => {
      toast.success("Ligne supprimée");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleStatus = trpc.routes.toggleRouteStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const filteredRoutes = routes.filter(
    (route) =>
      route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.departureCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.arrivalCity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      departureCity: "",
      arrivalCity: "",
      distance: "",
      estimatedDuration: "",
      basePrice: "",
      description: "",
    });
    setEditingRoute(null);
  };

  const handleOpenDialog = (route?: any) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        name: route.name || "",
        departureCity: route.departureCity || "",
        arrivalCity: route.arrivalCity || "",
        distance: route.distance?.toString() || "",
        estimatedDuration: route.estimatedDuration?.toString() || "",
        basePrice: route.basePrice?.toString() || "",
        description: route.description || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.departureCity || !formData.arrivalCity || !formData.basePrice) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (editingRoute) {
      updateRoute.mutate({
        id: editingRoute.id,
        name: formData.name,
        departureCity: formData.departureCity,
        arrivalCity: formData.arrivalCity,
        distance: formData.distance ? parseInt(formData.distance) : undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        basePrice: formData.basePrice,
        description: formData.description,
      });
    } else {
      createRoute.mutate({
        name: formData.name,
        departureCity: formData.departureCity,
        arrivalCity: formData.arrivalCity,
        distance: formData.distance ? parseInt(formData.distance) : undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        basePrice: formData.basePrice,
        description: formData.description,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Lignes</h2>
          <p className="text-sm text-gray-600 mt-1">Créer et gérer les lignes de départ</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Ligne
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, ville de départ ou d'arrivée..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des lignes */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes de Départ ({filteredRoutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune ligne trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Départ → Arrivée</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {route.departureCity} → {route.arrivalCity}
                        </div>
                      </TableCell>
                      <TableCell>{route.distance} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {route.estimatedDuration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          {route.basePrice} XOF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={route.isActive ? "default" : "secondary"}>
                          {route.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(route)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne?")) {
                                deleteRoute.mutate({ id: route.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleStatus.mutate({
                                id: route.id,
                                isActive: !route.isActive,
                              })
                            }
                          >
                            {route.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoute ? "Modifier la ligne" : "Créer une nouvelle ligne"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Nom de la ligne *</label>
              <Input
                placeholder="Ex: Abidjan - Yamoussoukro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Ville de départ *</label>
                <Input
                  placeholder="Ex: Abidjan"
                  value={formData.departureCity}
                  onChange={(e) => setFormData({ ...formData, departureCity: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Ville d'arrivée *</label>
                <Input
                  placeholder="Ex: Yamoussoukro"
                  value={formData.arrivalCity}
                  onChange={(e) => setFormData({ ...formData, arrivalCity: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Distance (km)</label>
                <Input
                  type="number"
                  placeholder="Ex: 250"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Durée (minutes)</label>
                <Input
                  type="number"
                  placeholder="Ex: 300"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Prix de base (XOF) *</label>
              <Input
                type="number"
                placeholder="Ex: 15000"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <Input
                placeholder="Description optionnelle"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRoute.isPending || updateRoute.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {createRoute.isPending || updateRoute.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    En cours...
                  </>
                ) : editingRoute ? (
                  "Mettre à jour"
                ) : (
                  "Créer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
