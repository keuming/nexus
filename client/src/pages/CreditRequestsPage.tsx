/**
 * CreditRequestsPage — Page des demandes de crédit
 * Affiche l'historique des demandes d'achat de crédits avec leurs statuts
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CreditRequestsPage() {
  const [copied, setCopied] = useState<number | null>(null);

  // Récupérer toutes les demandes de crédit
  const { data: requests = [], isLoading } = trpc.billing.getAllCreditPurchases.useQuery(undefined, {
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const handleCopyLink = (link: string, id: number) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Lien copié dans le presse-papiers");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Complété";
      case "pending":
        return "En attente";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Demandes de Crédit</h1>
        <p className="text-gray-600 mt-1">Historique de toutes les demandes d'achat de crédits</p>
      </div>

      {/* Tableau des demandes */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-12 text-center">
            <p className="text-blue-900">Aucune demande de crédit pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {request.company?.companyName || "Compagnie inconnue"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getStatusColor(request.paymentStatus)}
                      >
                        {getStatusLabel(request.paymentStatus)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Montant</p>
                        <p className="font-semibold text-gray-900">
                          {request.amountFcfa.toLocaleString("fr-FR")} XOF
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Crédits</p>
                        <p className="font-semibold text-gray-900">
                          {request.creditsGranted}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Méthode</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {request.paymentMethod === "stripe"
                            ? "Stripe"
                            : request.paymentMethod === "hub2_mobile_money"
                            ? "Hub2 Mobile"
                            : request.paymentMethod === "bank_transfer"
                            ? "Virement"
                            : "Espèce"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {request.paymentLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(request.paymentLink, request.id)}
                        className="gap-1"
                      >
                        {copied === request.id ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                  </div>
                </div>

                {/* Lien de paiement */}
                {request.paymentLink && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Lien de paiement :</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={request.paymentLink}
                        readOnly
                        className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 truncate"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
