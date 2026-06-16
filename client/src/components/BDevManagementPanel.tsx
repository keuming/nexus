/**
 * BDevManagementPanel.tsx — Dashboard admin pour la gestion des Business Développeurs
 * Affiche : liste des BDevs, compagnies recrutées par BDev, CA, crédits par mois
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useState as _useState } from "react";
import {
  Briefcase, Building2, TrendingUp, CreditCard, Users,
  ChevronDown, ChevronRight, Search, CheckCircle, XCircle,
  Clock, Eye, BarChart3, RefreshCw, Percent, Wallet, Edit2, Check, X,
} from "lucide-react";

const ACTIVITY_LABELS: Record<string, string> = {
  transport: "Transport",
  hotel: "Hôtel",
  boutique: "Boutique",
  restaurant: "Restaurant",
  agence_voyage: "Agence de Voyage",
  restauration: "Restauration",
  expedition: "Expédition",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-gray-100 text-gray-800 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
  rejected: "Rejeté",
};

function formatXOF(amount: number) {
  return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

export default function BDevManagementPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBDev, setExpandedBDev] = useState<number | null>(null);
  const [_activeTab, _setActiveTab] = useState<"list" | "stats">("list");
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState<string>("5");

  const listQuery = trpc.businessDev.admin.list.useQuery();
  const globalStatsQuery = trpc.businessDev.admin.getGlobalStats.useQuery();

  const updateStatus = trpc.businessDev.admin.updateStatus.useMutation({
    onSuccess: () => listQuery.refetch(),
  });

  const updateCommissionRate = trpc.businessDev.admin.updateCommissionRate.useMutation({
    onSuccess: () => {
      listQuery.refetch();
      setEditingCommission(null);
    },
  });

  const bdevs = listQuery.data ?? [];
  const globalStats = globalStatsQuery.data;
  // totalCommissions à verser = somme de toutes les commissions individuelles
  const totalCommissions = bdevs.reduce((s, b) => s + (b.totalCommission ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-gray-500 text-xs">Total BDevs</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{globalStats?.totalBdevs ?? 0}</p>
            <p className="text-xs text-green-600 mt-1">{globalStats?.activeBdevs ?? 0} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-gray-500 text-xs">Compagnies recrutées</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{globalStats?.companiesRecruited ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-gray-500 text-xs">Crédits commandés</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{bdevs.reduce((s, b) => s + (b.totalCredits ?? 0), 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-gray-500 text-xs">CA total généré</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatXOF(globalStats?.totalRevenue ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Total commissions à verser */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-green-700 text-xs uppercase tracking-wider font-semibold">Total commissions à verser aux BDevs</p>
                <p className="text-3xl font-black text-green-800">{formatXOF(totalCommissions)}</p>
                <p className="text-green-600 text-xs mt-0.5">Calculé sur la base des taux individuels de chaque Business Développeur</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">Taux moyen : {bdevs.length > 0 ? (bdevs.reduce((s, b) => s + Number(b.commissionRate ?? 5), 0) / bdevs.length).toFixed(1) : 5}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" />
            Liste des Business Développeurs
            <Badge className="ml-auto bg-orange-100 text-orange-700 border-0">{bdevs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, ID..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : bdevs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun Business Développeur trouvé.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bdevs.map((bdev) => (
                <div key={bdev.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* En-tête BDev */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedBDev(expandedBDev === bdev.id ? null : bdev.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-sm">
                        {bdev.firstName[0]}{bdev.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">
                          {bdev.firstName} {bdev.lastName}
                        </p>
                        <span className="text-orange-500 font-mono text-xs bg-orange-50 px-2 py-0.5 rounded">
                          {bdev.bdId}
                        </span>
                        <Badge className={`text-xs border ${STATUS_COLORS[bdev.status] ?? ""}`}>
                          {STATUS_LABELS[bdev.status] ?? bdev.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span>{bdev.email}</span>
                        <span>•</span>
                        <span>{bdev.countryCode}{bdev.loginPhone}</span>
                        {bdev.lastLoginAt && (
                          <>
                            <span>•</span>
                            <span>Dernière connexion : {new Date(bdev.lastLoginAt).toLocaleDateString("fr-FR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                      <div>
                        <p className="text-xs text-gray-500">Compagnies</p>
                        <p className="font-bold text-gray-900">{bdev.companiesCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CA total</p>
                        <p className="font-bold text-green-600 text-sm">{formatXOF(bdev.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Commission</p>
                        <p className="font-bold text-emerald-600 text-sm">{formatXOF(bdev.totalCommission ?? 0)}</p>
                      </div>
                      <div className="min-w-[80px]">
                        <p className="text-xs text-gray-500 mb-0.5">Taux</p>
                        {editingCommission === bdev.bdId ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              min="0" max="100" step="0.5"
                              value={commissionInput}
                              onChange={(e) => setCommissionInput(e.target.value)}
                              className="w-14 text-xs border border-gray-300 rounded px-1 py-0.5 text-center"
                            />
                            <span className="text-xs text-gray-500">%</span>
                            <button
                              onClick={() => updateCommissionRate.mutate({ bdId: bdev.bdId, commissionRate: parseFloat(commissionInput) })}
                              className="p-0.5 text-green-600 hover:text-green-800"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingCommission(null)}
                              className="p-0.5 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="font-bold text-orange-600">{Number(bdev.commissionRate ?? 5).toFixed(1)}%</span>
                            <button
                              onClick={() => {
                                setEditingCommission(bdev.bdId);
                                setCommissionInput(String(Number(bdev.commissionRate ?? 5)));
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Crédits</p>
                        <p className="font-bold text-purple-600">{bdev.totalCredits}</p>
                      </div>
                      {expandedBDev === bdev.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Actions de statut */}
                  <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-2 bg-gray-50/50">
                    <span className="text-xs text-gray-500 mr-2">Actions :</span>
                    {(bdev.status as string) !== "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => updateStatus.mutate({ bdId: bdev.bdId, status: "active" })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activer
                      </Button>
                    )}
                    {(bdev.status as string) !== "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => updateStatus.mutate({ bdId: bdev.bdId, status: "suspended" })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Suspendre
                      </Button>
                    )}
                    {(bdev.status as string) !== "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                        onClick={() => updateStatus.mutate({ bdId: bdev.bdId, status: "pending" })}
                        disabled={updateStatus.isPending}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Mettre en attente
                      </Button>
                    )}
                    <span className="ml-auto text-xs text-gray-400">
                      Inscrit le {new Date(bdev.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* Détail des compagnies (expandable) */}
                  {expandedBDev === bdev.id && bdev.companies && bdev.companies.length > 0 && (
                    <div className="border-t border-gray-200">
                      <div className="p-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          Compagnies recrutées ({bdev.companies.length})
                        </p>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-white">
                                <TableHead className="text-xs">Compagnie</TableHead>
                                <TableHead className="text-xs">Type</TableHead>
                                <TableHead className="text-xs">Statut</TableHead>
                                <TableHead className="text-xs">Date recrutement</TableHead>
                                <TableHead className="text-xs text-right">Crédits commandés</TableHead>
                                <TableHead className="text-xs text-right">CA généré</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bdev.companies.map((company) => (
                                <TableRow key={company.id} className="bg-white hover:bg-gray-50">
                                  <TableCell className="text-xs font-medium">{company.companyName}</TableCell>
                                  <TableCell className="text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      {ACTIVITY_LABELS[company.activityType] ?? company.activityType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`text-xs border ${STATUS_COLORS[company.status] ?? ""}`}>
                                      {STATUS_LABELS[company.status] ?? company.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {new Date(company.createdAt).toLocaleDateString("fr-FR")}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-semibold text-purple-600">
                                    —
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-semibold text-green-600">
                                    —
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                  {expandedBDev === bdev.id && (!bdev.companies || bdev.companies.length === 0) && (
                    <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-400 bg-gray-50">
                      Ce BDev n'a pas encore recruté de compagnies.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
