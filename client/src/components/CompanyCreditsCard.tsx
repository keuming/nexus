import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, ShoppingCart, History } from "lucide-react";
import CreditPurchaseModal from "./CreditPurchaseModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CompanyCreditsCardProps {
  companyId: number;
  onBuyClick?: () => void;
}

export default function CompanyCreditsCard({ companyId, onBuyClick }: CompanyCreditsCardProps) {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Récupérer le solde de crédits
  const { data: credits, isLoading: creditsLoading } = trpc.billing.getCompanyCredits.useQuery(
    { companyId },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Récupérer l'historique des achats
  const { data: purchases, isLoading: purchasesLoading } = trpc.billing.getCreditPurchaseHistory.useQuery(
    { companyId },
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Générer les données du graphique (7 derniers jours)
  useEffect(() => {
    if (purchases && purchases.length > 0) {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
          credits: 0,
        };
      });

      purchases.forEach((purchase) => {
        const purchaseDate = new Date(purchase.createdAt).toLocaleDateString("fr-FR", {
          month: "short",
          day: "numeric",
        });
        const dayData = last7Days.find((d) => d.date === purchaseDate);
        if (dayData && purchase.paymentStatus === "completed") {
          dayData.credits += purchase.creditsGranted || 0;
        }
      });

      setChartData(last7Days);
    }
  }, [purchases]);

  const creditBalance = credits?.balance || 0;
  const fcfaEquivalent = creditBalance * 125;
  const totalSpent = purchases?.filter((p) => p.paymentStatus === "completed").reduce((sum, p) => sum + (p.amountFcfa || 0), 0) || 0;
  const totalCreditsAcquired = purchases?.filter((p) => p.paymentStatus === "completed").reduce((sum, p) => sum + (p.creditsGranted || 0), 0) || 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Carte principale de solde */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Solde de Crédits</p>
              <h3 className="text-4xl font-bold text-blue-900 mt-2">{creditBalance.toLocaleString("fr-FR")}</h3>
              <p className="text-sm text-gray-500 mt-1">≈ {fcfaEquivalent.toLocaleString("fr-FR")} FCFA</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <Button
            onClick={() => {
              setShowBuyModal(true);
              onBuyClick?.();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Acheter des Crédits
          </Button>
        </Card>

        {/* Statistiques */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Crédits Acquis</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{totalCreditsAcquired.toLocaleString("fr-FR")}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Montant Investi</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{totalSpent.toLocaleString("fr-FR")} FCFA</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </Card>
        </div>
      </div>

      {/* Graphique d'historique */}
      {chartData.length > 0 && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Historique des 7 Derniers Jours</h4>
            <History className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="credits"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Historique des achats */}
      {purchases && purchases.length > 0 && (
        <Card className="mt-6 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Historique des Achats</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Montant</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Crédits</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Méthode</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 5).map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700">
                      {new Date(purchase.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-3 text-gray-700">{purchase.amountFcfa.toLocaleString("fr-FR")} FCFA</td>
                    <td className="py-3 px-3 font-semibold text-blue-600">{purchase.creditsGranted}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {purchase.paymentMethod === "stripe" ? "Carte" : "Mobile Money"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          purchase.paymentStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : purchase.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {purchase.paymentStatus === "completed"
                          ? "Complété"
                          : purchase.paymentStatus === "pending"
                          ? "En attente"
                          : "Échoué"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal d'achat */}
      {showBuyModal && (
        <CreditPurchaseModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            setShowBuyModal(false);
            // Refresh credits après achat
          }}
        />
      )}
    </>
  );
}
