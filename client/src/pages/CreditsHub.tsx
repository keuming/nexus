import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Coins,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Globe,
  RefreshCw,
  Download,
  FileText,
  Send,
  Loader2,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Opérateurs Hub2 disponibles
const HUB2_OPERATORS = [
  { key: "orange_ci", label: "Orange Money (CI)", color: "bg-orange-500", country: "CI" },
  { key: "mtn_ci",    label: "MTN MoMo (CI)",    color: "bg-yellow-500", country: "CI" },
  { key: "moov_ci",   label: "Moov Money (CI)",  color: "bg-blue-700",   country: "CI" },
  { key: "wave_ci",   label: "Wave (CI)",         color: "bg-blue-500",   country: "CI" },
  { key: "orange_sn", label: "Orange Money (SN)", color: "bg-orange-500", country: "SN" },
  { key: "free_sn",   label: "Free Money (SN)",   color: "bg-red-500",    country: "SN" },
  { key: "wave_sn",   label: "Wave (SN)",          color: "bg-blue-500",   country: "SN" },
  { key: "orange_cm", label: "Orange Money (CM)", color: "bg-orange-500", country: "CM" },
  { key: "mtn_cm",    label: "MTN MoMo (CM)",     color: "bg-yellow-500", country: "CM" },
  { key: "orange_bf", label: "Orange Money (BF)", color: "bg-orange-500", country: "BF" },
  { key: "moov_bf",   label: "Moov Money (BF)",   color: "bg-blue-700",   country: "BF" },
  { key: "orange_ml", label: "Orange Money (ML)", color: "bg-orange-500", country: "ML" },
  { key: "orange_gn", label: "Orange Money (GN)", color: "bg-orange-500", country: "GN" },
  { key: "mtn_gn",    label: "MTN MoMo (GN)",     color: "bg-yellow-500", country: "GN" },
  { key: "togocel_tg",label: "T-Money (TG)",      color: "bg-red-600",    country: "TG" },
  { key: "mtn_bj",    label: "MTN MoMo (BJ)",     color: "bg-yellow-500", country: "BJ" },
];

// Packs de crédits disponibles
const CREDIT_PACKS = [
  { points: 10, label: "Starter", description: "Idéal pour débuter", popular: false },
  { points: 50, label: "Essentiel", description: "Pour les petites compagnies", popular: false },
  { points: 100, label: "Pro", description: "Le plus populaire", popular: true },
  { points: 250, label: "Business", description: "Pour les moyennes compagnies", popular: false },
  { points: 500, label: "Premium", description: "Pour les grandes compagnies", popular: false },
  { points: 1000, label: "Entreprise", description: "Volume maximum", popular: false },
];

const PAYMENT_METHODS = [
  { value: "wave", label: "Wave", color: "bg-blue-500" },
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500" },
  { value: "mtn_money", label: "MTN Money", color: "bg-yellow-500" },
  { value: "moov_money", label: "Moov Money", color: "bg-blue-700" },
  { value: "especes", label: "Espèces", color: "bg-green-600" },
];

// Pays africains subsahariens avec leur code ISO
const AFRICAN_COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", symbol: "FCFA" },
  { code: "SN", name: "Sénégal", currency: "XOF", symbol: "FCFA" },
  { code: "ML", name: "Mali", currency: "XOF", symbol: "FCFA" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", symbol: "FCFA" },
  { code: "BJ", name: "Bénin", currency: "XOF", symbol: "FCFA" },
  { code: "TG", name: "Togo", currency: "XOF", symbol: "FCFA" },
  { code: "NE", name: "Niger", currency: "XOF", symbol: "FCFA" },
  { code: "GW", name: "Guinée-Bissau", currency: "XOF", symbol: "FCFA" },
  { code: "GN", name: "Guinée", currency: "GNF", symbol: "GNF" },
  { code: "CM", name: "Cameroun", currency: "XAF", symbol: "FCFA" },
  { code: "GA", name: "Gabon", currency: "XAF", symbol: "FCFA" },
  { code: "CG", name: "Congo-Brazzaville", currency: "XAF", symbol: "FCFA" },
  { code: "CD", name: "RD Congo", currency: "CDF", symbol: "FC" },
  { code: "CF", name: "Centrafrique", currency: "XAF", symbol: "FCFA" },
  { code: "TD", name: "Tchad", currency: "XAF", symbol: "FCFA" },
  { code: "MR", name: "Mauritanie", currency: "MRU", symbol: "MRU" },
  { code: "MG", name: "Madagascar", currency: "MGA", symbol: "Ar" },
  { code: "KM", name: "Comores", currency: "KMF", symbol: "KMF" },
  { code: "SC", name: "Seychelles", currency: "SCR", symbol: "SCR" },
  { code: "MU", name: "Maurice", currency: "MUR", symbol: "MUR" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦" },
  { code: "GH", name: "Ghana", currency: "GHS", symbol: "GHS" },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KES" },
  { code: "TZ", name: "Tanzanie", currency: "TZS", symbol: "TZS" },
  { code: "UG", name: "Ouganda", currency: "UGX", symbol: "UGX" },
  { code: "RW", name: "Rwanda", currency: "RWF", symbol: "RWF" },
  { code: "BI", name: "Burundi", currency: "BIF", symbol: "BIF" },
  { code: "ET", name: "Éthiopie", currency: "ETB", symbol: "ETB" },
  { code: "ZM", name: "Zambie", currency: "ZMW", symbol: "ZMW" },
  { code: "ZW", name: "Zimbabwe", currency: "USD", symbol: "USD" },
  { code: "MW", name: "Malawi", currency: "MWK", symbol: "MWK" },
  { code: "MZ", name: "Mozambique", currency: "MZN", symbol: "MZN" },
  { code: "AO", name: "Angola", currency: "AOA", symbol: "Kz" },
  { code: "NA", name: "Namibie", currency: "NAD", symbol: "NAD" },
  { code: "BW", name: "Botswana", currency: "BWP", symbol: "BWP" },
  { code: "ZA", name: "Afrique du Sud", currency: "ZAR", symbol: "R" },
  { code: "LS", name: "Lesotho", currency: "LSL", symbol: "LSL" },
  { code: "SZ", name: "Eswatini", currency: "SZL", symbol: "SZL" },
  { code: "LR", name: "Libéria", currency: "LRD", symbol: "LRD" },
  { code: "SL", name: "Sierra Leone", currency: "SLL", symbol: "SLL" },
  { code: "GM", name: "Gambie", currency: "GMD", symbol: "GMD" },
  { code: "CV", name: "Cap-Vert", currency: "CVE", symbol: "CVE" },
  { code: "ST", name: "São Tomé-et-Príncipe", currency: "STN", symbol: "STN" },
  { code: "GQ", name: "Guinée équatoriale", currency: "XAF", symbol: "FCFA" },
  { code: "SS", name: "Soudan du Sud", currency: "SSP", symbol: "SSP" },
  { code: "SO", name: "Somalie", currency: "SOS", symbol: "SOS" },
  { code: "DJ", name: "Djibouti", currency: "DJF", symbol: "DJF" },
  { code: "ER", name: "Érythrée", currency: "ERN", symbol: "ERN" },
];

export default function CreditsHub() {
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("wave");
  const [phone, setPhone] = useState("");
  const [buyOpen, setBuyOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [countryCode, setCountryCode] = useState("");
  // Hub2 states
  const [hub2Open, setHub2Open] = useState(false);
  const [hub2Step, setHub2Step] = useState<"form" | "processing" | "success" | "error">("form");
  const [hub2Points, setHub2Points] = useState<number>(100);
  const [hub2OperatorKey, setHub2OperatorKey] = useState("orange_ci");
  const [hub2Phone, setHub2Phone] = useState("");
  const [hub2IntentId, setHub2IntentId] = useState("");
  const [hub2Token, setHub2Token] = useState("");
  const [hub2RequestId, setHub2RequestId] = useState<number | null>(null);
  const [hub2ErrorMsg, setHub2ErrorMsg] = useState("");
  const [hub2NextAction, setHub2NextAction] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: balance, isLoading: balanceLoading } = trpc.transport.credits.getBalance.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.transport.credits.getHistory.useQuery({ limit: 100 });
  const { data: myRequests, isLoading: requestsLoading } = trpc.transport.credits.myRequests.useQuery();

  const buyMutation = trpc.transport.credits.buyCredits.useMutation({
    onSuccess: (data) => {
      setSuccessMsg(`✅ ${selectedPack} points crédités ! Nouveau solde : ${data.newBalance} points`);
      setBuyOpen(false);
      setSelectedPack(null);
      utils.transport.credits.getBalance.invalidate();
      utils.transport.credits.getHistory.invalidate();
    },
  });

  // Hub2 mutations
  const requestCreditMutation = trpc.transport.credits.requestCredit.useMutation();
  const initHub2Mutation = trpc.transport.credits.initHub2Payment.useMutation();
  const attemptHub2Mutation = trpc.transport.credits.attemptHub2Payment.useMutation();

  const handleHub2Submit = async () => {
    if (!hub2Phone || hub2Phone.length < 8) {
      toast.error("Entrez votre numéro Mobile Money");
      return;
    }
    setHub2Step("processing");
    setHub2ErrorMsg("");
    try {
      // 1. Créer la demande de crédit
      const pointPriceLocal = balance?.pointPriceLocal ?? 125;
      const reqResult = await requestCreditMutation.mutateAsync({
        points: hub2Points,
        paymentMethod: "mobile_money",
        paymentPhone: hub2Phone,
        paymentOperator: "other",
        notes: `Hub2/${hub2OperatorKey}`,
      });
      setHub2RequestId(reqResult.requestId);
      // 2. Initier l'intention de paiement Hub2
      const intentResult = await initHub2Mutation.mutateAsync({
        requestId: reqResult.requestId as number,
        providerKey: hub2OperatorKey,
      });
      setHub2IntentId(intentResult.intentId);
      setHub2Token(intentResult.token);
      // 3. Tenter le paiement Mobile Money
      const payResult = await attemptHub2Mutation.mutateAsync({
        intentId: intentResult.intentId,
        token: intentResult.token,
        providerKey: hub2OperatorKey,
        msisdn: hub2Phone,
      });
      setHub2NextAction(payResult.nextAction);
      setHub2Step("success");
      utils.transport.credits.myRequests.invalidate();
    } catch (err: any) {
      setHub2ErrorMsg(err?.message ?? "Erreur lors du paiement Hub2");
      setHub2Step("error");
    }
  };

  const resetHub2 = () => {
    setHub2Step("form");
    setHub2ErrorMsg("");
    setHub2IntentId("");
    setHub2Token("");
    setHub2RequestId(null);
    setHub2NextAction(null);
  };

  const updateCountryMutation = trpc.transport.credits.updateCountry.useMutation({
    onSuccess: () => {
      utils.transport.credits.getBalance.invalidate();
    },
  });

  const handleBuy = () => {
    if (!selectedPack) return;
    buyMutation.mutate({ points: selectedPack, paymentMethod: paymentMethod as any, phone });
  };

  // Générer et télécharger un reçu PDF (HTML print) pour une transaction de type "credit"
  const downloadReceipt = (tx: NonNullable<typeof history>[number]) => {
    if (tx.type !== "credit") return;
    const date = new Date(tx.createdAt).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const ref = `REC-${tx.id}-${Date.now().toString(36).toUpperCase()}`;
    const sym = balance?.symbol ?? "FCFA";
    const amountStr = tx.amountLocal ? `${Number(tx.amountLocal).toLocaleString()} ${sym}` : `${tx.points * 125} FCFA`;
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Facture NEXUS — ${ref}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
  .header { background: #E8751A; color: white; padding: 24px 32px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: .85; }
  .body { border: 1px solid #e5e7eb; border-top: none; padding: 28px 32px; border-radius: 0 0 8px 8px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 13px; }
  .value { font-weight: 600; font-size: 13px; }
  .total { background: #fff7ed; border-radius: 6px; padding: 14px 20px; margin: 20px 0; }
  .total .amount { font-size: 26px; font-weight: 800; color: #E8751A; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="header">
  <h1>NEXUS</h1>
  <p>Facture d'achat de crédits</p>
</div>
<div class="body">
  <div class="row"><span class="label">Référence</span><span class="value">${ref}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
  <div class="row"><span class="label">Statut</span><span class="value"><span class="badge">✅ Payé</span></span></div>
  <div class="row"><span class="label">Description</span><span class="value">${tx.description ?? "Achat de crédits"}</span></div>
  <div class="row"><span class="label">Points achetés</span><span class="value">${tx.points} point(s)</span></div>
  <div class="row"><span class="label">Solde après</span><span class="value">${tx.balanceAfter} point(s)</span></div>
  <div class="total">
    <div class="label">Montant total payé</div>
    <div class="amount">${amountStr}</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:4px;">1 point = 125 FCFA (ou équivalent en devise locale)</div>
  </div>
  <div class="footer">
    NEXUS &mdash; Service client : +225 0504921096 / 0701578857 &mdash; clients@nexus.com<br/>
    Ce document tient lieu de facture. Les points ne sont pas remboursables.
  </div>
</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    updateCountryMutation.mutate({ countryCode: code });
  };

  const currentCountry = AFRICAN_COUNTRIES.find((c) => c.code === (balance?.countryCode ?? "CI"));
  const pointPrice = balance?.pointPriceLocal ?? 125;
  const symbol = balance?.symbol ?? "FCFA";

  const isLowBalance = (balance?.balance ?? 0) < 10;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FACTURATION DES SERVICES NEXUS</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos crédits pour accéder aux services NEXUS. 1 point = {pointPrice.toLocaleString()} {symbol}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            utils.transport.credits.getBalance.invalidate();
            utils.transport.credits.getHistory.invalidate();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Alerte solde faible */}
      {isLowBalance && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Solde insuffisant</p>
            <p className="text-sm text-red-600 dark:text-red-500">
              Votre solde est inférieur à 10 points. Rechargez pour continuer à utiliser les services NEXUS.
            </p>
          </div>
          <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto bg-red-600 hover:bg-red-700 text-white">
                Recharger maintenant
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Message de succès */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-green-700 dark:text-green-400">{successMsg}</p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSuccessMsg("")}>✕</Button>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solde actuel */}
        <Card className={`border-2 ${isLowBalance ? "border-red-300 dark:border-red-700" : "border-[#E8751A]/30"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#E8751A]" />
              Solde actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${isLowBalance ? "text-red-500" : "text-[#E8751A]"}`}>
                  {balance?.balance ?? 0}
                </span>
                <span className="text-muted-foreground mb-1">points</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {((balance?.balance ?? 0) * pointPrice).toLocaleString()} {symbol}
            </p>
          </CardContent>
        </Card>

        {/* Tarif */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              Tarif par point
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-sky-500">{pointPrice.toLocaleString()}</span>
              <span className="text-muted-foreground mb-1">{symbol}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pays : {currentCountry?.name ?? "Côte d'Ivoire"}
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-purple-500">{history?.length ?? 0}</span>
              <span className="text-muted-foreground mb-1">opérations</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Historique complet ci-dessous</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Acheter des crédits */}
        <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E8751A] hover:bg-[#C96020] text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Acheter des crédits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#E8751A]" />
                Acheter des crédits NEXUS
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              {/* Sélection du pack */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Choisir un pack</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CREDIT_PACKS.map((pack) => {
                    const amount = pack.points * pointPrice;
                    return (
                      <button
                        key={pack.points}
                        onClick={() => setSelectedPack(pack.points)}
                        className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPack === pack.points
                            ? "border-[#E8751A] bg-[#E8751A]/10"
                            : "border-border hover:border-[#E8751A]/50"
                        }`}
                      >
                        {pack.popular && (
                          <span className="absolute -top-2 -right-2 bg-[#E8751A] text-white text-xs px-2 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                        <div className="font-bold text-lg text-[#E8751A]">{pack.points} pts</div>
                        <div className="text-xs font-semibold text-foreground">{pack.label}</div>
                        <div className="text-xs text-muted-foreground">{pack.description}</div>
                        <div className="text-sm font-bold mt-1 text-foreground">
                          {amount.toLocaleString()} {symbol}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Mode de paiement</Label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        paymentMethod === pm.value
                          ? "border-[#E8751A] bg-[#E8751A]/10 font-semibold"
                          : "border-border hover:border-[#E8751A]/50"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${pm.color}`} />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de téléphone */}
              {paymentMethod !== "especes" && (
                <div>
                  <Label htmlFor="phone-credit" className="text-sm font-semibold mb-1 block">
                    Numéro de téléphone mobile
                  </Label>
                  <Input
                    id="phone-credit"
                    placeholder="+225 0X XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              {/* Récapitulatif */}
              {selectedPack && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pack sélectionné</span>
                    <span className="font-semibold">{selectedPack} points</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant</span>
                    <span className="font-semibold text-[#E8751A]">
                      {(selectedPack * pointPrice).toLocaleString()} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mode de paiement</span>
                    <span className="font-semibold">
                      {PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Nouveau solde estimé</span>
                    <span className="text-[#E8751A]">{(balance?.balance ?? 0) + selectedPack} points</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setBuyOpen(false)}>
                  Annuler
                </Button>
                <Button
                  className="bg-[#E8751A] hover:bg-[#C96020] text-white"
                  disabled={!selectedPack || buyMutation.isPending}
                  onClick={handleBuy}
                >
                  {buyMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Traitement...</>
                  ) : (
                    <><Smartphone className="w-4 h-4 mr-2" />Confirmer le paiement</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payer via Hub2 Mobile Money */}
        <Dialog open={hub2Open} onOpenChange={(open) => { setHub2Open(open); if (!open) resetHub2(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#E8751A] text-[#E8751A] hover:bg-[#E8751A]/10">
              <Smartphone className="w-4 h-4 mr-2" />
              Payer Mobile Money (Hub2)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#E8751A]" />
                Achat de crédits via Hub2
              </DialogTitle>
            </DialogHeader>
            {hub2Step === "form" && (
              <div className="space-y-5 pt-2">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Nombre de points</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 250, 500, 1000, 2000].map((pts) => (
                      <button
                        key={pts}
                        onClick={() => setHub2Points(pts)}
                        className={`p-2 rounded-lg border-2 text-sm font-bold transition-all ${
                          hub2Points === pts ? "border-[#E8751A] bg-[#E8751A]/10 text-[#E8751A]" : "border-border hover:border-[#E8751A]/50"
                        }`}
                      >
                        {pts} pts<br/>
                        <span className="text-xs font-normal text-muted-foreground">{(pts * pointPrice).toLocaleString()} {symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Opérateur Mobile Money</Label>
                  <Select value={hub2OperatorKey} onValueChange={setHub2OperatorKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un opérateur" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {HUB2_OPERATORS.map((op) => (
                        <SelectItem key={op.key} value={op.key}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${op.color}`} />
                            {op.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Numéro Mobile Money</Label>
                  <Input
                    placeholder="Ex: 0701234567"
                    value={hub2Phone}
                    onChange={(e) => setHub2Phone(e.target.value)}
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Entrez le numéro associé à votre compte Mobile Money</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points demandés</span>
                    <span className="font-bold text-[#E8751A]">{hub2Points} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant à payer</span>
                    <span className="font-bold">{(hub2Points * pointPrice).toLocaleString()} {symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Opérateur</span>
                    <span className="font-semibold">{HUB2_OPERATORS.find(o => o.key === hub2OperatorKey)?.label}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setHub2Open(false)}>Annuler</Button>
                  <Button
                    className="bg-[#E8751A] hover:bg-[#C96020] text-white"
                    onClick={handleHub2Submit}
                    disabled={!hub2Phone || hub2Phone.length < 8}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Initier le paiement
                  </Button>
                </div>
              </div>
            )}
            {hub2Step === "processing" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-[#E8751A] animate-spin" />
                <p className="font-semibold text-center">Paiement en cours de traitement...</p>
                <p className="text-sm text-muted-foreground text-center">Veuillez valider la demande sur votre téléphone Mobile Money</p>
              </div>
            )}
            {hub2Step === "success" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="font-bold text-lg text-center">Demande envoyée avec succès !</p>
                <p className="text-sm text-muted-foreground text-center">
                  Votre demande de {hub2Points} points a été soumise. Vous recevrez une notification Mobile Money pour confirmer le paiement.
                  Dès confirmation, vos points seront crédités automatiquement.
                </p>
                {hub2NextAction && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 w-full">
                    <Info className="w-4 h-4 inline mr-1" />
                    {typeof hub2NextAction === "string" ? hub2NextAction : JSON.stringify(hub2NextAction)}
                  </div>
                )}
                <Button className="bg-[#E8751A] hover:bg-[#C96020] text-white" onClick={() => { setHub2Open(false); resetHub2(); }}>
                  Fermer
                </Button>
              </div>
            )}
            {hub2Step === "error" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <XCircle className="w-12 h-12 text-red-500" />
                <p className="font-bold text-lg text-center text-red-600">Erreur de paiement</p>
                <p className="text-sm text-muted-foreground text-center">{hub2ErrorMsg}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setHub2Open(false); resetHub2(); }}>Fermer</Button>
                  <Button className="bg-[#E8751A] hover:bg-[#C96020] text-white" onClick={() => { setHub2Step("form"); setHub2ErrorMsg(""); }}>Réessayer</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Changer de pays */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <Select
            value={countryCode || balance?.countryCode || "CI"}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Changer de pays" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {AFRICAN_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mes demandes de crédit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Mes demandes de crédit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : !myRequests || myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune demande de crédit pour le moment.</p>
              <p className="text-xs mt-1">Cliquez sur "Payer Mobile Money (Hub2)" pour soumettre une demande.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Opérateur</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Crédité le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="font-bold text-[#E8751A]">{req.points} pts</TableCell>
                      <TableCell className="text-sm">{Number(req.amountLocal).toLocaleString()} {req.currency}</TableCell>
                      <TableCell className="text-sm">{req.paymentOperator ?? req.notes ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{req.paymentPhone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          req.status === "credited" ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30" :
                          req.status === "confirmed" ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30" :
                          req.status === "rejected" ? "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30" :
                          "border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30"
                        }>
                          {req.status === "credited" ? "✅ Crédité" :
                           req.status === "confirmed" ? "🔄 Confirmé" :
                           req.status === "rejected" ? "❌ Rejeté" : "⏳ En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {req.creditedAt ? new Date(req.creditedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#E8751A]" />
            Tarification des services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🎫", label: "Billet de transport", cost: "1 point", desc: "Par billet vendu ou émis" },
              { icon: "📋", label: "Réservation", cost: "1 point", desc: "Par réservation confirmée" },
              { icon: "🛒", label: "Commande restaurant", cost: "1 point", desc: "Par commande enregistrée" },
              { icon: "📦", label: "Colis expédition", cost: "1 point", desc: "Par colis enregistré avec ticket" },
            ].map((item) => (
              <div key={item.label} className="p-4 border rounded-lg bg-muted/30 space-y-1">
                <div className="text-2xl">{item.icon}</div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-[#E8751A] font-bold">{item.cost}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            1 point = {pointPrice.toLocaleString()} {symbol} · Les points ne sont pas remboursables · Les débits sont automatiques à chaque transaction
          </p>
        </CardContent>
      </Card>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction pour le moment.</p>
              <p className="text-sm">Achetez des crédits pour commencer à utiliser les services NEXUS.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Solde après</TableHead>
                      <TableHead className="text-center">Facture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "credit"
                                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
                                : "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30"
                            }
                          >
                            {tx.type === "credit" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {tx.type === "credit" ? "Crédit" : "Débit"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{tx.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {tx.refId ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={tx.type === "credit" ? "text-green-600" : "text-red-500"}>
                            {tx.type === "credit" ? "+" : "-"}{tx.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#E8751A]">
                          {tx.balanceAfter} pts
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.type === "credit" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-[#E8751A] hover:text-[#C96020] hover:bg-orange-50"
                              onClick={() => downloadReceipt(tx)}
                              title="Télécharger la facture"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Facture
                            </Button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
