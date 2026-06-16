/**
 * CashierEncaisserModule
 * Module d'encaissement rapide : billets, expéditions, services
 * Intégré dans FinanceModule avec un bouton ENCAISSER prominent
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Package,
  Printer,
  Smartphone,
  Ticket,
  Wrench,
  X,
} from "lucide-react";
import TicketPrintModal from "./TicketPrintModal";

interface CashierEncaisserModuleProps {
  companyId: number;
  onSuccess?: () => void;
}

type TransactionType = "ticket" | "shipment" | "service" | "other";
type PaymentMethod = "cash" | "card" | "mobile_money" | "check" | "transfer";

const TRANSACTION_TYPES: { value: TransactionType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "ticket", label: "Billet voyageur", icon: <Ticket className="h-5 w-5" />, color: "bg-orange-500" },
  { value: "shipment", label: "Expédition colis", icon: <Package className="h-5 w-5" />, color: "bg-sky-500" },
  { value: "service", label: "Service divers", icon: <Wrench className="h-5 w-5" />, color: "bg-purple-500" },
  { value: "other", label: "Autre encaissement", icon: <Banknote className="h-5 w-5" />, color: "bg-emerald-500" },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Espèces", icon: <Banknote className="h-4 w-4" /> },
  { value: "mobile_money", label: "Mobile Money", icon: <Smartphone className="h-4 w-4" /> },
  { value: "card", label: "Carte bancaire", icon: <CreditCard className="h-4 w-4" /> },
  { value: "transfer", label: "Virement", icon: <Banknote className="h-4 w-4" /> },
];

export default function CashierEncaisserModule({ companyId, onSuccess }: CashierEncaisserModuleProps) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"type" | "form" | "success">("type");
  const [transactionType, setTransactionType] = useState<TransactionType>("ticket");
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "cash" as PaymentMethod,
    notes: "",
    referenceId: "",
  });
  const [receiptNumber, setReceiptNumber] = useState("");
  const [showTicketPrint, setShowTicketPrint] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);

  // Lister les billets en attente d'encaissement
  const { data: pendingTickets } = trpc.transport.company.tickets.list.useQuery(
    { limit: 50 },
    { enabled: showModal && transactionType === "ticket" }
  );
  // Lister les expéditions en attente
  const { data: pendingShipments } = trpc.transport.company.shipments.list.useQuery(
    { limit: 50 },
    { enabled: showModal && transactionType === "shipment" }
  );

  const createTransactionMutation = trpc.cashier.createTransaction.useMutation({
    onSuccess: (data) => {
      setReceiptNumber(data.receiptNumber);
      setStep("success");
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  // Encaisser un billet existant
  const updateTicketStatusMutation = trpc.transport.company.tickets.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Billet encaissé avec succès");
    },
    onError: (e) => toast.error(e.message),
  });

  // Encaisser une expédition existante
  const updateShipmentStatusMutation = trpc.transport.company.shipments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Expédition encaissée avec succès");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleOpen() {
    setStep("type");
    setForm({ amount: "", paymentMethod: "cash", notes: "", referenceId: "" });
    setReceiptNumber("");
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setStep("type");
  }

  function handleTypeSelect(type: TransactionType) {
    setTransactionType(type);
    setStep("form");
  }

  function handleSubmit() {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }

    const refId = form.referenceId ? parseInt(form.referenceId) : undefined;

    // Si billet, mettre à jour le cashStatus
    if (transactionType === "ticket" && refId) {
      updateTicketStatusMutation.mutate({
        ticketId: refId,
        cashStatus: "encaisse",
      });
      setTicketId(refId);
    }

    // Si expédition, mettre à jour le cashStatus
    if (transactionType === "shipment" && refId) {
      updateShipmentStatusMutation.mutate({
        shipmentId: refId,
        status: "enregistre",
        cashStatus: "encaisse",
      });
    }

    createTransactionMutation.mutate({
      transactionType,
      referenceId: refId,
      referenceType: transactionType,
      amount: form.amount,
      currency: "XOF",
      paymentMethod: form.paymentMethod,
      companyId,
      notes: form.notes || undefined,
    });
  }

  const pendingTicketsList = (pendingTickets ?? []).filter((t) => t.cashStatus === "en_attente");
  const pendingShipmentsList = (pendingShipments ?? []).filter((s) => s.cashStatus === "en_attente");

  const selectedTicket = transactionType === "ticket" && form.referenceId
    ? pendingTickets?.find((t) => t.id === parseInt(form.referenceId))
    : null;
  const selectedShipment = transactionType === "shipment" && form.referenceId
    ? pendingShipments?.find((s) => s.id === parseInt(form.referenceId))
    : null;

  return (
    <>
      {/* ─── Bouton ENCAISSER prominent */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Caisse — Encaissement</h3>
              <p className="text-sm text-emerald-600 mt-0.5">
                Enregistrez un paiement : billet, expédition ou service
              </p>
            </div>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-8 h-12 shadow-lg shadow-emerald-200"
              onClick={handleOpen}
            >
              <Banknote className="h-5 w-5 mr-2" />
              ENCAISSER
            </Button>
          </div>

          {/* Compteurs rapides */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-500">Billets en attente</p>
              <p className="text-xl font-bold text-orange-600">
                {(pendingTickets ?? []).filter((t) => t.cashStatus === "en_attente").length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-500">Expéditions en attente</p>
              <p className="text-xl font-bold text-sky-600">
                {(pendingShipments ?? []).filter((s) => s.cashStatus === "en_attente").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal d'encaissement */}
      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-700 flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Encaissement
            </DialogTitle>
          </DialogHeader>

          {/* ÉTAPE 1 : Choix du type */}
          {step === "type" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Sélectionnez le type d'encaissement :</p>
              <div className="grid grid-cols-2 gap-3">
                {TRANSACTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeSelect(t.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                  >
                    <div className={`${t.color} text-white p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                      {t.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Formulaire */}
          {step === "form" && (
            <div className="space-y-4">
              {/* Type sélectionné */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                {TRANSACTION_TYPES.find((t) => t.value === transactionType)?.icon}
                <span className="font-medium text-sm">
                  {TRANSACTION_TYPES.find((t) => t.value === transactionType)?.label}
                </span>
                <button
                  onClick={() => setStep("type")}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Référence (billet ou expédition) */}
              {transactionType === "ticket" && pendingTicketsList.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Billet à encaisser (optionnel)</Label>
                  <Select
                    value={form.referenceId}
                    onValueChange={(v) => {
                      const ticket = pendingTickets?.find((t) => t.id === parseInt(v));
                      setForm((f) => ({
                        ...f,
                        referenceId: v,
                        amount: ticket?.priceXOF ? String(ticket.priceXOF) : f.amount,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un billet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingTicketsList.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.ticketNumber} — {t.firstName} {t.lastName}
                          {t.priceXOF ? ` · ${Number(t.priceXOF).toLocaleString()} XOF` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTicket && (
                    <div className="p-2 bg-orange-50 rounded text-xs text-orange-700">
                      Siège {selectedTicket.seatNumber} · {selectedTicket.firstName} {selectedTicket.lastName}
                    </div>
                  )}
                </div>
              )}

              {transactionType === "shipment" && pendingShipmentsList.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Expédition à encaisser (optionnel)</Label>
                  <Select
                    value={form.referenceId}
                    onValueChange={(v) => {
                      const shipment = pendingShipments?.find((s) => s.id === parseInt(v));
                      setForm((f) => ({
                        ...f,
                        referenceId: v,
                        amount: shipment?.priceXOF ? String(shipment.priceXOF) : f.amount,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une expédition" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingShipmentsList.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.trackingNumber} — {s.senderName} → {s.receiverName}
                          {s.priceXOF ? ` · ${Number(s.priceXOF).toLocaleString()} XOF` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedShipment && (
                    <div className="p-2 bg-sky-50 rounded text-xs text-sky-700">
                      {selectedShipment.senderCity} → {selectedShipment.receiverCity} · {selectedShipment.receiverName}
                    </div>
                  )}
                </div>
              )}

              {/* Montant */}
              <div className="space-y-1.5">
                <Label>Montant (XOF) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="text-xl font-bold h-12"
                />
              </div>

              {/* Mode de paiement */}
              <div className="space-y-1.5">
                <Label>Mode de paiement *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, paymentMethod: m.value }))}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        form.paymentMethod === m.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes (optionnel)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Commentaire..."
                />
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>
                  Retour
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={handleSubmit}
                  disabled={createTransactionMutation.isPending || !form.amount}
                >
                  {createTransactionMutation.isPending ? "Enregistrement..." : "Confirmer l'encaissement"}
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Succès */}
          {step === "success" && (
            <div className="text-center space-y-5 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Encaissement enregistré !</h3>
                <p className="text-sm text-gray-500 mt-1">Numéro de reçu :</p>
                <div className="mt-2 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3">
                  <p className="text-lg font-bold font-mono text-emerald-700">{receiptNumber}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {transactionType === "ticket" && ticketId && (
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setShowModal(false);
                      setShowTicketPrint(true);
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer le billet
                  </Button>
                )}
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleClose}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'impression du billet */}
      {showTicketPrint && ticketId && (
        <TicketPrintModal
          ticketId={ticketId}
          onClose={() => setShowTicketPrint(false)}
        />
      )}
    </>
  );
}
