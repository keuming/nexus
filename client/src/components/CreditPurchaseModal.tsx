/**
 * CreditPurchaseModal — Interface d'encaissement des crédits NEXUS
 * Permet à l'admin NEXUS de :
 *  - Sélectionner une compagnie
 *  - Saisir le montant en FCFA
 *  - Choisir la méthode de paiement
 *  - Générer un lien de paiement
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, AlertCircle } from "lucide-react";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreditPurchaseModal({ isOpen, onClose, onSuccess }: CreditPurchaseModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [amountFcfa, setAmountFcfa] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const utils = trpc.useUtils();

  // Récupérer la liste des compagnies
  const { data: companies = [] } = trpc.transport.public.companies.useQuery(undefined, {
    enabled: isOpen,
  });

  // Créer une demande d'achat de crédits
  const createPurchase = trpc.billing.createCreditPurchase.useMutation({
    onSuccess: (data) => {
      setGeneratedLink(data.paymentLink);
      toast.success(`Lien de paiement généré pour ${data.creditsGranted} crédits`);
      utils.billing.getCreditStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de la demande");
    },
  });

  const handleGenerateLink = () => {
    if (!selectedCompanyId || !amountFcfa || !paymentMethod) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const amount = parseFloat(amountFcfa);
    if (amount <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    createPurchase.mutate({
      companyId: parseInt(selectedCompanyId),
      amountFcfa: amount,
      paymentMethod: paymentMethod as "stripe" | "hub2_mobile_money" | "bank_transfer" | "cash",
    });
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  const handleReset = () => {
    setSelectedCompanyId("");
    setAmountFcfa("");
    setPaymentMethod("stripe");
    setGeneratedLink("");
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Calculer les crédits à accorder
  const creditsToGrant = amountFcfa ? Math.floor(parseFloat(amountFcfa) / 125) : 0;
  const selectedCompany = companies.find((c: any) => c.id === parseInt(selectedCompanyId));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>💳 Encaissement de Crédits NEXUS</span>
          </DialogTitle>
          <DialogDescription>
            Créez une demande d'achat de crédits pour une compagnie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection de la compagnie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Compagnie *</label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez une compagnie..." />
              </SelectTrigger>
              <SelectContent>
                {(companies as any[]).filter((c: any) => c).map((company: any) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant en FCFA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Montant (FCFA) *</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Entrez le montant..."
                value={amountFcfa}
                onChange={(e) => setAmountFcfa(e.target.value)}
                min="125"
                step="125"
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-sm font-medium text-gray-600">XOF</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Minimum : 125 FCFA (1 crédit)</p>
          </div>

          {/* Affichage des crédits à accorder */}
          {creditsToGrant > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>{creditsToGrant} crédits</strong> seront accordés à la compagnie
              </p>
            </div>
          )}

          {/* Méthode de paiement */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Méthode de paiement *</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">
                  <span className="flex items-center gap-2">
                    💳 Stripe (Carte bancaire)
                  </span>
                </SelectItem>
                <SelectItem value="hub2_mobile_money">
                  <span className="flex items-center gap-2">
                    📱 Hub2 Mobile Money
                  </span>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <span className="flex items-center gap-2">
                    🏦 Virement bancaire
                  </span>
                </SelectItem>
                <SelectItem value="cash">
                  <span className="flex items-center gap-2">
                    💵 Espèce
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lien de paiement généré */}
          {generatedLink && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Lien de paiement généré</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs bg-white border border-green-200 rounded-md text-gray-600 truncate"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
              <p className="text-xs text-green-700">
                Partagez ce lien avec la compagnie pour effectuer le paiement
              </p>
            </div>
          )}

          {/* Résumé */}
          {selectedCompany && amountFcfa && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Compagnie :</strong> {selectedCompany.companyName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Montant :</strong> {parseFloat(amountFcfa).toLocaleString("fr-FR")} FCFA
              </p>
              <p className="text-sm text-gray-700">
                <strong>Crédits :</strong> {creditsToGrant}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Méthode :</strong> {
                  paymentMethod === "stripe" ? "Stripe (Carte)" :
                  paymentMethod === "hub2_mobile_money" ? "Hub2 Mobile Money" :
                  paymentMethod === "bank_transfer" ? "Virement" : "Espèce"
                }
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {!generatedLink ? (
            <Button
              onClick={handleGenerateLink}
              disabled={!selectedCompanyId || !amountFcfa || createPurchase.isPending}
              className="bg-[#E8751A] hover:bg-[#d46a0f] text-white"
            >
              {createPurchase.isPending ? "Génération..." : "Générer le lien"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                handleReset();
                onSuccess?.();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Nouvelle demande
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
