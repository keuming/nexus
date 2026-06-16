import { useAuth } from "@/_core/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Bot,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import CsnMessaging from "@/components/CsnMessaging";
import RecruitmentMonitor from "@/components/RecruitmentMonitor";
import CsnChatbotPanel from "@/components/CsnChatbotPanel";
import AdminPanel from "@/components/AdminPanel";
import AddCompanyModal from "@/components/AddCompanyModal";
import ClientsManagement from "@/pages/ClientsManagement";
import BDevManagementPanel from "@/components/BDevManagementPanel";
import LinesManagement from "@/pages/LinesManagement";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────
type SidebarSection =
  | "overview"
  | "companies"
  | "billing"
  | "credits-overview"
  | "credit-requests"
  | "recruitment"
  | "chatbot"
  | "messaging"
  | "clients"
  | "admin-panel"
  | "bdev-management";

// ─── Bouton de déconnexion admin ──────────────────────────────────────────────
function AdminLogoutButton({ navigate }: { navigate: (path: string) => void }) {
  const logout = trpc.adminAuth.logout.useMutation({
    onSuccess: () => navigate("/"),
  });
  const { data: adminMe } = trpc.adminAuth.me.useQuery();
  if (!adminMe) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      <LogOut className="h-3.5 w-3.5" />
      Déconnexion
    </Button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "En attente", className: "bg-amber-100 text-amber-800 border-amber-200" },
    active: { label: "Actif", className: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Refusé", className: "bg-red-100 text-red-800 border-red-200" },
    suspended: { label: "Suspendu", className: "bg-gray-100 text-gray-800 border-gray-200" },
  };
  const s = map[status] ?? { label: status, className: "" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function BillingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-amber-100 text-amber-800" },
    facture: { label: "Facturé", className: "bg-blue-100 text-blue-800" },
    paye: { label: "Payé", className: "bg-green-100 text-green-800" },
  };
  const s = map[status] ?? { label: status, className: "" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function CreditRequestStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "En attente", className: "bg-amber-100 text-amber-800 border-amber-200" },
    payment_confirmed: { label: "Paiement confirmé", className: "bg-blue-100 text-blue-800 border-blue-200" },
    credited: { label: "Crédité ✓", className: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rejeté", className: "bg-red-100 text-red-800 border-red-200" },
  };
  const s = map[status] ?? { label: status, className: "" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({
  icon: Icon,
  label,
  section,
  active,
  badge,
  collapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  section: SidebarSection;
  active: boolean;
  badge?: number;
  collapsed: boolean;
  onClick: (s: SidebarSection) => void;
}) {
  return (
    <button
      onClick={() => onClick(section)}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
        active
          ? "bg-orange-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-white" : "text-gray-500 group-hover:text-gray-700"}`} />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-bold ${
          active ? "bg-white text-orange-600" : "bg-orange-500 text-white"
        }`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Module Historique Transactions par Compagnie ───────────────────────────
function CreditsTransactionHistory({ allCredits }: { allCredits: any[] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const { data: transactions, isLoading: txLoading } = trpc.transport.csn.companyTransactions.useQuery(
    { companyId: selectedCompanyId! },
    { enabled: selectedCompanyId !== null }
  );
  const selectedCompany = allCredits.find((c) => c.id === selectedCompanyId);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          Historique détaillé des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600 font-medium">Compagnie :</span>
          <Select
            value={selectedCompanyId ? String(selectedCompanyId) : ""}
            onValueChange={(v) => setSelectedCompanyId(Number(v))}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Sélectionner une compagnie" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {allCredits.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompany && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              Solde actuel : {selectedCompany.balance} pts
            </Badge>
          )}
        </div>
        {!selectedCompanyId ? (
          <p className="text-center text-gray-400 py-8 text-sm">Sélectionnez une compagnie pour voir son historique.</p>
        ) : txLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}</div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Aucune transaction pour cette compagnie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Points</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Solde avant</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Solde après</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={`text-xs ${
                        tx.type === "credit" ? "border-green-400 text-green-700 bg-green-50" :
                        tx.type === "debit" ? "border-red-400 text-red-700 bg-red-50" :
                        "border-gray-300 text-gray-600"
                      }`}>
                        {tx.type === "credit" ? "+ Crédit" : tx.type === "debit" ? "− Débit" : tx.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{tx.description ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-bold">
                      <span className={tx.type === "credit" ? "text-green-600" : "text-red-600"}>
                        {tx.type === "credit" ? "+" : "-"}{Math.abs(tx.points)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{tx.balanceBefore ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-orange-600">{tx.balanceAfter ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-400 font-mono">{tx.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Module Demandes de Crédit ────────────────────────────────────────────────
function CreditRequestsPanel() {
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: number; companyName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [manualCreditDialog, setManualCreditDialog] = useState(false);
  const [manualCreditTarget, setManualCreditTarget] = useState<{ id: number; name: string } | null>(null);
  const [manualForm, setManualForm] = useState({ companyId: "", points: "", paymentRef: "", notes: "" });
  const [manualCreditSuccess, setManualCreditSuccess] = useState<string | null>(null);
  // Étape 2 : confirmation par PIN
  const [creditStep, setCreditStep] = useState<"form" | "pin">("form");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { data: pinStatus } = trpc.transport.credits.hasPinDefined.useQuery(undefined, { enabled: manualCreditDialog });

  const { data: requests, isLoading } = trpc.transport.credits.allRequests.useQuery(
    { status: filterStatus === "all" ? undefined : filterStatus },
    { refetchInterval: 30000 }
  );
  const { data: companies } = trpc.transport.csn.companies.useQuery();

  const confirmMutation = trpc.transport.credits.confirmPayment.useMutation({
    onSuccess: () => {
      utils.transport.credits.allRequests.invalidate();
      utils.transport.csn.allCredits.invalidate();
    },
  });

  const rejectMutation = trpc.transport.credits.rejectRequest.useMutation({
    onSuccess: () => {
      utils.transport.credits.allRequests.invalidate();
      setRejectDialog(null);
      setRejectReason("");
    },
  });

  const adminCreditMutation = trpc.transport.credits.adminCreditCompany.useMutation({
    onSuccess: (data) => {
      utils.transport.csn.allCredits.invalidate();
      utils.transport.credits.allRequests.invalidate();
      setManualCreditSuccess(
        `✅ ${data.companyName} : ${data.balanceBefore} → ${data.newBalance} pts (+${data.newBalance - data.balanceBefore})`
      );
      setManualForm({ companyId: "", points: "", paymentRef: "", notes: "" });
      setManualCreditTarget(null);
      setConfirmPin("");
      setCreditStep("form");
      setTimeout(() => {
        setManualCreditDialog(false);
        setManualCreditSuccess(null);
      }, 2500);
    },
  });
  const handleOpenManualCredit = (target?: { id: number; name: string }) => {
    if (target) setManualCreditTarget(target);
    setCreditStep("form");
    setConfirmPin("");
    setManualCreditSuccess(null);
    setManualCreditDialog(true);
  };
  const handleSubmitCredit = () => {
    const companyId = manualCreditTarget?.id ? manualCreditTarget.id : Number(manualForm.companyId);
    adminCreditMutation.mutate({
      companyId,
      points: Number(manualForm.points),
      motif: manualForm.notes,
      reference: manualForm.paymentRef || undefined,
      confirmPin,
    });
  };

  const pendingCount = (requests ?? []).filter((r) => r.status === "pending").length;

  const operatorLabel: Record<string, string> = {
    orange_money: "Orange Money",
    mtn_momo: "MTN MoMo",
    moov_money: "Moov Money",
    wave: "Wave",
    other: "Autre",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Demandes de Crédits</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des demandes d'achat de points HUB_RESA</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-white">{pendingCount} en attente</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenManualCredit()}
            className="gap-1.5"
          >
            <Coins className="h-4 w-4" />
            Créditer manuellement
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total demandes", value: (requests ?? []).length, color: "text-gray-700", bg: "bg-gray-50" },
          { label: "En attente", value: (requests ?? []).filter(r => r.status === "pending").length, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Crédités", value: (requests ?? []).filter(r => r.status === "credited").length, color: "text-green-700", bg: "bg-green-50" },
          { label: "Rejetés", value: (requests ?? []).filter(r => r.status === "rejected").length, color: "text-red-700", bg: "bg-red-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Filtrer :</span>
        {[
          { value: "all", label: "Toutes" },
          { value: "pending", label: "En attente" },
          { value: "payment_confirmed", label: "Paiement confirmé" },
          { value: "credited", label: "Crédités" },
          { value: "rejected", label: "Rejetés" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterStatus === f.value
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table des demandes */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : (requests ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucune demande de crédit</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Compagnie</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Points</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Montant</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Paiement</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(requests ?? []).map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 ${
                        r.status === "pending" ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.companyName ?? `#${r.companyId}`}</div>
                        <div className="text-xs text-gray-400">{r.companyEmail ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-orange-600 text-base">{r.points}</span>
                        <span className="text-xs text-gray-500 ml-1">pts</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">
                          {Number(r.amountLocal).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{r.currency}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">
                          {r.paymentOperator ? operatorLabel[r.paymentOperator] ?? r.paymentOperator : r.paymentMethod}
                        </div>
                        {r.paymentPhone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {r.paymentPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {r.paymentRef ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <CreditRequestStatusBadge status={r.status ?? "pending"} />
                        {r.validatedBy && (
                          <div className="text-xs text-gray-400 mt-0.5">par {r.validatedBy}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                        <div className="text-gray-400">
                          {new Date(r.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-2"
                              disabled={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate({ requestId: r.id })}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                              onClick={() =>
                                setRejectDialog({
                                  open: true,
                                  requestId: r.id,
                                  companyName: r.companyName ?? `#${r.companyId}`,
                                })
                              }
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                        {r.status === "credited" && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Crédité le {r.creditedAt ? new Date(r.creditedAt).toLocaleDateString("fr-FR") : "—"}
                          </span>
                        )}
                        {r.status === "rejected" && (
                          <span className="text-xs text-red-500" title={r.rejectionReason ?? ""}>
                            Rejeté
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Mobile Money automatique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Validation automatique Mobile Money</p>
            <p className="text-xs text-blue-600 mt-1">
              Lorsqu'un paiement Mobile Money est confirmé par l'opérateur, le système crédite automatiquement le compte de la compagnie via le webhook sécurisé. Le CSN peut également valider manuellement en cliquant sur "Valider" ci-dessus.
            </p>
            <p className="text-xs text-blue-500 mt-1 font-mono">
              Endpoint webhook : /api/trpc/transport.credits.mobileMoneyWebhook
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog rejet */}
      {rejectDialog && (
        <Dialog open={rejectDialog.open} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter la demande</DialogTitle>
              <DialogDescription>
                Rejeter la demande de crédit de <strong>{rejectDialog.companyName}</strong> ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Motif du rejet (obligatoire)</Label>
              <Textarea
                placeholder="Expliquez la raison du rejet..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>Annuler</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={rejectMutation.isPending || rejectReason.length < 5}
                onClick={() =>
                  rejectMutation.mutate({ requestId: rejectDialog.requestId, reason: rejectReason })
                }
              >
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog crédit manuel */}
      <Dialog open={manualCreditDialog} onOpenChange={(open) => {
        if (!open) {
          setManualCreditTarget(null);
          setManualForm({ companyId: "", points: "", paymentRef: "", notes: "" });
          setManualCreditSuccess(null);
        }
        setManualCreditDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              Créditer manuellement un compte
            </DialogTitle>
            <DialogDescription>
              Ajouter des points directement sur le compte d'une compagnie. Cette action est enregistrée dans l'historique.
            </DialogDescription>
          </DialogHeader>

          {/* Message de succès */}
          {manualCreditSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {manualCreditSuccess}
            </div>
          )}
          {/* Erreur */}
          {adminCreditMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {adminCreditMutation.error.message}
            </div>
          )}

          {/* Étape 1 : Formulaire */}
          {creditStep === "form" && (
            <div className="space-y-3">
              {manualCreditTarget ? (
                <div className="space-y-1.5">
                  <Label>Compagnie</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                    <Building2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-orange-800">{manualCreditTarget.name}</span>
                    <button className="ml-auto text-xs text-gray-400 hover:text-gray-600" onClick={() => { setManualCreditTarget(null); setManualForm((f) => ({ ...f, companyId: "" })); }}>Changer</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Compagnie <span className="text-red-500">*</span></Label>
                  <Select value={manualForm.companyId} onValueChange={(v) => setManualForm((f) => ({ ...f, companyId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une compagnie" /></SelectTrigger>
                    <SelectContent>{(companies ?? []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Nombre de points <span className="text-red-500">*</span></Label>
                <Input type="number" min={1} max={100000} placeholder="ex: 50" value={manualForm.points} onChange={(e) => setManualForm((f) => ({ ...f, points: e.target.value }))} />
                {Number(manualForm.points) > 0 && <p className="text-xs text-gray-500">≈ {(Number(manualForm.points) * 500).toLocaleString()} FCFA</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Motif du crédit <span className="text-red-500">*</span></Label>
                <Textarea placeholder="Ex: Paiement reçu par virement, correction d'erreur, promotion..." value={manualForm.notes} onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Référence paiement (optionnel)</Label>
                <Input placeholder="ex: WAVE-2024-001, VIR-20240329" value={manualForm.paymentRef} onChange={(e) => setManualForm((f) => ({ ...f, paymentRef: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Étape 2 : Confirmation PIN */}
          {creditStep === "pin" && (
            <div className="space-y-4">
              {/* Récapitulatif */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <Coins className="h-4 w-4" /> Récapitulatif de l'opération
                </p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-gray-500">Compagnie :</span>
                  <span className="font-medium text-gray-800">{manualCreditTarget?.name ?? companies?.find(c => String(c.id) === manualForm.companyId)?.companyName ?? "—"}</span>
                  <span className="text-gray-500">Points à créditer :</span>
                  <span className="font-bold text-green-700">+{manualForm.points} pts</span>
                  <span className="text-gray-500">Motif :</span>
                  <span className="text-gray-700 truncate">{manualForm.notes}</span>
                  {manualForm.paymentRef && <><span className="text-gray-500">Référence :</span><span className="font-mono text-xs text-gray-600">{manualForm.paymentRef}</span></>}
                </div>
              </div>
              {/* Saisie PIN */}
              {!pinStatus?.hasPinDefined ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-semibold flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4" /> Aucun PIN défini</p>
                  <p>Vous devez définir un PIN de confirmation dans les paramètres avant de pouvoir effectuer des crédits manuels.</p>
                </div>
              ) : pinStatus?.isLocked ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  <p className="font-semibold flex items-center gap-2 mb-1"><Lock className="h-4 w-4" /> Compte verrouillé</p>
                  <p>Trop de tentatives incorrectes. Veuillez réessayer dans 15 minutes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-orange-500" />
                    PIN de confirmation <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={(e) => e.key === "Enter" && confirmPin.length >= 4 && !adminCreditMutation.isPending && handleSubmitCredit()}
                      className="pr-10 text-center text-xl tracking-[0.5em] font-mono"
                      autoFocus
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPin(!showPin)}>
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Saisissez votre PIN à 4–6 chiffres pour confirmer l'opération.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {creditStep === "form" ? (
              <>
                <Button variant="outline" onClick={() => setManualCreditDialog(false)}>Annuler</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!(manualCreditTarget?.id || manualForm.companyId) || !manualForm.points || Number(manualForm.points) < 1 || !manualForm.notes.trim()}
                  onClick={() => setCreditStep("pin")}
                >
                  Continuer →
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setCreditStep("form"); setConfirmPin(""); adminCreditMutation.reset?.(); }}>Retour</Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={adminCreditMutation.isPending || !!manualCreditSuccess || confirmPin.length < 4 || !pinStatus?.hasPinDefined || !!pinStatus?.isLocked}
                  onClick={handleSubmitCredit}
                >
                  {adminCreditMutation.isPending ? (
                    <><div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />Créditation...</>
                  ) : (
                    <><Lock className="h-4 w-4 mr-2" />Confirmer le crédit</>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
)
}
// ─── PIN Setup Card ─────────────────────────────────────────────────────────────────────────────────────
function PinSetupCard() {
  const [mode, setMode] = useState<"view" | "set" | "change">("view");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const utils = trpc.useUtils();

  const { data: pinStatus, refetch: refetchPin } = trpc.transport.credits.hasPinDefined.useQuery();

  const setPinMutation = trpc.transport.credits.setConfirmPin.useMutation({
    onSuccess: () => {
      setSuccessMsg(pinStatus?.hasPinDefined ? "PIN modifié avec succès !" : "PIN défini avec succès !");
      setMode("view");
      setNewPin(""); setConfirmNewPin(""); setCurrentPin("");
      refetchPin();
      utils.transport.credits.hasPinDefined.invalidate();
      setTimeout(() => setSuccessMsg(""), 4000);
    },
  });

  const handleSavePin = () => {
    if (newPin.length < 4) return;
    if (newPin !== confirmNewPin) return;
    setPinMutation.mutate({
      pin: newPin,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <KeyRound className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">PIN de sécurité</h3>
            <p className="text-sm text-gray-500">Requis pour valider les crédits manuels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pinStatus?.hasPinDefined ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" /> PIN actif
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5" /> Non défini
            </span>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />{successMsg}
        </div>
      )}
      {setPinMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />{setPinMutation.error.message}
        </div>
      )}

      {mode === "view" && (
        <div className="flex gap-2">
          {!pinStatus?.hasPinDefined ? (
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setMode("set")}>
              <KeyRound className="h-4 w-4 mr-1.5" /> Définir un PIN
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setMode("change")}>
              <KeyRound className="h-4 w-4 mr-1.5" /> Modifier le PIN
            </Button>
          )}
        </div>
      )}

      {(mode === "set" || mode === "change") && (
        <div className="space-y-3 border-t pt-4">
          {mode === "change" && (
            <div className="space-y-1.5">
              <Label className="text-sm">PIN actuel <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type={showCurrent ? "text" : "password"} inputMode="numeric" maxLength={6}
                  placeholder="••••••" value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pr-10 font-mono tracking-widest text-center" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm">Nouveau PIN (4–6 chiffres) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input type={showNewPin ? "text" : "password"} inputMode="numeric" maxLength={6}
                placeholder="••••••" value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pr-10 font-mono tracking-widest text-center" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPin(!showNewPin)}>
                {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Confirmer le nouveau PIN <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} inputMode="numeric" maxLength={6}
                placeholder="••••••" value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pr-10 font-mono tracking-widest text-center" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPin && confirmNewPin && newPin !== confirmNewPin && (
              <p className="text-xs text-red-500">Les deux PINs ne correspondent pas.</p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setMode("view"); setNewPin(""); setConfirmNewPin(""); setCurrentPin(""); }}>Annuler</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={newPin.length < 4 || newPin !== confirmNewPin || (mode === "change" && currentPin.length < 4) || setPinMutation.isPending}
              onClick={handleSavePin}>
              {setPinMutation.isPending ? <><div className="h-3.5 w-3.5 mr-1.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Enregistrement...</> : <><Lock className="h-3.5 w-3.5 mr-1.5" />Enregistrer le PIN</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────────────────────────────
export default function CsnDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SidebarSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [validateDialog, setValidateDialog] = useState<{
    open: boolean;
    companyId: number;
    companyName: string;
    action: "active" | "rejected";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedCompanyForBilling, setSelectedCompanyForBilling] = useState<number | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [companySortBy, setCompanySortBy] = useState<'name' | 'revenue' | 'tickets'>('revenue');
  // Filtres pour la table CRUD des compagnies
  const [crudStatusFilter, setCrudStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'rejected'>('all');
  const [crudTypeFilter, setCrudTypeFilter] = useState<'all' | 'transport' | 'restauration' | 'expedition' | 'hotel' | 'boutique' | 'agence_voyage'>('all');
  const [crudSearchFilter, setCrudSearchFilter] = useState('');
  // CRUD états
  const [editDialog, setEditDialog] = useState<{ open: boolean; company: any } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; companyId: number; companyName: string } | null>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [editForm, setEditForm] = useState<{ companyName: string; managerName: string; phone: string; email: string; address: string; activityType: string; galleryImageFile?: File; galleryImagePreview?: string }>({ companyName: '', managerName: '', phone: '', email: '', address: '', activityType: '' });

  const utils = trpc.useUtils();
  const { data: stats } = trpc.transport.csn.stats.useQuery(undefined, { enabled: !!user });
  const { data: companies } = trpc.transport.csn.companies.useQuery(undefined, { enabled: !!user });
  const { data: billing } = trpc.transport.csn.billing.useQuery(undefined, { enabled: !!user });
  const { data: allCredits } = trpc.transport.csn.allCredits.useQuery(undefined, { enabled: !!user, refetchInterval: 60000 });
  const { data: creditRequests } = trpc.transport.credits.allRequests.useQuery({}, { enabled: !!user, refetchInterval: 30000 });
  const { data: trendingData } = trpc.transport.csn.trending.useQuery({ days: 30 }, { enabled: !!user });
  const { data: companiesStats } = trpc.transport.csn.companiesStats.useQuery(undefined, { enabled: !!user });

  const filteredAndSortedCompanies = useMemo(() => {
    if (!companiesStats) return [];
    let filtered = companiesStats;
    if (companyFilter !== 'all') {
      filtered = filtered.filter((c: any) => c.status === companyFilter);
    }
    return filtered.sort((a: any, b: any) => {
      if (companySortBy === 'name') return a.companyName.localeCompare(b.companyName);
      if (companySortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (companySortBy === 'tickets') return b.tickets - a.tickets;
      return 0;
    });
  }, [companiesStats, companyFilter, companySortBy]);

  const { unreadCount: csnUnreadCount } = usePushNotifications({
    role: "csn",
    title: "HUB_RESA — Nouveau message compagnie",
    sound: true,
    interval: 30_000,
  });

  const validateMutation = trpc.transport.csn.validateCompany.useMutation({
    onSuccess: () => {
      utils.transport.csn.companies.invalidate();
      utils.transport.csn.stats.invalidate();
      setValidateDialog(null);
      setRejectionReason("");
    },
  });

  const uploadGalleryImageMutation = trpc.photos.uploadGalleryImage.useMutation();
  const setGalleryImageMutation = trpc.transport.csn.setGalleryImage.useMutation();
  const updateCompanyMutation = trpc.transport.csn.updateCompany.useMutation({
    onSuccess: () => {
      utils.transport.csn.companies.invalidate();
      utils.photos.companiesForCarousel.invalidate();
      setEditDialog(null);
    },
  });
  const suspendCompanyMutation = trpc.transport.csn.suspendCompany.useMutation({
    onSuccess: () => utils.transport.csn.companies.invalidate(),
  });
  const reactivateCompanyMutation = trpc.transport.csn.reactivateCompany.useMutation({
    onSuccess: () => utils.transport.csn.companies.invalidate(),
  });
  const deleteCompanyMutation = trpc.transport.csn.deleteCompany.useMutation({
    onSuccess: () => {
      utils.transport.csn.companies.invalidate();
      utils.transport.csn.stats.invalidate();
      setDeleteDialog(null);
    },
  });

  const generateBillingMutation = trpc.transport.csn.generateBilling.useMutation({
    onSuccess: () => utils.transport.csn.billing.invalidate(),
  });

  const updateBillingMutation = trpc.transport.csn.updateBillingStatus.useMutation({
    onSuccess: () => utils.transport.csn.billing.invalidate(),
  });

  const dailyReportMutation = trpc.transport.csn.dailyReport.useMutation({
    onSuccess: () => {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 4000);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Accès réservé à l'administrateur HUB_RESA</h2>
          <Button className="mt-4" onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const pendingCompanies = companies?.filter((c) => c.status === "pending") ?? [];
  const activeCompanies = companies?.filter((c) => c.status === "active") ?? [];
  const pendingCreditRequests = (creditRequests ?? []).filter((r) => r.status === "pending").length;

  // ─── Sidebar items ──────────────────────────────────────────────────────────
  const sidebarItems: Array<{
    section: SidebarSection;
    icon: React.ElementType;
    label: string;
    badge?: number;
    group?: string;
  }> = [
    { section: "overview", icon: LayoutDashboard, label: "Vue d'ensemble", group: "principal" },
    { section: "companies", icon: Building2, label: "Compagnies", badge: pendingCompanies.length, group: "principal" },
    { section: "billing", icon: FileText, label: "Facturation", group: "principal" },
    { section: "credits-overview", icon: Coins, label: "Crédits — Suivi", group: "credits" },
    { section: "credit-requests", icon: Wallet, label: "Demandes de crédit", badge: pendingCreditRequests, group: "credits" },
    { section: "recruitment", icon: Briefcase, label: "Recrutement", group: "outils" },
    { section: "chatbot", icon: Bot, label: "Chatbot IA", group: "outils" },
    { section: "messaging", icon: MessageSquare, label: "Messagerie", badge: csnUnreadCount, group: "outils" },
    { section: "clients", icon: Users, label: "Clients", group: "outils" },
    { section: "admin-panel", icon: Shield, label: "Admins", group: "outils" },
    { section: "bdev-management", icon: Briefcase, label: "Business Dev", group: "outils" },
  ];

  const groups = [
    { key: "principal", label: "Principal" },
    { key: "credits", label: "Crédits HUB_RESA" },
    { key: "outils", label: "Outils" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ─── Top Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b shadow-sm z-10 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
              <Truck className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Dashboard HUB_RESA</h1>
              <p className="text-[11px] text-gray-500">Centre de Supervision National — HUB_RESA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
            <Badge className="bg-orange-100 text-orange-800 hidden sm:flex">Admin CSN</Badge>
            <Button
              onClick={() => navigate("/admin-general")}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">CONFIGURATION</span>
            </Button>
            <AdminLogoutButton navigate={navigate} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={`bg-white border-r flex-shrink-0 flex flex-col transition-all duration-200 ${
            sidebarCollapsed ? "w-14" : "w-56"
          }`}
        >
          {/* Toggle */}
          <div className="flex items-center justify-end p-2 border-b">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title={sidebarCollapsed ? "Agrandir" : "Réduire"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav items grouped */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-4">
            {groups.map((group) => {
              const items = sidebarItems.filter((i) => i.group === group.key);
              return (
                <div key={group.key}>
                  {!sidebarCollapsed && (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <SidebarItem
                        key={item.section}
                        icon={item.icon}
                        label={item.label}
                        section={item.section}
                        active={activeSection === item.section}
                        badge={item.badge}
                        collapsed={sidebarCollapsed}
                        onClick={setActiveSection}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom: rapport journalier */}
          {!sidebarCollapsed && (
            <div className="p-2 border-t">
              <button
                onClick={() => dailyReportMutation.mutate()}
                disabled={dailyReportMutation.isPending || reportSent}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  reportSent
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 flex-shrink-0 ${dailyReportMutation.isPending ? "animate-spin" : ""}`} />
                {reportSent ? "Rapport envoyé ✓" : dailyReportMutation.isPending ? "Envoi..." : "Rapport journalier"}
              </button>
            </div>
          )}
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── VUE D'ENSEMBLE ─────────────────────────────────────────────── */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Compagnies totales", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-blue-600" },
                  { label: "Compagnies actives", value: stats?.activeCompanies ?? 0, icon: CheckCircle, color: "text-green-600" },
                  { label: "En attente", value: stats?.pendingCompanies ?? 0, icon: Clock, color: "text-amber-600" },
                  { label: "Billets aujourd'hui", value: stats?.ticketsToday ?? 0, icon: CreditCard, color: "text-purple-600" },
                  { label: "Expéditions aujourd'hui", value: stats?.shipmentsToday ?? 0, icon: Truck, color: "text-indigo-600" },
                  { label: "Commandes aujourd'hui", value: stats?.ordersToday ?? 0, icon: ShoppingCart, color: "text-pink-600" },
                  { label: "Revenu commandes", value: `${(stats?.orderRevenueToday ?? 0).toLocaleString()} XOF`, icon: Coins, color: "text-yellow-600" },
                  { label: "Facturation en attente", value: `${(stats?.pendingBillingXOF ?? 0).toLocaleString()} XOF`, icon: TrendingUp, color: "text-orange-600" },
                ].map((s) => (
                  <Card key={s.label} className="shadow-sm">
                    <CardContent className="p-4">
                      <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alertes rapides */}
              {(pendingCompanies.length > 0 || pendingCreditRequests > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingCompanies.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveSection("companies")}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-amber-500" />
                        <div>
                          <p className="font-semibold text-amber-800">{pendingCompanies.length} compagnie(s) en attente</p>
                          <p className="text-xs text-amber-600">Cliquez pour valider</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {pendingCreditRequests > 0 && (
                    <Card className="border-blue-200 bg-blue-50/50 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveSection("credit-requests")}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-semibold text-blue-800">{pendingCreditRequests} demande(s) de crédit</p>
                          <p className="text-xs text-blue-600">Cliquez pour traiter</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Graphique de tendances */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendances — Billets/jour (30 jours)</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendingData && trendingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="tickets" stroke="#E8751A" name="Billets" strokeWidth={2} />
                        <Line type="monotone" dataKey="revenue" stroke="#F59E0B" name="Revenu (XOF)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">Aucune données disponible</div>
                  )}
                </CardContent>
              </Card>

              {/* Tableau détaillé des compagnies */}
              <Card>
                <CardHeader>
                  <CardTitle>Compagnies — Statistiques détaillées</CardTitle>
                  <div className="flex gap-2 mt-4">
                    <Select value={companyFilter} onValueChange={(v: any) => setCompanyFilter(v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={companySortBy} onValueChange={(v: any) => setCompanySortBy(v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">CA (décroissant)</SelectItem>
                        <SelectItem value="tickets">Billets (décroissant)</SelectItem>
                        <SelectItem value="name">Nom (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Compagnie</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Billets</TableHead>
                          <TableHead className="text-right">Expéditions</TableHead>
                          <TableHead className="text-right">CA (XOF)</TableHead>
                          <TableHead className="text-right">Taux activité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedCompanies && filteredAndSortedCompanies.length > 0 ? (
                          filteredAndSortedCompanies.map((company: any) => (
                            <TableRow key={company.id}>
                              <TableCell className="font-medium">{company.companyName}</TableCell>
                              <TableCell>
                                <Badge className={company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                  {company.status === 'active' ? 'Actif' : 'En attente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{company.tickets}</TableCell>
                              <TableCell className="text-right">{company.shipments}</TableCell>
                              <TableCell className="text-right font-semibold">{company.totalRevenue.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{company.activityRate}%</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">Aucune compagnie</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── COMPAGNIES ─────────────────────────────────────────────────── */}
          {activeSection === "companies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Gestion des Compagnies</h2>
                <Button
                  onClick={() => setShowAddCompany(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Ajouter une Compagnie
                </Button>
              </div>
              {pendingCompanies.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                      <Clock className="h-4 w-4" />
                      Demandes en attente ({pendingCompanies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingCompanies.map((c) => (
                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-amber-200">
                          <div>
                            <p className="font-semibold text-gray-900">{c.companyName}</p>
                            <p className="text-sm text-gray-500">
                              {c.managerName && `Dir: ${c.managerName} · `}
                              {c.phone && `${c.phone} · `}
                              {c.email}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Inscrit le {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setValidateDialog({ open: true, companyId: c.id, companyName: c.companyName, action: "active" })}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Valider
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => setValidateDialog({ open: true, companyId: c.id, companyName: c.companyName, action: "rejected" })}>
                              <XCircle className="h-4 w-4 mr-1" /> Refuser
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Toutes les compagnies ({(
                        (companies ?? []).filter((c) => {
                          const matchStatus = crudStatusFilter === 'all' || c.status === crudStatusFilter;
                          const matchType = crudTypeFilter === 'all' || (c as any).activityType === crudTypeFilter || (!((c as any).activityType) && crudTypeFilter === 'transport');
                          const matchSearch = !crudSearchFilter || c.companyName.toLowerCase().includes(crudSearchFilter.toLowerCase()) || (c.managerName ?? '').toLowerCase().includes(crudSearchFilter.toLowerCase());
                          return matchStatus && matchType && matchSearch;
                        })
                      ).length} / {companies?.length ?? 0})
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Input
                      placeholder="Rechercher compagnie ou directeur..."
                      value={crudSearchFilter}
                      onChange={(e) => setCrudSearchFilter(e.target.value)}
                      className="h-8 text-xs w-52"
                    />
                    <Select value={crudStatusFilter} onValueChange={(v: any) => setCrudStatusFilter(v)}>
                      <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="suspended">Suspendu</SelectItem>
                        <SelectItem value="rejected">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={crudTypeFilter} onValueChange={(v: any) => setCrudTypeFilter(v)}>
                      <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Type d'activité" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="transport">Transport (Bus)</SelectItem>
                        <SelectItem value="restauration">Restauration</SelectItem>
                        <SelectItem value="expedition">Expédition</SelectItem>
                        <SelectItem value="hotel">Hôtellerie</SelectItem>
                        <SelectItem value="boutique">Boutique</SelectItem>
                        <SelectItem value="agence_voyage">Agence de Voyage</SelectItem>
                      </SelectContent>
                    </Select>
                    {(crudStatusFilter !== 'all' || crudTypeFilter !== 'all' || crudSearchFilter) && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setCrudStatusFilter('all'); setCrudTypeFilter('all'); setCrudSearchFilter(''); }}>Réinitialiser</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-3 font-medium">Compagnie</th>
                          <th className="pb-2 pr-3 font-medium">Directeur</th>
                          <th className="pb-2 pr-3 font-medium">Contact</th>
                          <th className="pb-2 pr-3 font-medium">Type</th>
                          <th className="pb-2 pr-3 font-medium">Statut</th>
                          <th className="pb-2 pr-3 font-medium">Date</th>
                          <th className="pb-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(companies ?? []).filter((c) => {
                          const matchStatus = crudStatusFilter === 'all' || c.status === crudStatusFilter;
                          const matchType = crudTypeFilter === 'all' || (c as any).activityType === crudTypeFilter || (!((c as any).activityType) && crudTypeFilter === 'transport');
                          const matchSearch = !crudSearchFilter || c.companyName.toLowerCase().includes(crudSearchFilter.toLowerCase()) || (c.managerName ?? '').toLowerCase().includes(crudSearchFilter.toLowerCase());
                          return matchStatus && matchType && matchSearch;
                        }).map((c) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 pr-3 font-medium text-gray-900">{c.companyName}</td>
                            <td className="py-3 pr-3 text-gray-600">{c.managerName ?? "—"}</td>
                            <td className="py-3 pr-3 text-gray-600">{c.phone ?? c.email ?? "—"}</td>
                            <td className="py-3 pr-3">
                              <Badge variant="outline" className="text-xs capitalize">
                                {(c as any).activityType?.replace('_', ' ') ?? 'transport'}
                              </Badge>
                            </td>
                            <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                            <td className="py-3 pr-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {c.status === 'pending' && (
                                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-2"
                                    onClick={() => setValidateDialog({ open: true, companyId: c.id, companyName: c.companyName, action: 'active' })}>
                                    <CheckCircle className="h-3 w-3 mr-1" /> Valider
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                                  onClick={() => {
                                    setEditForm({ companyName: c.companyName, managerName: c.managerName ?? '', phone: c.phone ?? '', email: c.email ?? '', address: (c as any).address ?? '', activityType: (c as any).activityType ?? 'transport', galleryImageFile: undefined, galleryImagePreview: undefined });
                                    setEditDialog({ open: true, company: c });
                                  }}>
                                  Modifier
                                </Button>
                                {c.status === 'active' ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                                    disabled={suspendCompanyMutation.isPending}
                                    onClick={() => suspendCompanyMutation.mutate({ companyId: c.id })}>
                                    Suspendre
                                  </Button>
                                ) : c.status === 'suspended' ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                                    disabled={reactivateCompanyMutation.isPending}
                                    onClick={() => reactivateCompanyMutation.mutate({ companyId: c.id })}>
                                    Réactiver
                                  </Button>
                                ) : null}
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteDialog({ open: true, companyId: c.id, companyName: c.companyName })}>
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(companies ?? []).length === 0 && (
                      <p className="text-center text-gray-400 py-8">Aucune compagnie inscrite</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── FACTURATION ────────────────────────────────────────────────── */}
          {activeSection === "billing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Facturation</h2>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Générer la facturation mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Label>Période (AAAA-MM)</Label>
                      <Input type="month" value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} className="max-w-xs" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label>Compagnie</Label>
                      <Select value={selectedCompanyForBilling ? String(selectedCompanyForBilling) : ""} onValueChange={(v) => setSelectedCompanyForBilling(parseInt(v))}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner une compagnie" /></SelectTrigger>
                        <SelectContent>
                          {activeCompanies.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={!selectedCompanyForBilling || generateBillingMutation.isPending}
                        onClick={() => { if (selectedCompanyForBilling) generateBillingMutation.mutate({ companyId: selectedCompanyForBilling, period: billingPeriod }); }}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Générer
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tarifs : 200 FCFA/billet vendu · 100 FCFA/expédition encaissée</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Historique de facturation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-3 font-medium">Compagnie</th>
                          <th className="pb-2 pr-3 font-medium">Période</th>
                          <th className="pb-2 pr-3 font-medium text-right">Billets</th>
                          <th className="pb-2 pr-3 font-medium text-right">Expéd.</th>
                          <th className="pb-2 pr-3 font-medium text-right">Total FCFA</th>
                          <th className="pb-2 pr-3 font-medium">Statut</th>
                          <th className="pb-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(billing ?? []).map((b) => (
                          <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 pr-3 font-medium">{b.companyName}</td>
                            <td className="py-3 pr-3 text-gray-600">{b.billingPeriod}</td>
                            <td className="py-3 pr-3 text-right">{b.ticketsSold}</td>
                            <td className="py-3 pr-3 text-right">{b.shipmentsCashed}</td>
                            <td className="py-3 pr-3 text-right font-semibold">{Number(b.totalFeeXOF).toLocaleString()}</td>
                            <td className="py-3 pr-3"><BillingStatusBadge status={b.status ?? "en_attente"} /></td>
                            <td className="py-3">
                              <Select value={b.status ?? "en_attente"} onValueChange={(v) => updateBillingMutation.mutate({ billingId: b.id, status: v as "en_attente" | "facture" | "paye" })}>
                                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en_attente">En attente</SelectItem>
                                  <SelectItem value="facture">Facturé</SelectItem>
                                  <SelectItem value="paye">Payé</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(billing ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucune facturation générée</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── CRÉDITS SUIVI ──────────────────────────────────────────────── */}
          {activeSection === "credits-overview" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Suivi des Crédits par Compagnie</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="pt-4">
                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Compagnies actives</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">{(allCredits ?? []).filter((c) => c.status === "active").length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="pt-4">
                    <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Solde zéro</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{(allCredits ?? []).filter((c) => c.balance <= 0).length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Solde critique (&lt;5)</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{(allCredits ?? []).filter((c) => c.balance > 0 && c.balance < 5).length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">CA total encaissé</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{(allCredits ?? []).reduce((sum, c) => sum + (c.totalRevenue ?? 0), 0).toLocaleString()} FCFA</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="w-4 h-4 text-orange-500" />
                    Suivi des crédits par compagnie
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Compagnie</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Solde</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Achetés</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Dépensés</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">CA encaissé</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Dernière activité</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(allCredits ?? []).map((c) => (
                          <tr key={c.id} className={`hover:bg-gray-50 ${c.balance <= 0 ? "bg-red-50" : c.balance < 5 ? "bg-amber-50" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{c.companyName}</div>
                              <div className="text-xs text-gray-400">{c.email ?? ""}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs capitalize">{c.activityType ?? "transport"}</Badge>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={c.status ?? "pending"} /></td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-bold text-base ${c.balance <= 0 ? "text-red-600" : c.balance < 5 ? "text-amber-600" : "text-green-600"}`}>
                                {c.balance}
                              </span>
                              {c.balance < 5 && <span className="ml-1 text-xs">{c.balance <= 0 ? "🔴" : "⚠️"}</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">{c.totalBought ?? 0}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{c.totalSpent ?? 0}</td>
                            <td className="px-4 py-3 text-right font-medium text-green-700">
                              {(c.totalRevenue ?? 0).toLocaleString()} {c.currency}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("fr-FR") : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setActiveSection("credit-requests")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                                title={`Créditer ${c.companyName}`}
                              >
                                <Coins className="h-3 w-3" />
                                Créditer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(allCredits ?? []).length === 0 && <p className="text-center text-gray-400 py-8">Aucune donnée de crédits disponible</p>}
                  </div>
                </CardContent>
              </Card>
              {/* Historique détaillé des transactions par compagnie */}
              <CreditsTransactionHistory allCredits={allCredits ?? []} />
            </div>
          )}

          {/* ── DEMANDES DE CRÉDIT ─────────────────────────────────────────── */}
          {activeSection === "credit-requests" && <CreditRequestsPanel />}

          {/* ── RECRUTEMENT ────────────────────────────────────────────────── */}
          {activeSection === "recruitment" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recrutement</h2>
              <RecruitmentMonitor />
            </div>
          )}

          {/* ── CHATBOT ────────────────────────────────────────────────────── */}
          {activeSection === "chatbot" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Chatbot IA</h2>
              <CsnChatbotPanel />
            </div>
          )}

          {/* ── MESSAGERIE ─────────────────────────────────────────────────── */}
          {activeSection === "messaging" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Messagerie</h2>
              <CsnMessaging />
            </div>
          )}
          {/* ── ADMINS ─────────────────────────────────────────────────────────────────────── */}
          {activeSection === "clients" && (
            <div>
              <ClientsManagement />
            </div>
          )}
          {activeSection === "admin-panel" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Gestion des Admins</h2>
              <AdminPanel />
              {/* ── PIN de sécurité pour les crédits manuels ── */}
              <PinSetupCard />
            </div>
          )}
          {activeSection === "bdev-management" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Gestion des Business Développeurs</h2>
              <BDevManagementPanel />
            </div>
          )}
        </main>
      </div>

      {/* ─── Dialog Modifier Compagnie ─────────────────────────────────────── */}
      {editDialog && (
        <Dialog open={editDialog.open} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier la compagnie</DialogTitle>
              <DialogDescription>Modifier les informations de <strong>{editDialog.company.companyName}</strong></DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nom de la compagnie</Label>
                <Input value={editForm.companyName} onChange={(e) => setEditForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Directeur</Label>
                  <Input value={editForm.managerName} onChange={(e) => setEditForm(f => ({ ...f, managerName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Téléphone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Image pour la galerie publique</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 transition-colors" onClick={() => document.getElementById('gallery-image-input')?.click()}>
                  {editForm.galleryImagePreview ? (
                    <div className="space-y-2">
                      <img src={editForm.galleryImagePreview} alt="Aperçu" className="w-full h-32 object-cover rounded" />
                      <p className="text-xs text-gray-500">Cliquez pour changer l'image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Cliquez ou déposez une image</p>
                      <p className="text-xs text-gray-500">PNG, JPG ou WebP (max 5MB)</p>
                    </div>
                  )}
                </div>
                <input
                  id="gallery-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setEditForm(f => ({
                          ...f,
                          galleryImageFile: file,
                          galleryImagePreview: event.target?.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type d'activité</Label>
                <Select value={editForm.activityType} onValueChange={(v) => setEditForm(f => ({ ...f, activityType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transport terrestre (Bus)</SelectItem>
                    <SelectItem value="restauration">Restauration</SelectItem>
                    <SelectItem value="expedition">Expédition / Colis</SelectItem>
                    <SelectItem value="hotel">Hôtellerie</SelectItem>
                    <SelectItem value="boutique">Boutique / Commerce</SelectItem>
                    <SelectItem value="agence_voyage">Agence de Voyage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>Annuler</Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={updateCompanyMutation.isPending || !editForm.companyName.trim()}
                onClick={async () => {
                  if (editForm.galleryImageFile) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      const mimeType = editForm.galleryImageFile!.type;
                      try {
                        const result = await uploadGalleryImageMutation.mutateAsync({
                          base64,
                          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                        });
                        // Sauvegarder l'URL de l'image en base de données
                        if (result?.url) {
                          await setGalleryImageMutation.mutateAsync({
                            companyId: editDialog.company.id,
                            galleryImageUrl: result.url,
                          });
                        }
                        updateCompanyMutation.mutate({
                          companyId: editDialog.company.id,
                          companyName: editForm.companyName,
                          managerName: editForm.managerName || undefined,
                          phone: editForm.phone || undefined,
                          email: editForm.email || undefined,
                          address: editForm.address || undefined,
                          activityType: editForm.activityType as any,
                        });
                      } catch (error) {
                        console.error('Erreur upload image:', error);
                      }
                    };
                    reader.readAsDataURL(editForm.galleryImageFile);
                  } else {
                    updateCompanyMutation.mutate({
                      companyId: editDialog.company.id,
                      companyName: editForm.companyName,
                      managerName: editForm.managerName || undefined,
                      phone: editForm.phone || undefined,
                      email: editForm.email || undefined,
                      address: editForm.address || undefined,
                      activityType: editForm.activityType as any,
                    });
                  }
                }}
              >
                {updateCompanyMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Dialog Supprimer Compagnie ───────────────────────────────────────── */}
      {deleteDialog && (
        <Dialog open={deleteDialog.open} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Supprimer la compagnie</DialogTitle>
              <DialogDescription>
                ⚠️ Cette action est <strong>irréversible</strong>. Toutes les données de <strong>{deleteDialog.companyName}</strong> seront supprimées définitivement.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>Annuler</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteCompanyMutation.isPending}
                onClick={() => deleteCompanyMutation.mutate({ companyId: deleteDialog.companyId })}
              >
                {deleteCompanyMutation.isPending ? 'Suppression...' : 'Confirmer la suppression'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Dialog Validation Compagnie ──────────────────────────────────── */}
      {validateDialog && (
        <Dialog open={validateDialog.open} onOpenChange={() => setValidateDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {validateDialog.action === "active" ? "Valider la compagnie" : "Refuser la demande"}
              </DialogTitle>
              <DialogDescription>
                {validateDialog.action === "active"
                  ? `Confirmer la validation du compte de "${validateDialog.companyName}" ?`
                  : `Refuser la demande de "${validateDialog.companyName}" ?`}
              </DialogDescription>
            </DialogHeader>
            {validateDialog.action === "rejected" && (
              <div className="space-y-1.5">
                <Label>Motif du refus</Label>
                <Textarea placeholder="Expliquez la raison du refus..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setValidateDialog(null)}>Annuler</Button>
              <Button
                className={validateDialog.action === "active" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                disabled={validateMutation.isPending}
                onClick={() => validateMutation.mutate({ companyId: validateDialog.companyId, action: validateDialog.action, rejectionReason: rejectionReason || undefined })}
              >
                {validateDialog.action === "active" ? "Confirmer la validation" : "Confirmer le refus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Modal Ajouter Compagnie ──────────────────────────────────────────── */}
      {showAddCompany && (
        <AddCompanyModal
          open={showAddCompany}
          onOpenChange={setShowAddCompany}
        />
      )}
    </div>
  );
}
