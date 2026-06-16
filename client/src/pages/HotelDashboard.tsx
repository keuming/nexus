import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import HotelDashboardLayout from "@/components/HotelDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, TrendingUp, Wallet, ShoppingBag } from "lucide-react";

type SidebarSection = "overview" | "bookings" | "clients" | "rooms" | "services" | "receipts" | "finance" | "team" | "messages" | "gallery";

export default function HotelDashboard() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SidebarSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: settings } = trpc.hotel.getSettings.useQuery();

  const currency = settings?.currency ?? "FCFA";

  const handleLogout = async () => {
    await trpc.auth.logout.useMutation().mutateAsync();
    navigate("/");
  };

  const kpiCards = [
    {
      title: "Taux d'Occupation",
      value: isLoading ? "..." : `${stats?.occupancyRate ?? 0}%`,
      subtitle: "Ce mois",
      icon: Percent,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "RevPAR",
      value: isLoading ? "..." : `${(stats?.revpar ?? 0).toFixed(0)} ${currency}`,
      subtitle: "Revenue par chambre",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "ADR",
      value: isLoading ? "..." : `${(stats?.adr ?? 0).toFixed(0)} ${currency}`,
      subtitle: "Prix moyen par nuit",
      icon: Wallet,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "CA Total",
      value: isLoading ? "..." : `${(stats?.caTotal ?? 0).toFixed(0)} ${currency}`,
      subtitle: "Ce mois",
      icon: ShoppingBag,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Hôtel</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                        {card.title}
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                      <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      case "bookings":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Réservations</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Réservations en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "clients":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Clients</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Clients en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "rooms":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chambres</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Chambres en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "services":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Services</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Services en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "receipts":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reçu de paiement</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Reçu de paiement en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "finance":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Finance</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Finance en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "team":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Équipe</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Équipe en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "messages":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Messages en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "gallery":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Galerie photos</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Galerie en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <HotelDashboardLayout
      companyName={settings?.name || "Mon Hôtel"}
      activeTab={activeSection}
      onTabChange={(tab) => setActiveSection(tab as SidebarSection)}
      onLogout={handleLogout}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {renderContent()}
    </HotelDashboardLayout>
  );
}
