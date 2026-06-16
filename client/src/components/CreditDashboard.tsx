/**
 * CreditDashboard — Affichage du solde des crédits en temps réel
 * Visible par l'admin NEXUS et par chaque compagnie
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, Zap, RefreshCw } from "lucide-react";
import CreditPurchaseModal from "./CreditPurchaseModal";

interface CreditDashboardProps {
  isAdmin?: boolean;
  companyId?: number;
}

export default function CreditDashboard({ isAdmin = false, companyId }: CreditDashboardProps) {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const utils = trpc.useUtils();

  // Récupérer les statistiques de crédits (admin uniquement)
  const { data: stats, isLoading: statsLoading } = trpc.billing.getCreditStats.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Récupérer le solde de crédits d'une compagnie
  const { data: companyCredits, isLoading: creditsLoading } = trpc.billing.getCompanyCredits.useQuery(
    { companyId: companyId || 0 },
    {
      enabled: !!companyId && !isAdmin,
      refetchInterval: 30000,
    }
  );

  // Récupérer l'historique des achats
  const { data: purchaseHistory = [] } = trpc.billing.getCreditPurchaseHistory.useQuery(
    { companyId: companyId || 0, limit: 10 },
    {
      enabled: !!companyId && !isAdmin,
      refetchInterval: 30000,
    }
  );

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    utils.billing.getCreditStats.invalidate();
    if (companyId) {
      utils.billing.getCompanyCredits.invalidate();
      utils.billing.getCreditPurchaseHistory.invalidate();
    }
  };

  // Vue Admin
  if (isAdmin && stats) {
    return (
      <div className="space-y-6">
        {/* En-tête avec bouton d'encaissement */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Crédits</h2>
            <p className="text-sm text-gray-600 mt-1">Suivi des encaissements et distribution des crédits</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Rafraîchir
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[#E8751A] hover:bg-[#d46a0f] text-white gap-1"
            >
              <DollarSign className="h-4 w-4" />
              Nouvel encaissement
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total encaissé */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#E8751A]" />
                Total Encaissé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalAmountEncashed.toLocaleString("fr-FR")} XOF
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalAmountEncashed / 125} crédits distribués
              </p>
            </CardContent>
          </Card>

          {/* Crédits distribués */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Crédits Distribués
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalCreditsDistributed}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Équivalent {(stats.totalCreditsDistributed * 125).toLocaleString("fr-FR")} XOF
              </p>
            </CardContent>
          </Card>

          {/* Compagnies actives */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Compagnies Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.companiesWithCredits}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                sur {stats.totalCompanies} compagnies
              </p>
            </CardContent>
          </Card>

          {/* Moyenne par compagnie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Moyenne/Compagnie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageCreditsPerCompany}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                crédits par compagnie
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modal d'encaissement */}
        <CreditPurchaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            handleRefresh();
          }}
        />
      </div>
    );
  }

  // Vue Compagnie
  if (!isAdmin && companyCredits) {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Crédits NEXUS</h2>
          <p className="text-sm text-gray-600 mt-1">Suivi de votre solde de crédits</p>
        </div>

        {/* Solde principal */}
        <Card className="bg-gradient-to-r from-[#E8751A] to-[#d46a0f] text-white border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium opacity-90">Solde Actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-5xl font-bold">{companyCredits.balance}</div>
              <p className="text-sm opacity-90">crédits disponibles</p>
              <p className="text-lg font-semibold">
                ≈ {parseInt(companyCredits.equivalentFcfa).toLocaleString("fr-FR")} XOF
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Historique des achats */}
        {purchaseHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des Achats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseHistory.map((purchase: any) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        +{purchase.creditsGranted} crédits
                      </p>
                      <p className="text-xs text-gray-600">
                        {purchase.amountFcfa.toLocaleString("fr-FR")} XOF • {purchase.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          purchase.paymentStatus === "completed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : purchase.paymentStatus === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {purchase.paymentStatus === "completed"
                          ? "Complété"
                          : purchase.paymentStatus === "pending"
                          ? "En attente"
                          : "Échoué"}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(purchase.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si pas d'historique */}
        {purchaseHistory.length === 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 text-center">
                Aucun achat de crédits pour le moment. Contactez l'admin NEXUS pour en acheter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
