import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function QuoteRequestsPanel() {
  const [selectedStatus, setSelectedStatus] = useState("new");
  const [selectedActivityType, setSelectedActivityType] = useState<string | undefined>(undefined);

  // Fetch quote requests
  const { data: quoteRequests, refetch, isLoading } = trpc.carousel.listQuoteRequests.useQuery({
    status: selectedStatus,
    activityType: selectedActivityType,
  });

  // Update status mutation
  const updateStatusMutation = trpc.carousel.updateQuoteRequestStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus as "new" | "contacted" | "closed",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "contacted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case "transport":
        return "bg-blue-100 text-blue-800";
      case "restaurant":
        return "bg-orange-100 text-orange-800";
      case "expedition":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Demandes de devis</h2>
        <p className="text-gray-600 mt-1">Gérez les demandes de devis reçues via le carrousel</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8751A]"
          >
            <option value="new">Nouvelles</option>
            <option value="contacted">Contactées</option>
            <option value="closed">Fermées</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activité</label>
          <select
            value={selectedActivityType || ""}
            onChange={(e) => setSelectedActivityType(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8751A]"
          >
            <option value="">Toutes</option>
            <option value="transport">Transport</option>
            <option value="restaurant">Restaurant</option>
            <option value="expedition">Expédition</option>
          </select>
        </div>
      </div>

      {/* Quote Requests List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : quoteRequests && quoteRequests.length > 0 ? (
        <div className="space-y-4">
          {quoteRequests.map((request: any, idx: number) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{request.name}</h3>
                        <Badge className={getActivityBadgeColor(request.activityType)}>
                          {request.activityType === "transport"
                            ? "Transport"
                            : request.activityType === "restaurant"
                            ? "Restaurant"
                            : "Expédition"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <span className="text-sm text-gray-600 capitalize">
                            {request.status === "new"
                              ? "Nouvelle"
                              : request.status === "contacted"
                              ? "Contactée"
                              : "Fermée"}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${request.email}`} className="hover:text-[#E8751A]">
                            {request.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${request.phone}`} className="hover:text-[#E8751A]">
                            {request.phone}
                          </a>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700">{request.message}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {request.status === "new" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(request.id, "contacted")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Marquer comme contactée
                      </Button>
                    )}
                    {request.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(request.id, "closed")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Fermer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucune demande de devis trouvée</p>
        </div>
      )}
    </div>
  );
}
