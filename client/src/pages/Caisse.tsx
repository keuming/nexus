import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Lock,
  Minus,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_METHODS: Record<string, string> = {
  especes: "Espèces",
  carte: "Carte bancaire",
  virement: "Virement",
  mobile: "Mobile Money",
  cheque: "Chèque",
};

const CORRECT_PIN = "1234"; // Default PIN - in production this would be stored securely

export default function Caisse() {
  const utils = trpc.useUtils();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showEncaissement, setShowEncaissement] = useState(false);
  const [showDecaissement, setShowDecaissement] = useState(false);
  const [showCloture, setShowCloture] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("today");

  const { data: cashSummary } = trpc.caisse.getSummary.useQuery({ period: filterPeriod }, { enabled: isUnlocked });
  const { data: transactions } = trpc.caisse.getTransactions.useQuery({ period: filterPeriod }, { enabled: isUnlocked });

  function handlePinSubmit() {
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPin("");
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => setPinError(false), 2000);
    }
  }

  if (!isUnlocked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-sm border border-border shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Module Caisse
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez votre code PIN à 4 chiffres
                  </p>
                </div>

                <PinInput
                  value={pin}
                  onChange={setPin}
                  onSubmit={handlePinSubmit}
                  error={pinError}
                />

                {pinError && (
                  <p className="text-sm text-red-500 font-medium">Code PIN incorrect</p>
                )}

                <Button
                  className="w-full"
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                >
                  Accéder à la caisse
                </Button>
                <p className="text-xs text-muted-foreground">PIN par défaut : 1234</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalEncaissements = cashSummary?.totalEncaissements ?? 0;
  const totalDecaissements = cashSummary?.totalDecaissements ?? 0;
  const solde = cashSummary?.solde ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Caisse
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestion des encaissements et décaissements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsUnlocked(false)} className="gap-2">
              <Lock className="h-4 w-4" />
              Verrouiller
            </Button>
            <Button variant="outline" onClick={() => setShowCloture(true)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <Receipt className="h-4 w-4" />
              Clôturer
            </Button>
            <Button onClick={() => setShowDecaissement(true)} variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
              <Minus className="h-4 w-4" />
              Décaissement
            </Button>
            <Button onClick={() => setShowEncaissement(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Encaissement
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalEncaissements)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Encaissements</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <ArrowDownLeft className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDecaissements)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Décaissements</p>
            </CardContent>
          </Card>
          <Card className={`border ${solde >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${solde >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                  <Wallet className={`h-5 w-5 ${solde >= 0 ? "text-emerald-700" : "text-red-700"}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${solde >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(solde)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Solde de caisse</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Période :</span>
          {[
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "Cette semaine" },
            { value: "month", label: "Ce mois" },
            { value: "year", label: "Cette année" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setFilterPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterPeriod === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Historique des opérations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!transactions?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Aucune opération pour cette période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Référence</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Mode</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(t.paidAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`text-xs ${t.type === "encaissement" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {t.type === "encaissement" ? "Encaissement" : "Décaissement"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{t.description || t.notes || "-"}</td>
                        <td className="px-4 py-3 text-sm font-mono text-primary">{t.reference || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{PAYMENT_METHODS[t.method ?? ""] ?? t.method}</td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${t.type === "encaissement" ? "text-emerald-700" : "text-red-700"}`}>
                          {t.type === "encaissement" ? "+" : "-"}{formatCurrency(parseFloat(t.amount ?? "0"))}
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

      {showEncaissement && (
        <TransactionModal
          type="encaissement"
          onClose={() => setShowEncaissement(false)}
          onSuccess={() => { utils.caisse.getSummary.invalidate(); utils.caisse.getTransactions.invalidate(); setShowEncaissement(false); }}
        />
      )}
      {showDecaissement && (
        <TransactionModal
          type="decaissement"
          onClose={() => setShowDecaissement(false)}
          onSuccess={() => { utils.caisse.getSummary.invalidate(); utils.caisse.getTransactions.invalidate(); setShowDecaissement(false); }}
        />
      )}
      {showCloture && (
        <ClotureModal
          solde={solde}
          onClose={() => setShowCloture(false)}
          onConfirm={() => { setShowCloture(false); setIsUnlocked(false); toast.success("Caisse clôturée avec succès"); }}
        />
      )}
    </DashboardLayout>
  );
}

function PinInput({ value, onChange, onSubmit, error }: { value: string; onChange: (v: string) => void; onSubmit: () => void; error: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      onChange(value.slice(0, idx - 1));
    } else if (e.key === "Enter" && value.length === 4) {
      onSubmit();
    }
  }

  function handleChange(idx: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const newPin = value.slice(0, idx) + digit + value.slice(idx + 1);
    onChange(newPin);
    if (idx < 3) inputs.current[idx + 1]?.focus();
  }

  return (
    <div className="flex gap-3">
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          type="password"
          maxLength={1}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKey(idx, e)}
          className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-background focus:outline-none transition-colors ${error ? "border-red-400 bg-red-50" : value[idx] ? "border-primary bg-primary/5" : "border-border focus:border-primary"}`}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

function TransactionModal({ type, onClose, onSuccess }: { type: "encaissement" | "decaissement"; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ amount: "", method: "especes", description: "", reservationRef: "" });
  const { data: reservations } = trpc.reservations.list.useQuery({});

  const createMutation = trpc.caisse.createTransaction.useMutation({
    onSuccess: () => { toast.success(`${type === "encaissement" ? "Encaissement" : "Décaissement"} enregistré`); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Montant invalide"); return; }
    createMutation.mutate({
      type,
      amount: form.amount,
      method: form.method as any,
      description: form.description || undefined,
      reservationId: form.reservationRef ? reservations?.find(r => r.reference === form.reservationRef)?.id : undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={type === "encaissement" ? "text-emerald-700" : "text-red-700"}>
            {type === "encaissement" ? "Nouvel encaissement" : "Nouveau décaissement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Montant (FCFA) *</Label>
            <Input type="number" min="1" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="text-lg font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label>Mode de paiement</Label>
            <Select value={form.method} onValueChange={(v) => setForm(f => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "encaissement" && (
            <div className="space-y-1.5">
              <Label>Réservation liée (optionnel)</Label>
              <Select value={form.reservationRef} onValueChange={(v) => setForm(f => ({ ...f, reservationRef: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une réservation" /></SelectTrigger>
                <SelectContent>
                  {reservations?.filter(r => r.status !== "annulee").map(r => (
                    <SelectItem key={r.id} value={r.reference ?? ""}>
                      {r.reference} — {r.clientFirstName} {r.clientLastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Description / Motif</Label>
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Description de l'opération..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className={`flex-1 ${type === "encaissement" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClotureModal({ solde, onClose, onConfirm }: { solde: number; onClose: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700">Clôturer la caisse</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Vous êtes sur le point de clôturer la caisse. Cette action va verrouiller l'accès et enregistrer le solde final.
            </p>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">Solde final</span>
            <span className={`text-lg font-bold ${solde >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(solde)}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded" />
            <span className="text-sm text-muted-foreground">Je confirme la clôture de la caisse</span>
          </label>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!confirmed} onClick={onConfirm}>
              Clôturer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
