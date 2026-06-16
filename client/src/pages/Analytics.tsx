import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  DollarSign,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k FCFA`;
  return `${Math.round(amount)} FCFA`;
}

const COLORS = ["#1e3a5f", "#c9a84c", "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];

export default function Analytics() {
  const [year] = useState(new Date().getFullYear());

  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { data: monthlyRevenue } = trpc.dashboard.getMonthlyRevenue.useQuery({ year });
  const { data: reservations } = trpc.reservations.list.useQuery({});
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Prepare monthly data
  const monthlyData = MONTHS_FR.map((month, i) => {
    const data = monthlyRevenue?.[i];
    return {
      month,
      hebergement: data?.hebergement ?? 0,
      services: data?.services ?? 0,
      total: (data?.hebergement ?? 0) + (data?.services ?? 0),
    };
  });

  // Reservation status distribution
  const statusData = [
    { name: "Confirmées", value: reservations?.filter(r => r.status === "confirmee").length ?? 0, color: "#2563eb" },
    { name: "Check-in", value: reservations?.filter(r => r.status === "checkin").length ?? 0, color: "#16a34a" },
    { name: "Check-out", value: reservations?.filter(r => r.status === "checkout").length ?? 0, color: "#6b7280" },
    { name: "En attente", value: reservations?.filter(r => r.status === "en_attente").length ?? 0, color: "#d97706" },
    { name: "Annulées", value: reservations?.filter(r => r.status === "annulee").length ?? 0, color: "#dc2626" },
  ].filter(d => d.value > 0);

  // Room type distribution
  const roomTypeData = rooms?.reduce((acc, r) => {
    const type = r.typeName ?? "Autre";
    const existing = acc.find(a => a.name === type);
    if (existing) existing.value++;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]) ?? [];

  // Source distribution
  const sourceData = reservations?.reduce((acc, r) => {
    const source = r.source ?? "direct";
    const labels: Record<string, string> = { direct: "Direct", booking: "Booking.com", expedia: "Expedia", airbnb: "Airbnb", phone: "Téléphone", walk_in: "Walk-in" };
    const name = labels[source] ?? source;
    const existing = acc.find(a => a.name === name);
    if (existing) existing.value++;
    else acc.push({ name, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]) ?? [];

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.total, 0);
  const avgMonthlyRevenue = totalRevenue / 12;
  const totalReservations = reservations?.length ?? 0;
  const occupancyRate = stats?.occupancyRate ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rapports de performance — Année {year}
          </p>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Percent className="h-5 w-5 text-blue-600" />,
              bg: "bg-blue-50",
              value: `${occupancyRate}%`,
              label: "Taux d'occupation",
              sub: "Ce mois",
            },
            {
              icon: <DollarSign className="h-5 w-5 text-amber-600" />,
              bg: "bg-amber-50",
              value: formatCurrency(totalRevenue),
              label: "CA annuel",
              sub: `Moy. ${formatCurrency(avgMonthlyRevenue)}/mois`,
            },
            {
              icon: <CalendarCheck className="h-5 w-5 text-emerald-600" />,
              bg: "bg-emerald-50",
              value: totalReservations,
              label: "Réservations totales",
              sub: `${reservations?.filter(r => r.status === "checkin").length ?? 0} en cours`,
            },
            {
              icon: <BedDouble className="h-5 w-5 text-purple-600" />,
              bg: "bg-purple-50",
              value: stats?.totalRooms ?? 0,
              label: "Chambres",
              sub: `${stats?.freeRooms ?? 0} libres`,
            },
          ].map((kpi, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{kpi.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Évolution du chiffre d'affaires — {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("fr-FR").format(value) + " FCFA",
                    name === "hebergement" ? "Hébergement" : "Services",
                  ]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend formatter={(v) => v === "hebergement" ? "Hébergement" : "Services"} />
                <Bar dataKey="hebergement" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="services" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Three columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reservation Status */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Statut des réservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Aucune donnée</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "réservations"]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {statusData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Room Types */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                Types de chambres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomTypeData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Aucune donnée</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={roomTypeData} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value">
                        {roomTypeData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "chambres"]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {roomTypeData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sources */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Sources de réservation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Aucune donnée</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {sourceData.sort((a, b) => b.value - a.value).map((d, i) => {
                    const total = sourceData.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-semibold">{d.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Line */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tendance du CA total mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(value: number) => [new Intl.NumberFormat("fr-FR").format(value) + " FCFA", "CA Total"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="total" stroke="#c9a84c" strokeWidth={2.5} dot={{ fill: "#c9a84c", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
