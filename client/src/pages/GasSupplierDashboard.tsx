import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, Plus, Edit2, Trash2, TrendingUp, Package, Truck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function GasSupplierDashboard() {
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [editingBottle, setEditingBottle] = useState<any>(null);
  const [newBottle, setNewBottle] = useState({
    type: "",
    capacity: "",
    priceXOF: 0,
    deliveryFeeXOF: 0,
    stock: 0,
    minStock: 5,
    description: "",
  });

  // Fetch supplier
  const { data: suppliers } = trpc.gas.suppliers.getById.useQuery(supplierId || 0, {
    enabled: !!supplierId,
  });
  const supplier = suppliers && suppliers.length > 0 ? suppliers[0] : null;

  // Fetch bottles
  const { data: bottles, refetch: refetchBottles } = trpc.gas.bottles.getBySupplierId.useQuery(supplierId || 0, {
    enabled: !!supplierId,
  });

  // Fetch orders
  const { data: orders } = trpc.gas.orders.getBySupplierId.useQuery(supplierId || 0, {
    enabled: !!supplierId,
  });

  // Fetch stats
  const { data: stats } = trpc.gas.stats.getSupplierStats.useQuery(supplierId || 0, {
    enabled: !!supplierId,
  });

  // Mutations
  const createBottleMutation = trpc.gas.bottles.create.useMutation({
    onSuccess: () => {
      toast.success("Bouteille créée avec succès");
      refetchBottles();
      setNewBottle({
        type: "",
        capacity: "",
        priceXOF: 0,
        deliveryFeeXOF: 0,
        stock: 0,
        minStock: 5,
        description: "",
      });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateBottleMutation = trpc.gas.bottles.update.useMutation({
    onSuccess: () => {
      toast.success("Bouteille mise à jour");
      refetchBottles();
      setEditingBottle(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateOrderMutation = trpc.gas.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Commande mise à jour");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateBottle = async () => {
    if (!supplierId || !newBottle.type || !newBottle.capacity) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    await createBottleMutation.mutateAsync({
      supplierId,
      ...newBottle,
    });
  };

  const handleUpdateBottle = async () => {
    if (!editingBottle) return;

    await updateBottleMutation.mutateAsync({
      id: editingBottle.id,
      type: editingBottle.type,
      capacity: editingBottle.capacity,
      priceXOF: editingBottle.priceXOF,
      deliveryFeeXOF: editingBottle.deliveryFeeXOF,
      stock: editingBottle.stock,
      minStock: editingBottle.minStock,
      description: editingBottle.description,
    });
  };

  const handleUpdateOrderStatus = async (orderId: number, status: "pending" | "confirmed" | "in_delivery" | "delivered" | "cancelled") => {
    await updateOrderMutation.mutateAsync({
      id: orderId,
      orderStatus: status,
    });
  };

  if (!supplierId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl font-bold text-gray-900">Dashboard Fournisseur</h1>
            </div>
            <p className="text-gray-600">Gérez vos bouteilles de gaz et vos commandes</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez votre Fournisseur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="supplierId">ID Fournisseur</Label>
                <Input
                  id="supplierId"
                  type="number"
                  placeholder="Entrez votre ID de fournisseur"
                  onChange={(e) => setSupplierId(parseInt(e.target.value) || null)}
                />
                <p className="text-sm text-gray-600">
                  Contactez l'administrateur si vous ne connaissez pas votre ID
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{supplier?.businessName || "Dashboard"}</h1>
                <p className="text-gray-600">{supplier?.phone || ""}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setSupplierId(null)}
            >
              Changer de Fournisseur
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Commandes Totales</p>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Truck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Livrées</p>
                  <p className="text-3xl font-bold">{stats.deliveredOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">En Attente</p>
                  <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Revenu Total</p>
                  <p className="text-2xl font-bold">{typeof stats.totalRevenue === 'string' ? parseInt(stats.totalRevenue) : stats.totalRevenue.toLocaleString()} FCFA</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bottles" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="bottles">Gestion des Bouteilles</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
          </TabsList>

          {/* Tab 1: Bottles Management */}
          <TabsContent value="bottles" className="space-y-6">
            {/* Add New Bottle */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une Bouteille
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une Nouvelle Bouteille</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type (B6, B12, etc.) *</Label>
                    <Input
                      id="type"
                      value={newBottle.type}
                      onChange={(e) => setNewBottle({ ...newBottle, type: e.target.value })}
                      placeholder="B6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacité (6kg, 12kg, etc.) *</Label>
                    <Input
                      id="capacity"
                      value={newBottle.capacity}
                      onChange={(e) => setNewBottle({ ...newBottle, capacity: e.target.value })}
                      placeholder="6kg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priceXOF">Prix (FCFA) *</Label>
                      <Input
                        id="priceXOF"
                        type="number"
                        value={newBottle.priceXOF}
                        onChange={(e) => setNewBottle({ ...newBottle, priceXOF: parseFloat(e.target.value) })}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryFeeXOF">Frais Livraison (FCFA) *</Label>
                      <Input
                        id="deliveryFeeXOF"
                        type="number"
                        value={newBottle.deliveryFeeXOF}
                        onChange={(e) => setNewBottle({ ...newBottle, deliveryFeeXOF: parseFloat(e.target.value) })}
                        placeholder="200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newBottle.stock}
                        onChange={(e) => setNewBottle({ ...newBottle, stock: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Stock Min</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newBottle.minStock}
                        onChange={(e) => setNewBottle({ ...newBottle, minStock: parseInt(e.target.value) })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newBottle.description}
                      onChange={(e) => setNewBottle({ ...newBottle, description: e.target.value })}
                      placeholder="Description optionnelle"
                    />
                  </div>
                  <Button
                    onClick={handleCreateBottle}
                    disabled={createBottleMutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {createBottleMutation.isPending ? "Création..." : "Créer Bouteille"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bottles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bottles && bottles.length > 0 ? (
                bottles.map((bottle: any) => (
                  <Card key={bottle.id} className="relative">
                    {bottle.stock <= bottle.minStock && (
                      <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                        Stock Faible
                      </div>
                    )}
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg">{bottle.type}</h3>
                        <p className="text-sm text-gray-600">{bottle.capacity}</p>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Prix:</span>
                          <span className="font-bold">{parseFloat(bottle.priceXOF).toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Livraison:</span>
                          <span className="font-bold">{parseFloat(bottle.deliveryFeeXOF).toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stock:</span>
                          <span className={`font-bold ${bottle.stock <= bottle.minStock ? "text-red-600" : "text-green-600"}`}>
                            {bottle.stock}
                          </span>
                        </div>
                      </div>

                      {bottle.description && (
                        <p className="text-sm text-gray-600 mb-4">{bottle.description}</p>
                      )}

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingBottle(bottle)}
                              className="flex-1"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Éditer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Éditer Bouteille</DialogTitle>
                            </DialogHeader>
                            {editingBottle && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Type</Label>
                                  <Input
                                    value={editingBottle.type}
                                    onChange={(e) => setEditingBottle({ ...editingBottle, type: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label>Capacité</Label>
                                  <Input
                                    value={editingBottle.capacity}
                                    onChange={(e) => setEditingBottle({ ...editingBottle, capacity: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Prix (FCFA)</Label>
                                    <Input
                                      type="number"
                                      value={editingBottle.priceXOF}
                                      onChange={(e) => setEditingBottle({ ...editingBottle, priceXOF: parseFloat(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Frais Livraison (FCFA)</Label>
                                    <Input
                                      type="number"
                                      value={editingBottle.deliveryFeeXOF}
                                      onChange={(e) => setEditingBottle({ ...editingBottle, deliveryFeeXOF: parseFloat(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Stock</Label>
                                    <Input
                                      type="number"
                                      value={editingBottle.stock}
                                      onChange={(e) => setEditingBottle({ ...editingBottle, stock: parseInt(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Stock Min</Label>
                                    <Input
                                      type="number"
                                      value={editingBottle.minStock}
                                      onChange={(e) => setEditingBottle({ ...editingBottle, minStock: parseInt(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <Button
                                  onClick={handleUpdateBottle}
                                  disabled={updateBottleMutation.isPending}
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                >
                                  {updateBottleMutation.isPending ? "Mise à jour..." : "Mettre à Jour"}
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune bouteille disponible</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Orders */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>{orders?.length || 0} commande(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold">{order.reference}</h4>
                            <p className="text-sm text-gray-600">{order.clientName} - {order.clientPhone}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            order.orderStatus === "delivered" ? "bg-green-100 text-green-800" :
                            order.orderStatus === "in_delivery" ? "bg-blue-100 text-blue-800" :
                            order.orderStatus === "confirmed" ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Montant:</span>
                            <span className="font-bold">{parseFloat(order.totalAmountXOF).toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Adresse:</span>
                            <span>{order.deliveryAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paiement:</span>
                            <span className={`font-bold ${order.paymentStatus === "paid" ? "text-green-600" : "text-orange-600"}`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {order.orderStatus !== "delivered" && (
                            <>
                              {order.orderStatus === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                                >
                                  Confirmer
                                </Button>
                              )}
                              {order.orderStatus === "confirmed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "in_delivery")}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  En Livraison
                                </Button>
                              )}
                              {order.orderStatus === "in_delivery" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  Livrée
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune commande</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
