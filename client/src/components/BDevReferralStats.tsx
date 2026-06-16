/**
 * BDevReferralStats.tsx — Statistiques des parrainages réussis
 * Affiche les KPIs des compagnies recrutées par le BDev
 */
import { TrendingUp, Building2, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReferralStatsProps {
  stats?: {
    totalReferred: number;
    activeCompanies: number;
    pendingCompanies: number;
    rejectedCompanies: number;
    totalActiveRevenue: number;
    totalActiveCredits: number;
    commissionFromReferrals: number;
    commissionRate: number;
    companies: Array<{
      id: number;
      companyName: string;
      activityType: string;
      status: string;
      createdAt: string;
    }>;
  };
  isLoading?: boolean;
}

function formatXOF(amount: number) {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    transport: "Transport",
    hotel: "Hôtel",
    boutique: "Boutique",
    restaurant: "Restaurant",
    agence_voyage: "Agence de Voyage",
  };
  return labels[type] || type;
}

function getStatusBadge(status: string) {
  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    active: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    pending: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      icon: <Clock className="w-3 h-3" />,
    },
    rejected: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const config = configs[status] || configs.pending;
  const labels: Record<string, string> = {
    active: "Actif",
    pending: "En attente",
    rejected: "Rejeté",
  };
  return (
    <Badge className={`${config.bg} ${config.text} border-0 text-xs flex items-center gap-1`}>
      {config.icon}
      {labels[status] || status}
    </Badge>
  );
}

export function BDevReferralStats({ stats, isLoading }: ReferralStatsProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Statistiques des Parrainages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-sm">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="bg-slate-800/60 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          Statistiques des Parrainages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <p className="text-slate-400 text-xs">Total parrainé</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalReferred}</p>
            <p className="text-slate-500 text-xs mt-1">compagnies</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-slate-400 text-xs">Actives</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.activeCompanies}</p>
            <p className="text-slate-500 text-xs mt-1">
              {stats.totalReferred > 0 ? Math.round((stats.activeCompanies / stats.totalReferred) * 100) : 0}%
            </p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <p className="text-slate-400 text-xs">En attente</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingCompanies}</p>
            <p className="text-slate-500 text-xs mt-1">
              {stats.totalReferred > 0 ? Math.round((stats.pendingCompanies / stats.totalReferred) * 100) : 0}%
            </p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-slate-400 text-xs">Rejetées</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejectedCompanies}</p>
            <p className="text-slate-500 text-xs mt-1">
              {stats.totalReferred > 0 ? Math.round((stats.rejectedCompanies / stats.totalReferred) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Revenus et commissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <p className="text-slate-400 text-xs uppercase tracking-wider">CA des compagnies actives</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{formatXOF(stats.totalActiveRevenue)}</p>
            <p className="text-slate-500 text-xs mt-1">
              {stats.activeCompanies} compagnie{stats.activeCompanies > 1 ? "s" : ""} active{stats.activeCompanies > 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-slate-400 text-xs uppercase tracking-wider">Commission générée</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatXOF(stats.commissionFromReferrals)}</p>
            <p className="text-slate-500 text-xs mt-1">
              À {stats.commissionRate}% du CA des compagnies actives
            </p>
          </div>
        </div>

        {/* Liste des compagnies */}
        {stats.companies.length > 0 && (
          <div className="bg-slate-700/20 rounded-lg p-4">
            <p className="text-white font-semibold text-sm mb-3">Compagnies recrutées</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{company.companyName}</p>
                    <p className="text-slate-400 text-xs">
                      {getActivityLabel(company.activityType)} • {new Date(company.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">{getStatusBadge(company.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.companies.length === 0 && (
          <div className="bg-slate-700/20 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm">Aucune compagnie recrutée pour cette période</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
