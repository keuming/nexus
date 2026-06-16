/**
 * BDevDashboard.tsx — Dashboard Business Développeur
 * Route : /bdev/dashboard
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, Building2, TrendingUp, CreditCard, LogOut,
  Calendar, ChevronRight, BarChart3, Users, RefreshCw, Percent, Wallet, FileText, Download
} from "lucide-react";
import { getBdevToken, clearBdevToken } from "./BDevLogin";
import { BDevBadgeGenerator } from "@/components/BDevBadgeGenerator";
import { BDevReferralLink } from "@/components/BDevReferralLink";
import { BDevReferralStats } from "@/components/BDevReferralStats";

const ACTIVITY_LABELS: Record<string, string> = {
  transport: "Transport",
  hotel: "Hôtel",
  boutique: "Boutique",
  restaurant: "Restaurant",
  agence_voyage: "Agence de Voyage",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  rejected: "bg-slate-500/20 text-slate-400 border-slate-500/30",
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

export default function BDevDashboard() {
  const [, navigate] = useLocation();
  const token = getBdevToken();
  const [period, setPeriod] = useState("month");
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (!token) navigate("/bdev/login");
  }, [token, navigate]);

  const profileQuery = trpc.businessDev.getProfile.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const companiesQuery = trpc.businessDev.getMyCompanies.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  // Calculer startDate selon la période sélectionnée
  const getStartDate = () => {
    const now = new Date();
    if (period === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), q * 3, 1).toISOString();
    } else if (period === "year") {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    return undefined;
  };

  const statsQuery = trpc.businessDev.getMyStats.useQuery(
    {
      token: token!,
      startDate: getStartDate(),
    },
    { enabled: !!token }
  );

  const referralStatsQuery = trpc.businessDev.getReferralStats.useQuery(
    {
      token: token!,
      startDate: getStartDate(),
    },
    { enabled: !!token }
  );

  const handleLogout = () => {
    clearBdevToken();
    navigate("/bdev/login");
  };

  if (!token) return null;

  const profile = profileQuery.data;
  const companies = companiesQuery.data ?? [];
  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">
                {profile ? `${profile.firstName} ${profile.lastName}` : "BDev Dashboard"}
              </p>
              {profile && (
                <p className="text-orange-400 text-xs font-mono mt-0.5">{profile.bdId}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <Badge className={`text-xs ${profile.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                {profile.status === "active" ? "Actif" : "En attente de validation"}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alerte si compte en attente */}
        {profile?.status === "pending" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-400 font-medium text-sm">Compte en attente de validation</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Votre compte est en cours de validation par l'administration HUB_RESA. Vous pourrez recruter des compagnies une fois votre compte activé.
              </p>
            </div>
          </div>
        )}

        {/* Votre ID BDev */}
        {profile && (
          <Card className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border-orange-500/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Votre identifiant BDev</p>
                  <p className="text-4xl font-black text-orange-400 tracking-widest font-mono">{profile.bdId}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Communiquez cet ID aux compagnies lors de leur inscription pour être crédité du recrutement.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Membre depuis</p>
                  <p className="text-white text-sm font-medium">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sélecteur de période */}
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-orange-400" />
          <p className="text-white font-medium">Statistiques</p>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="month" className="text-white hover:bg-slate-700">Ce mois</SelectItem>
              <SelectItem value="quarter" className="text-white hover:bg-slate-700">Ce trimestre</SelectItem>
              <SelectItem value="year" className="text-white hover:bg-slate-700">Cette année</SelectItem>
              <SelectItem value="all" className="text-white hover:bg-slate-700">Tout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-slate-400 text-xs">Compagnies recrutées</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats?.companiesCount ?? companies.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-slate-400 text-xs">Compagnies actives</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {companies.filter((c) => c.status === "active").length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-slate-400 text-xs">Crédits commandés</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats?.totalCredits ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-slate-400 text-xs">Chiffre d'affaires</p>
              </div>
              <p className="text-xl font-bold text-white">{formatXOF(stats?.totalRevenue ?? 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission BDev */}
        {stats && (
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Commission à percevoir</p>
                    <p className="text-3xl font-black text-green-400">{formatXOF(stats.totalCommission ?? 0)}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Taux : <span className="text-green-400 font-semibold">{stats.commissionRate ?? 5}%</span> sur le CA des compagnies recrutées
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-400 text-xs">Taux de commission</p>
                  </div>
                  <p className="text-4xl font-black text-green-400">{stats.commissionRate ?? 5}%</p>
                  <p className="text-slate-500 text-xs mt-1">Défini par l'administration HUB_RESA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badge Business Developer Personnalisé */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-400" />
              Votre Badge BDev Personnalisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile && <BDevBadgeGenerator bdevId={profile.bdId} bdevName={`${profile.firstName} ${profile.lastName}`} bdevPhone={profile.loginPhone} />}
          </CardContent>
        </Card>

        {/* Statistiques des Parrainages */}
        <BDevReferralStats stats={referralStatsQuery.data} isLoading={referralStatsQuery.isLoading} />

        {/* Lien de Parrainage */}
        {profile && <BDevReferralLink bdevId={profile.bdId} />}

        {/* Conditions Générales */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Conditions Générales & Tarification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Système de Crédits</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Valeur d'un crédit</p>
                    <p className="text-orange-400 font-bold">125 FCFA</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Montant minimum</p>
                    <p className="text-orange-400 font-bold">10 000 FCFA</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Frais de Mise en Service</h4>
                <p className="text-slate-300 text-sm mb-2">100 000 FCFA (frais uniques)</p>
                <p className="text-slate-500 text-xs">Répartition : 75% HUB_RESA, 25% (25 000 FCFA) pour vous</p>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Votre Commission</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Prime recrutement : 25 000 FCFA par compagnie</li>
                  <li>✓ Commission crédits : 25 FCFA par crédit (20%)</li>
                  <li>✓ Commission CA : {stats?.commissionRate ?? 5}% du chiffre d'affaires</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link href="/conditions">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Voir les Conditions Complètes →
                  </Button>
                </Link>
                <a href="https://d2xsxph8kpxj0f.cloudfront.net/310519663089638801/krJWDH8mB9j4aJHR7zvPat/CONTRAT_BUSINESS_DEVELOPPEUR_82698037.pdf" download>
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
                    📄 Télécharger le Contrat BDev
                  </Button>
                </a>
                <a href="https://d2xsxph8kpxj0f.cloudfront.net/310519663089638801/krJWDH8mB9j4aJHR7zvPat/ARGUMENTAIRE_PROSPECTION_BDEV_29e365fe.pdf" download>
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
                    📚 Télécharger l'Argumentaire de Prospection
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des compagnies */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-400" />
              Mes compagnies recrutées
              <Badge className="ml-auto bg-slate-700 text-slate-300 border-0">{companies.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companiesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-10">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune compagnie recrutée pour l'instant.</p>
                <p className="text-slate-500 text-xs mt-1">
                  Partagez votre ID <span className="text-orange-400 font-mono">{profile?.bdId}</span> aux compagnies lors de leur inscription.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{company.companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">
                          {ACTIVITY_LABELS[company.activityType] ?? company.activityType}
                        </span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(company.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className={`text-xs border ${STATUS_COLORS[company.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                        {STATUS_LABELS[company.status] ?? company.status}
                      </Badge>
  
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lien retour */}
        <div className="text-center pb-4">
          <Link href="/">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-300 text-sm">
              ← Retour à l'accueil HUB_RESA
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
