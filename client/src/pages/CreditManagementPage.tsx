/**
 * CreditManagementPage — Page de gestion des crédits NEXUS
 * Affiche le dashboard de gestion financière avec :
 * - Statistiques globales des encaissements
 * - Bouton pour créer une nouvelle demande d'encaissement
 * - Historique des transactions
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import CreditDashboard from "@/components/CreditDashboard";
import CreditPurchaseModal from "@/components/CreditPurchaseModal";

export default function CreditManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const utils = trpc.useUtils();

  const handleRefresh = () => {
    utils.billing.getCreditStats.invalidate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Crédits NEXUS</h1>
          <p className="text-gray-600 mt-1">Suivi des encaissements et distribution des crédits aux compagnies</p>
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
            <Plus className="h-4 w-4" />
            Nouvel encaissement
          </Button>
        </div>
      </div>

      {/* Dashboard des crédits */}
      <CreditDashboard isAdmin={true} />

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
