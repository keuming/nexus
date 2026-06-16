import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  TableProperties,
  Menu as MenuIcon,
  Receipt,
  BarChart3,
  Users,
  MessageSquare,
  Images,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  value: string;
  color?: string;
}

interface RestaurantDashboardLayoutProps {
  companyName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onLogout?: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function RestaurantDashboardLayout({
  companyName,
  activeTab,
  onTabChange,
  children,
  onLogout,
  sidebarOpen = true,
  setSidebarOpen = () => {},
}: RestaurantDashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const menuItems: MenuItem[] = [
    { label: "Accueil", icon: <LayoutDashboard className="h-5 w-5" />, value: "overview" },
    { label: "Commandes", icon: <ShoppingCart className="h-5 w-5" />, value: "orders" },
    { label: "Tables", icon: <TableProperties className="h-5 w-5" />, value: "tables" },
    { label: "Menu", icon: <MenuIcon className="h-5 w-5" />, value: "menu" },
    { label: "Reçu de paiement", icon: <Receipt className="h-5 w-5" />, value: "receipts" },
    { label: "Finance", icon: <BarChart3 className="h-5 w-5" />, value: "finance" },
    { label: "Équipe", icon: <Users className="h-5 w-5" />, value: "team" },
    { label: "Messages", icon: <MessageSquare className="h-5 w-5" />, value: "messages" },
    { label: "Galerie photos", icon: <Images className="h-5 w-5" />, value: "gallery" },
  ];

  const handleTabClick = (value: string) => {
    onTabChange(value);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Header du sidebar */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-gray-900 truncate">{companyName}</h2>
              <p className="text-xs text-gray-500">Restaurant</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTabClick(item.value)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1",
                activeTab === item.value
                  ? "bg-orange-50 text-orange-600 border-l-4 border-orange-600"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <span className={cn("flex-shrink-0", item.color)}>{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        {sidebarOpen && (
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{companyName}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleTabClick(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  activeTab === item.value
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
