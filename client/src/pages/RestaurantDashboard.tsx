import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import RestaurantDashboardLayout from "@/components/RestaurantDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingUp, Users, Clock } from "lucide-react";

type SidebarSection = "overview" | "orders" | "tables" | "menu" | "receipts" | "finance" | "team" | "messages" | "gallery";

export default function RestaurantDashboard() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SidebarSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await trpc.auth.logout.useMutation().mutateAsync();
    navigate("/");
  };

  const kpiCards = [
    {
      title: "Commandes aujourd'hui",
      value: "0",
      subtitle: "Nouvelles commandes",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Chiffre d'affaires",
      value: "0 FCFA",
      subtitle: "Aujourd'hui",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Clients",
      value: "0",
      subtitle: "Clients actifs",
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Temps moyen",
      value: "0 min",
      subtitle: "Préparation",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Restaurant</h1>
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
      case "orders":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Commandes</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Commandes en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "tables":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tables</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Tables en développement...</p>
              </CardContent>
            </Card>
          </div>
        );
      case "menu":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Module Menu en développement...</p>
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
    <RestaurantDashboardLayout
      companyName="Mon Restaurant"
      activeTab={activeSection}
      onTabChange={(tab) => setActiveSection(tab as SidebarSection)}
      onLogout={handleLogout}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {renderContent()}
    </RestaurantDashboardLayout>
  );
}
