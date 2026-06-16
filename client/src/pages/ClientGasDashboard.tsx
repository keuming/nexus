import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Truck, AlertCircle, Plus } from "lucide-react";
import { Link } from "wouter";

export default function ClientGasDashboard() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // Récupérer les commandes du client (utiliser getByStatus avec supplierId)
  const { data: clientOrders = [], isLoading: loadingOrders } = trpc.gas.orders.getByStatus.useQuery(
    { supplierId: user?.id || 0, status: "pending" },
    { enabled: !!user?.id }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">En Attente</Badge>;
      case "assigned_to_deliveryman":
        return <Badge className="bg-blue-500">Assignée au Livreur</Badge>;
      case "validated_by_deliveryman":
        return <Badge className="bg-purple-500">Validée</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Livrée</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "assigned_to_deliveryman":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "validated_by_deliveryman":
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Commandes de Gaz</h1>
            <p className="text-gray-600">Suivez vos commandes et leur statut en temps réel</p>
          </div>
          <Link href="/gas-home">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Commande
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{clientOrders?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">En Cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {clientOrders?.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Livrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {clientOrders?.filter((o: any) => o.status === "delivered").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Dépense Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {clientOrders?.reduce((sum: number, o: any) => sum + (o.totalAmountXOF || 0), 0) || 0} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En Cours</TabsTrigger>
            <TabsTrigger value="delivered">Livrées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
          </TabsList>

          {/* Toutes les Commandes */}
          <TabsContent value="all" className="space-y-4">
            {loadingOrders ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Chargement des commandes...</p>
                </CardContent>
              </Card>
            ) : !clientOrders || clientOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">Aucune commande pour le moment</p>
                    <Link href="/gas-home">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Passer une Commande
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              clientOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <CardTitle className="text-lg">Commande #{order.reference}</CardTitle>
                          <CardDescription>
                            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
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
                        <p className="font-medium text-lg">{order.quantity}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Montant Total</p>
                        <p className="font-medium text-2xl text-green-600">{order.totalAmountXOF} FCFA</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Mode de Paiement</p>
                        <p className="font-medium">{order.paymentMethod || "N/A"}</p>
                      </div>
                    </div>

                    {/* Détails Livraison */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Adresse de Livraison</p>
                      <p className="font-medium">{order.deliveryAddress}</p>
                      <p className="text-sm text-gray-600">{order.city}</p>
                    </div>

                    {/* Détails Livreur et Fournisseur */}
                    {order.deliverymanId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Livreur Assigné</p>
                          <p className="font-medium">{order.deliverymanName || "En attente"}</p>
                          <p className="text-sm text-gray-600">{order.deliverymanPhone}</p>
                        </div>

                        {order.selectedSupplierId && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Fournisseur</p>
                            <p className="font-medium">{order.supplierName || "ZAZA DEPOT"}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline Statut */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-3">Statut de la Commande</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm">Commande Créée</span>
                        </div>
                        {order.status !== "pending" && (
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">Assignée au Livreur</span>
                          </div>
                        )}
                        {order.status === "validated_by_deliveryman" || order.status === "delivered" ? (
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-purple-500" />
                            <span className="text-sm">Validée par le Livreur</span>
                          </div>
                        ) : null}
                        {order.status === "delivered" && (
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm">Livrée</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Commandes En Cours */}
          <TabsContent value="pending" className="space-y-4">
            {clientOrders?.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Aucune commande en cours</p>
                </CardContent>
              </Card>
            ) : (
              clientOrders
                ?.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled")
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-blue-50">
                      <div className="flex items-center justify-between">
                        <CardTitle>Commande #{order.reference}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="font-medium mb-2">{order.bottleType} x {order.quantity}</p>
                      <p className="text-2xl font-bold text-green-600">{order.totalAmountXOF} FCFA</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Commandes Livrées */}
          <TabsContent value="delivered" className="space-y-4">
            {clientOrders?.filter((o: any) => o.status === "delivered").length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Aucune commande livrée</p>
                </CardContent>
              </Card>
            ) : (
              clientOrders
                ?.filter((o: any) => o.status === "delivered")
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-green-50">
                      <div className="flex items-center justify-between">
                        <CardTitle>Commande #{order.reference}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="font-medium mb-2">{order.bottleType} x {order.quantity}</p>
                      <p className="text-2xl font-bold text-green-600">{order.totalAmountXOF} FCFA</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Commandes Annulées */}
          <TabsContent value="cancelled" className="space-y-4">
            {clientOrders?.filter((o: any) => o.status === "cancelled").length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Aucune commande annulée</p>
                </CardContent>
              </Card>
            ) : (
              clientOrders
                ?.filter((o: any) => o.status === "cancelled")
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-red-50">
                      <div className="flex items-center justify-between">
                        <CardTitle>Commande #{order.reference}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="font-medium mb-2">{order.bottleType} x {order.quantity}</p>
                      <p className="text-2xl font-bold text-green-600">{order.totalAmountXOF} FCFA</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
