import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Analytics from "./pages/Analytics";
import Caisse from "./pages/Caisse";
import Chambres from "./pages/Chambres";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import Employes from "./pages/Employes";
import Housekeeping from "./pages/Housekeeping";
import Inventaire from "./pages/Inventaire";
import Avis from "./pages/Avis";
import OffresSpeciales from "./pages/OffresSpeciales";
import ProfilHotel from "./pages/ProfilHotel";
import PublicHome from "./pages/PublicHome";
import PublicHotel from "./pages/PublicHotel";
import RegisterHotel from "./pages/RegisterHotel";
import Reservations from "./pages/Reservations";
import ReservationsEnAttente from "./pages/ReservationsEnAttente";
import Services from "./pages/Services";
// Transport module
import NexusHome from "./pages/NexusHome";
import RegisterCompany from "./pages/RegisterCompany";
import About from "./pages/About";
import Directory from "./pages/Directory";
import Legal from "./pages/Legal";
import CsnDashboard from "./pages/CsnDashboard";
import TransportDashboard from "./pages/TransportDashboard";
import TransportSettings from "./pages/TransportSettings";
import MenuCatalogue from "./pages/MenuCatalogue";
import Bibliotheque from "./pages/Bibliotheque";
import BibliothequeCompagnie from "./pages/BibliothequeCompagnie";
import CreditManagementPage from "./pages/CreditManagementPage";
import CreditRequestsPage from "./pages/CreditRequestsPage";
import ClientDashboard from "./pages/ClientDashboard";
import ClientsManagement from "./pages/ClientsManagement";
import { ClientAuthProvider } from "./contexts/ClientAuthContext";
import CareersApply from "./pages/CareersApply";
import CompanyDetail from "./pages/CompanyDetail";
import ShareCompany from "./pages/ShareCompany";
// Pages Business Développeur
import BDevRegister from "./pages/bdev/BDevRegister";
import BDevLogin from "./pages/bdev/BDevLogin";
import BDevDashboard from "./pages/bdev/BDevDashboard";
// Pages de destination SEO
import TransportAbidjan from "./pages/seo/TransportAbidjan";
import HotelsAbidjan from "./pages/seo/HotelsAbidjan";
import AgencesVoyageAbidjan from "./pages/seo/AgencesVoyageAbidjan";
import BoutiquesAbidjan from "./pages/seo/BoutiquesAbidjan";
import Conditions from "./pages/Conditions";
import ChatbotWidget from "@/components/ChatbotWidget";
import { GasOrder } from "./pages/GasOrder";
import { GasSupplierDashboard } from "./pages/GasSupplierDashboard";
import GasSupplierDashboardV2 from "./pages/GasSupplierDashboardV2";
import GasHome from "./pages/GasHome";
import DeliverymanDashboard from "./pages/DeliverymanDashboard";
import ClientGasDashboard from "./pages/ClientGasDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import AdminGeneral from "./pages/AdminGeneral";
import RestaurantDashboard from "./pages/RestaurantDashboard";
// Modules compagnie (à implémenter progressivement)

function Router() {
  const [location, navigate] = useLocation();

  // Redirection automatique admin.nexus.africa → /admin-general
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "admin.nexus.africa" &&
      location !== "/admin-general"
    ) {
      navigate("/admin-general");
    }
  }, [location]);

  return (
    <Switch>
      {/* ── NEXUS — Interface publique unifiée ── */}
      <Route path={"/"} component={NexusHome} />
      <Route path={"/about"} component={About} />
      <Route path={"/directory"} component={Directory} />
      <Route path={"/company/:id"} component={CompanyDetail} />
      <Route path={"/share/company/:id"} component={ShareCompany} />
      <Route path={"/legal"} component={Legal} />
      <Route path={"/conditions"} component={Conditions} />
      <Route path={"/careers/apply"} component={CareersApply} />
      {/* ── Business Développeur ── */}
      <Route path={"/bdev/register"} component={BDevRegister} />
      <Route path={"/bdev/login"} component={BDevLogin} />
      <Route path={"/bdev/dashboard"} component={BDevDashboard} />
      <Route path={"/register-company"} component={RegisterCompany} />
      <Route path={"/transport/register"} component={RegisterCompany} />
      {/* ── Pages de destination SEO ── */}
      <Route path={"/transport-abidjan"} component={TransportAbidjan} />
      <Route path={"/hotels-abidjan"} component={HotelsAbidjan} />
      <Route path={"/agences-voyage-abidjan"} component={AgencesVoyageAbidjan} />
      <Route path={"/boutiques-abidjan"} component={BoutiquesAbidjan} />

      {/* ── Client — Dashboard et gestion ── */}
      <Route path={"/client-dashboard"} component={ClientDashboard} />
      <Route path={"/clients-management"} component={ClientsManagement} />

      {/* ── Hôtel — Dashboard et gestion ── */}
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/hotel-dashboard"} component={Dashboard} /> {/* Alias for hotel companies */}
      <Route path={"/reservations"} component={Reservations} />
      <Route path={"/reservations-en-attente"} component={ReservationsEnAttente} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/employes"} component={Employes} />
      <Route path={"/chambres"} component={Chambres} />
      <Route path={"/services"} component={Services} />
      <Route path={"/inventaire"} component={Inventaire} />
      <Route path={"/housekeeping"} component={Housekeeping} />
      <Route path={"/avis"} component={Avis} />
      <Route path={"/offres-speciales"} component={OffresSpeciales} />
      <Route path={"/profil-hotel"} component={ProfilHotel} />
      <Route path={"/caisse"} component={Caisse} />
      <Route path={"/analytics"} component={Analytics} />

      {/* ── Restaurant — Dashboard et gestion ── */}
      <Route path={"/restaurant-dashboard"} component={RestaurantDashboard} />

      {/* ── Boutique — Dashboard et gestion ── */}
      <Route path={"/boutique-dashboard"} component={SupplierDashboard} />

      {/* ── Transport — Dashboard et gestion ── */}
      <Route path={"/transport-dashboard"} component={TransportDashboard} />
      <Route path={"/transport/dashboard"} component={TransportDashboard} /> {/* Redirect alias for user typo */}
      <Route path={"/transport-settings"} component={TransportSettings} />
      <Route path={"/csn-dashboard"} component={CsnDashboard} />
      <Route path={"/csn/dashboard"} component={CsnDashboard} /> {/* Redirect alias for user typo */}
      <Route path={"/menu-catalogue"} component={MenuCatalogue} />
      <Route path={"/bibliotheque"} component={Bibliotheque} />
      <Route path={"/bibliotheque-compagnie"} component={BibliothequeCompagnie} />
      <Route path={"/credit-management"} component={CreditManagementPage} />
      <Route path={"/credit-requests"} component={CreditRequestsPage} />

      {/* ── Public — Pages publiques ── */}
      <Route path={"/public-home"} component={PublicHome} />
      <Route path={"/public-hotel/:id"} component={PublicHotel} />
      <Route path={"/register-hotel"} component={RegisterHotel} />

      {/* ── Gas Order — Commande de gaz ── */}
      <Route path={"/gas-home"} component={GasHome} />
      <Route path={"/gas-order"} component={GasOrder} />
      <Route path={"/gas-supplier-dashboard"} component={GasSupplierDashboard} />
      <Route path={"/gas-supplier-dashboard-v2"} component={GasSupplierDashboardV2} />
      <Route path={"/gas-deliveryman-dashboard"} component={DeliverymanDashboard} />
      <Route path={"/gas-client-dashboard"} component={ClientGasDashboard} />
      <Route path={"/supplier-dashboard"} component={SupplierDashboard} />

      {/* ── Admin — Administration générale ── */}
      <Route path={"/admin-general"} component={AdminGeneral} />

      {/* ── Fallback ── */}
      <Route path={""} component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ClientAuthProvider>
            <Router />
            <ChatbotWidget />
            <Toaster />
          </ClientAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
