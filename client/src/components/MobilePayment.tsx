import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, CheckCircle, Loader2, AlertCircle } from "lucide-react";

type PaymentMethod = "wave" | "orange_money" | "mtn_money" | "moov_money";

interface MobilePaymentProps {
  amountXOF: number;
  orderRef: string;
  onSuccess: (method: PaymentMethod, phone: string) => void;
  onCancel: () => void;
}

const METHODS: { id: PaymentMethod; label: string; color: string; bg: string; prefix: string }[] = [
  { id: "wave", label: "Wave", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100", prefix: "+225 07" },
  { id: "orange_money", label: "Orange Money", color: "text-orange-600", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100", prefix: "+225 07" },
  { id: "mtn_money", label: "MTN Money", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100", prefix: "+225 05" },
  { id: "moov_money", label: "Moov Money", color: "text-blue-500", bg: "bg-blue-50 border-blue-100 hover:bg-blue-100", prefix: "+225 01" },
];

export function MobilePayment({ amountXOF, orderRef, onSuccess, onCancel }: MobilePaymentProps) {
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "done">("select");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const selectedMethod = METHODS.find((m) => m.id === method);

  const handleConfirm = () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    setError("");
    setStep("processing");
    // Simulate payment processing (2.5s)
    setTimeout(() => {
      setStep("done");
      setTimeout(() => onSuccess(method!, phone), 1500);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Smartphone className="h-4 w-4 text-[#E8751A]" />
              <span>Choisissez votre mode de paiement mobile</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setStep("confirm"); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${m.bg} ${m.color}`}
                >
                  <Smartphone className="h-5 w-5" />
                  {m.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onCancel}>
              Annuler
            </Button>
          </motion.div>
        )}

        {step === "confirm" && selectedMethod && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${selectedMethod.bg} ${selectedMethod.color} text-sm font-medium`}>
              <Smartphone className="h-4 w-4" />
              Paiement via {selectedMethod.label}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Référence</span>
                <span className="font-mono font-semibold">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant</span>
                <span className="font-bold text-[#E8751A]">{amountXOF.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Numéro {selectedMethod.label}</Label>
              <Input
                placeholder={`Ex: ${selectedMethod.prefix}XXXXXXX`}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                className="mt-1 h-9 text-sm"
              />
              {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              Vous recevrez une notification de confirmation sur votre téléphone. Validez le paiement pour confirmer votre commande.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-[#E8751A] hover:bg-[#C96020] text-white text-sm"
                onClick={handleConfirm}
              >
                Confirmer le paiement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStep("select")}>
                Retour
              </Button>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 gap-3"
          >
            <Loader2 className="h-10 w-10 animate-spin text-[#E8751A]" />
            <p className="text-sm font-medium text-gray-700">Traitement du paiement en cours…</p>
            <p className="text-xs text-gray-500">Veuillez valider la notification sur votre téléphone</p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 gap-3"
          >
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm font-bold text-gray-800">Paiement confirmé !</p>
            <p className="text-xs text-gray-500">Votre commande est en cours de traitement</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
