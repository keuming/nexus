import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

interface CashierModuleProps {
  companyId?: number;
  stationId?: number;
}

export function CashierModule({ companyId, stationId }: CashierModuleProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // Form state
  const [transactionType, setTransactionType] = useState<"ticket" | "shipment" | "service" | "other">("ticket");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_money" | "check" | "transfer">("cash");
  const [notes, setNotes] = useState("");

  // Queries
  const { data: transactions, isLoading, refetch } = trpc.cashier.listTransactions.useQuery({
    companyId,
    stationId,
    limit: 20,
  });

  const { data: totalData } = trpc.cashier.getTotalByPeriod.useQuery({
    companyId,
    stationId,
    startDate: new Date(selectedDate),
    endDate: new Date(selectedDate + "T23:59:59"),
  });

  // Mutations
  const createTransaction = trpc.cashier.createTransaction.useMutation({
    onSuccess: (data) => {
      toast.success(`Encaissement réussi — Reçu: ${data.receiptNumber}`);
      setAmount("");
      setNotes("");
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    await createTransaction.mutateAsync({
      transactionType,
      amount,
      paymentMethod,
      companyId,
      stationId,
      notes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalData?.total.toFixed(2) || "0.00"} XOF</div>
            <p className="text-xs text-gray-500 mt-1">{totalData?.count || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Encaissements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions?.filter((t) => t.transactionType === "ticket").length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Billets encaissés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expéditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions?.filter((t) => t.transactionType === "shipment").length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Expéditions encaissées</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="encaisser" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encaisser">Encaisser</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* Encaisser Tab */}
        <TabsContent value="encaisser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle transaction</CardTitle>
              <CardDescription>Enregistrer un encaissement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de transaction</Label>
                  <Select value={transactionType} onValueChange={(val: any) => setTransactionType(val)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Billet</SelectItem>
                      <SelectItem value="shipment">Expédition</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Montant</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Mode de paiement</Label>
                  <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                    <SelectTrigger id="method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="transfer">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Input
                    id="notes"
                    placeholder="Ajouter une note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateTransaction}
                disabled={createTransaction.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {createTransaction.isPending ? "Traitement..." : "Encaisser"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique Tab */}
        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="date">Date:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium capitalize">{transaction.transactionType}</div>
                        <div className="text-sm text-gray-600">{transaction.receiptNumber}</div>
                        <div className="text-xs text-gray-500">
                          {transaction.createdAt ? format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm") : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{transaction.amount} {transaction.currency}</div>
                        <div className="text-sm text-gray-600 capitalize">{transaction.paymentMethod}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucune transaction pour cette date</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
