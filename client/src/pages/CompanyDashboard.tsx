import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import TransportDashboard from "./TransportDashboard";
import HotelDashboard from "./HotelDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

/**
 * Page wrapper qui sélectionne automatiquement le bon dashboard
 * selon le type d'activité de la compagnie
 */
export default function CompanyDashboard() {
  const [, navigate] = useLocation();
  const [activityType, setActivityType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer le type d'activité depuis la compagnie
  const { data: companies } = trpc.transport.csn.companies.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (companies && companies.length > 0) {
      // Prendre la première compagnie ou celle sélectionnée
      const company = companies[0];
      setActivityType(company.activityType || "transport");
      setLoading(false);
    } else if (companies) {
      // Pas de compagnie trouvée
      setLoading(false);
    }
  }, [companies]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!activityType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aucune compagnie trouvée</h2>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Sélectionner le dashboard selon le type d'activité
  switch (activityType) {
    case "hotel":
      return <HotelDashboard />;
    case "restauration":
      return <RestaurantDashboard />;
    case "transport":
    default:
      return <TransportDashboard />;
  }
}
