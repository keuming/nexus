import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  BedDouble,
  CalendarCheck,
  CalendarPlus,
  Percent,
  Settings,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NewReservationModal from "@/components/NewReservationModal";
import AddCompanyModal from "@/components/AddCompanyModal";

const ROOM_STATUS_COLORS: Record<string, string> = {
  libre: "#10b981",
  occupee: "#3b82f6",
  maintenance: "#ef4444",
  reservee: "#f59e0b",
  nettoyage: "#8b5cf6",
};

const ROOM_STATUS_LABELS: Record<string, string> = {
  libre: "Libre",
  occupee: "Occupée",
  maintenance: "Maintenance",
  reservee: "Réservée",
  nettoyage: "Nettoyage",
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  checkin: "Check-in",
  checkout: "Check-out",
  annulee: "Annulée",
  no_show: "No Show",
};

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-800",
  confirmee: "bg-blue-100 text-blue-800",
  checkin: "bg-emerald-100 text-emerald-800",
  checkout: "bg-gray-100 text-gray-700",
  annulee: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
};

function formatCurrency(amount: number, currency = "FCFA") {
  if (amount === 0) return `0 ${currency}`;
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} ${currency}`;
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: settings } = trpc.hotel.getSettings.useQuery();
  const { data: monthlyRevenue } = trpc.dashboard.getMonthlyRevenue.useQuery({ year: new Date().getFullYear() });
  const { data: pendingReservations } = trpc.reservations.getPending.useQuery();
  const pendingCount = pendingReservations?.length ?? 0;

  const currency = settings?.currency ?? "FCFA";

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const kpiCards = [
    {
      title: "Taux d'Occupation",
      value: isLoading ? "..." : `${stats?.occupancyRate ?? 0}%`,
      subtitle: "Ce mois",
      icon: Percent,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null,
    },
    {
      title: "RevPAR",
      value: isLoading ? "..." : formatCurrency(stats?.revpar ?? 0, currency),
      subtitle: "Revenue par chambre dispo.",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: null,
    },
    {
      title: "ADR",
      value: isLoading ? "..." : formatCurrency(stats?.adr ?? 0, currency),
      subtitle: "Prix moyen par nuit",
      icon: Wallet,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      trend: null,
    },
    {
      title: "CA Total",
      value: isLoading ? "..." : formatCurrency(stats?.caTotal ?? 0, currency),
      subtitle: "Ce mois",
      icon: ShoppingBag,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      trend: null,
    },
  ];

  // Prepare pie chart data
  const pieData = stats?.roomStatuses
    ?.filter((s) => Number(s.count) > 0)
    .map((s) => ({
      name: ROOM_STATUS_LABELS[s.status ?? ""] ?? s.status,
      value: Number(s.count),
      color: ROOM_STATUS_COLORS[s.status ?? ""] ?? "#94a3b8",
    })) ?? [];

  // Monthly revenue chart
  const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const revenueData = monthlyRevenue?.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Hébergement: m.hebergement,
    Services: m.services,
  })) ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tableau de bord
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{today}</p>
          </div>
          <div className="flex gap-2">
            {user?.role === "admin" && (
              <>
                <Button
                  onClick={() => setShowAddCompany(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Ajouter une Compagnie
                </Button>
                <Button
                  onClick={() => setLocation("/admin-general")}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md"
                >
                  <Settings className="h-4 w-4" />
                  CONFIGURATION
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowNewReservation(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md"
            >
              <CalendarPlus className="h-4 w-4" />
              Nouvelle réservation
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow duration-200 border border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm font-medium text-foreground/80 mt-0.5">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Room Status Donut */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                Statut des chambres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <BedDouble className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">Aucune chambre configurée</p>
                  <Button variant="link" size="sm" onClick={() => setLocation("/chambres")} className="mt-1">
                    Ajouter des chambres
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} chambre(s)`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5 mt-2">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Bar Chart */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Répartition CA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 240)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value, currency), ""]} />
                  <Legend />
                  <Bar dataKey="Hébergement" fill="oklch(0.28 0.08 250)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Services" fill="oklch(0.78 0.14 75)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Indicators */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Indicateurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
                {[
                  {
                    icon: BedDouble,
                    label: "Total chambres",
                    value: stats?.totalRooms ?? 0,
                    color: "text-blue-500",
                    bg: "bg-blue-50",
                    onClick: () => setLocation("/chambres"),
                    badge: null,
                  },
                  {
                    icon: CalendarCheck,
                    label: "Réservations",
                    value: stats?.monthReservations ?? 0,
                    color: "text-violet-500",
                    bg: "bg-violet-50",
                    onClick: () => setLocation("/reservations"),
                    badge: pendingCount > 0 ? pendingCount : null,
                  },
                {
                  icon: ShoppingBag,
                  label: "Panier moyen",
                  value: formatCurrency(stats?.avgBasket ?? 0, currency),
                  color: "text-amber-500",
                  bg: "bg-amber-50",
                  onClick: () => setLocation("/analytics"),
                },
                {
                  icon: TriangleAlert,
                  label: "Stock critique",
                  value: stats?.lowStockItems ?? 0,
                  color: "text-red-500",
                  bg: "bg-red-50",
                  onClick: () => setLocation("/inventaire"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center justify-between w-full py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${item.bg}`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Reservations */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Réservations récentes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/reservations")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Voir tout
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentReservations?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Aucune réservation récente</p>
                <Button variant="link" size="sm" onClick={() => setShowNewReservation(true)} className="mt-1">
                  Créer une réservation
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Référence</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Chambre</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Check-in</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Check-out</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentReservations.map((res, idx) => (
                      <tr
                        key={res.id}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                        onClick={() => setLocation(`/reservations/${res.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                          {res.reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {res.clientFirstName} {res.clientLastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {res.roomNumber ? `Ch. ${res.roomNumber}` : "-"}
                          {res.roomTypeName && (
                            <span className="text-xs ml-1 text-muted-foreground/60">({res.roomTypeName})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(res.checkInDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(res.checkOutDate)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {formatCurrency(parseFloat(res.totalAmount ?? "0"), currency)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${RESERVATION_STATUS_COLORS[res.status ?? "en_attente"] ?? ""}`}
                          >
                            {RESERVATION_STATUS_LABELS[res.status ?? "en_attente"] ?? res.status}
                          </Badge>
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

      {showNewReservation && (
        <NewReservationModal onClose={() => setShowNewReservation(false)} />
      )}
      <AddCompanyModal
        open={showAddCompany}
        onOpenChange={setShowAddCompany}
      />
    </DashboardLayout>
  );
}
