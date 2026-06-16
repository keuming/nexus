/**
 * Finance Module Component
 * Simplified financial management: daily/monthly summaries, charges
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import CashierEncaisserModule from "./CashierEncaisserModule";
import { toast } from "sonner";

interface FinanceModuleProps {
  companyId: number;
}

export default function FinanceModule({ companyId }: FinanceModuleProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    category: "carburant" as const,
    description: "",
    amount: "",
    station: "",
  });

  // Queries
  const dailySummary = trpc.management.finance.getDailySummary.useQuery({
    companyId,
    date: new Date(selectedDate),
  });

  const chargesHistory = trpc.management.finance.getChargesHistory.useQuery({
    companyId,
  });

  // Mutations
  const createChargeMutation = trpc.management.finance.createCharge.useMutation({
    onSuccess: () => {
      toast.success("Dépense enregistrée avec succès");
      setChargeForm({ category: "carburant", description: "", amount: "", station: "" });
      setShowChargeForm(false);
      chargesHistory.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateCharge = () => {
    if (!chargeForm.description || !chargeForm.amount) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    createChargeMutation.mutate({
      companyId,
      category: chargeForm.category,
      description: chargeForm.description,
      amount: chargeForm.amount,
      station: chargeForm.station || undefined,
    });
  };
  const categoryLabels: Record<string, string> = {
    carburant: "Carburant",
    maintenance: "Maintenance",
    salaire: "Salaire",
    frais_divers: "Frais divers",
  };

  const categoryColors: Record<string, string> = {
    carburant: "bg-amber-100 text-amber-800",
    maintenance: "bg-orange-100 text-orange-800",
    salaire: "bg-red-100 text-red-800",
    frais_divers: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* ─── Bouton ENCAISSER prominent */}
      <CashierEncaisserModule
        companyId={companyId}
        onSuccess={() => {
          dailySummary.refetch();
          chargesHistory.refetch();
        }}
      />

      {/* Daily Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Résumé du jour</h3>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9"
          />
        </div>

        {dailySummary.isLoading ? (
          <Card><CardContent className="py-8 text-center text-gray-400">Chargement...</CardContent></Card>
        ) : dailySummary.data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Encaissement Billets</p>
                    <p className="text-xl font-bold text-green-600">
                      {Number(dailySummary.data.encaissementBillets).toLocaleString()} XOF
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Encaissement Expéditions</p>
                    <p className="text-xl font-bold text-blue-600">
                      {Number(dailySummary.data.encaissementExpeditions).toLocaleString()} XOF
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Décaissement</p>
                    <p className="text-xl font-bold text-red-600">
                      {Number(dailySummary.data.decaissement).toLocaleString()} XOF
                    </p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Solde Net</p>
                    <p className="text-xl font-bold text-green-700">
                      {Number(dailySummary.data.soldeNet).toLocaleString()} XOF
                    </p>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Charges Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Enregistrer une dépense</CardTitle>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowChargeForm(!showChargeForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle dépense
            </Button>
          </div>
        </CardHeader>

        {showChargeForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Catégorie *</Label>
                <Select value={chargeForm.category} onValueChange={(v: any) => setChargeForm({ ...chargeForm, category: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carburant">Carburant</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="salaire">Salaire</SelectItem>
                    <SelectItem value="frais_divers">Frais divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Montant (XOF) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={chargeForm.amount}
                  onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Description *</Label>
              <Textarea
                placeholder="Ex: Plein d'essence pour le bus 001"
                value={chargeForm.description}
                onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                className="h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Gare/Station</Label>
              <Input
                placeholder="Ex: Gare Centrale"
                value={chargeForm.station}
                onChange={(e) => setChargeForm({ ...chargeForm, station: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white h-8"
                onClick={handleCreateCharge}
                disabled={createChargeMutation.isPending}
              >
                {createChargeMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setShowChargeForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charges History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des dépenses (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          {chargesHistory.isLoading ? (
            <p className="text-center text-gray-400 py-8">Chargement...</p>
          ) : (chargesHistory.data ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune dépense enregistrée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gare</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {(chargesHistory.data ?? []).map((charge) => (
                    <tr key={charge.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">
                        {charge.chargeDate instanceof Date
                          ? charge.chargeDate.toLocaleDateString("fr-FR")
                          : new Date(charge.chargeDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`text-xs ${categoryColors[charge.category] ?? ""}`}>
                          {categoryLabels[charge.category] ?? charge.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs">{charge.description}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{charge.station || "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">
                        -{Number(charge.amount).toLocaleString()} XOF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
