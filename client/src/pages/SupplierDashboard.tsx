import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, Package, ShoppingCart, AlertTriangle } from "lucide-react";

const SUPPLIER_ID = 3; // ZAZA DÉPÔT

export default function SupplierDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Queries
  const overviewQuery = trpc.supplierDashboard.getOverview.useQuery({ supplierId: SUPPLIER_ID });
  const ordersQuery = trpc.supplierDashboard.getOrders.useQuery({
    supplierId: SUPPLIER_ID,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    page,
    limit: 10,
  });
  const metricsQuery = trpc.supplierDashboard.getPerformanceMetrics.useQuery({
    supplierId: SUPPLIER_ID,
    days: 30,
  });
  const lowStockQuery = trpc.supplierDashboard.getLowStockAlerts.useQuery({
    supplierId: SUPPLIER_ID,
    threshold: 10,
  });

  // Mutations
  const updateStatusMutation = trpc.supplierDashboard.updateOrderStatus.useMutation();
  const updateStockMutation = trpc.supplierDashboard.updateStock.useMutation();

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      orderId,
      status: newStatus as any,
      supplierId: SUPPLIER_ID,
    });
    ordersQuery.refetch();
  };

  const handleStockUpdate = async (bottleId: number, newStock: number) => {
    await updateStockMutation.mutateAsync({
      bottleId,
      newStock,
      supplierId: SUPPLIER_ID,
    });
    overviewQuery.refetch();
  };

  if (overviewQuery.isLoading) {
    return <div className="p-8">Chargement du dashboard...</div>;
  }

  const overview = overviewQuery.data;
  const orders = ordersQuery.data || [];
  const metrics = metricsQuery.data;
  const lowStocks = lowStockQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Fournisseur</h1>
          <p className="text-gray-600 mt-2">{overview?.supplier?.businessName}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overview?.stats?.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{overview?.stats?.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Livrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overview?.stats?.completedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {overview?.stats?.totalRevenue?.toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Commandes</CardTitle>
                <CardDescription>Visualisez et gérez toutes vos commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="in_transit">En transit</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Référence</th>
                        <th className="px-4 py-2 text-left">Client</th>
                        <th className="px-4 py-2 text-left">Montant</th>
                        <th className="px-4 py-2 text-left">Statut</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: any) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-sm">{order.reference}</td>
                          <td className="px-4 py-2">{order.clientName}</td>
                          <td className="px-4 py-2 font-semibold">{order.totalAmountXOF} FCFA</td>
                          <td className="px-4 py-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="confirmed">Confirmée</SelectItem>
                                <SelectItem value="in_transit">En transit</SelectItem>
                                <SelectItem value="delivered">Livrée</SelectItem>
                                <SelectItem value="cancelled">Annulée</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="outline" size="sm">
                              Détails
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">Page {page}</span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={orders.length < 10}
                  >
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Stocks</CardTitle>
                <CardDescription>Mettez à jour les niveaux de stock de vos produits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.stocks?.map((bottle: any) => (
                    <div key={bottle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{bottle.type} - {bottle.capacity}</h3>
                        <p className="text-sm text-gray-600">{bottle.priceXOF} FCFA</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{bottle.stock}</p>
                          <p className="text-xs text-gray-600">Stock actuel</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={bottle.stock}
                          className="w-20"
                          onBlur={(e) => {
                            const newStock = parseInt(e.target.value);
                            if (newStock !== bottle.stock) {
                              handleStockUpdate(bottle.id, newStock);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const input = document.querySelector(
                              `input[data-bottle-id="${bottle.id}"]`
                            ) as HTMLInputElement;
                            if (input) {
                              handleStockUpdate(bottle.id, parseInt(input.value));
                            }
                          }}
                        >
                          Mettre à jour
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-yellow-600" />
                  Alertes de Stock Faible
                </CardTitle>
                <CardDescription>Produits avec stock inférieur à 10 unités</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto mb-2 opacity-50" />
                    <p>Tous les stocks sont suffisants</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStocks.map((bottle: any) => (
                      <div
                        key={bottle.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold text-yellow-900">{bottle.type} - {bottle.capacity}</h3>
                          <p className="text-sm text-yellow-700">Stock: {bottle.stock} unités</p>
                        </div>
                        <Badge variant="destructive">Stock faible</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-blue-600" />
                  Métriques de Performance
                </CardTitle>
                <CardDescription>Derniers 30 jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Commandes par jour</h3>
                    <div className="space-y-2">
                      {metrics?.dailyOrders?.slice(-7).map((day: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{day.date}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 bg-orange-500 rounded"
                              style={{ width: `${Math.min(day.count * 20, 200)}px` }}
                            ></div>
                            <span className="text-sm font-semibold">{day.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Produits les plus vendus</h3>
                    <div className="space-y-2">
                      {metrics?.topBottles?.map((bottle: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{bottle.type} - {bottle.capacity}</span>
                          <Badge variant="secondary">{bottle.totalSold} ventes</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
