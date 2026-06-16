import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, TrendingUp, Package } from "lucide-react";

export default function GasSupplierDashboardV2() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // Récupérer les commandes pending pour ce fournisseur
  const { data: pendingOrders, isLoading: loadingPending } = trpc.gas.workflow.getPendingForSupplier.useQuery(
    user?.id || 0,
    { enabled: !!user?.id }
  );

  // Récupérer les notifications non lues
  const { notifications: unreadNotifications } = useRealtimeNotifications(user?.id, "supplier");

  // Récupérer les statistiques du fournisseur
  const { data: supplierStats } = trpc.gas.stats.getSupplierStats.useQuery(
    user?.id || 0,
    { enabled: !!user?.id }
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder à ce dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Fournisseur</h1>
          <p className="text-gray-600">Gérez vos commandes de gaz et suivez vos statistiques</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{supplierStats?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{pendingOrders?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Revenu Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{supplierStats?.totalRevenue || 0} FCFA</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Taux de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{supplierStats?.conversionRate || "0%"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Commandes En Attente ({pendingOrders?.length || 0})</TabsTrigger>
            <TabsTrigger value="notifications">Notifications ({unreadNotifications?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          {/* Commandes En Attente */}
          <TabsContent value="pending" className="space-y-4">
            {loadingPending ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Chargement des commandes...</p>
                </CardContent>
              </Card>
            ) : !pendingOrders || pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Aucune commande en attente</p>
                </CardContent>
              </Card>
            ) : (
              pendingOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Commande #{order.reference}</CardTitle>
                        <CardDescription>{order.clientName}</CardDescription>
                      </div>
                      <Badge variant="default" className="bg-blue-600">
                        En Attente
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-4">
                    {/* Détails Commande */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Type de Bouteille</p>
                        <p className="font-medium text-lg">{order.bottleType}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Quantité</p>
                        <p className="font-medium text-lg">{order.quantity} x {order.bottleType}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Montant Total</p>
                        <p className="font-medium text-2xl text-green-600">{order.totalAmountXOF} FCFA</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Date de Commande</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>

                    {/* Détails Client */}
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Adresse de Livraison</p>
                      <p className="font-medium">{order.deliveryAddress}</p>
                      <p className="text-sm text-gray-600">{order.city}</p>
                      <p className="text-sm text-gray-600">Tél: {order.clientPhone}</p>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setSelectedOrder(order.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Accepter
                      </Button>
                      <Button
                        onClick={() => setSelectedOrder(order.id)}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            {!unreadNotifications || unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Aucune notification non lue</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification: any) => (
                <Card key={notification.id} className="overflow-hidden">
                  <CardHeader className="bg-purple-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {notification.notificationType === "new_order" && "Nouvelle Commande"}
                          {notification.notificationType === "order_validated" && "Commande Validée"}
                          {notification.notificationType === "order_delivered" && "Commande Livrée"}
                        </CardTitle>
                        <CardDescription>
                          {new Date(notification.createdAt).toLocaleString("fr-FR")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Historique */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Commandes</CardTitle>
                <CardDescription>Toutes les commandes livrées et complétées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplierStats && supplierStats.deliveredOrders > 0 ? (
                    <p className="text-center text-gray-600">{supplierStats.deliveredOrders} commandes livrées</p>
                  ) : (
                    <p className="text-center text-gray-500">Aucune commande livrée</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
