/**
 * CompanyDashboardLayout — Layout avec menu latéral pour le dashboard compagnie
 * Fournit une navigation cohérente et responsive
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  MapPin,
  Ticket,
  Clock,
  Package,
  Bus,
  BarChart3,
  BookOpen,
  Coins,
  Users,
  MessageSquare,
  Images,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  value: string;
  color?: string;
}

interface CompanyDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  companyName?: string;
}

export default function CompanyDashboardLayout({
  children,
  activeTab,
  onTabChange,
  companyName = "Ma Compagnie",
}: CompanyDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const menuItems: MenuItem[] = [
    { label: "Accueil", icon: <LayoutDashboard className="h-5 w-5" />, value: "overview" },
    { label: "Réservations", icon: <Clock className="h-5 w-5" />, value: "bookings" },
    { label: "Reçu de paiement", icon: <Ticket className="h-5 w-5" />, value: "tickets" },
    { label: "Finance", icon: <BarChart3 className="h-5 w-5" />, value: "finance" },
    { label: "QR Code", icon: <BookOpen className="h-5 w-5" />, value: "qrcode" },
    {
      label: "Crédits HUB_RESA",
      icon: <Coins className="h-5 w-5" />,
      value: "credits",
      color: "text-[#E8751A]",
    },
    { label: "Équipe", icon: <Users className="h-5 w-5" />, value: "team" },
    { label: "Messages", icon: <MessageSquare className="h-5 w-5" />, value: "messages" },
    { label: "Galerie photos", icon: <Images className="h-5 w-5" />, value: "galerie" },
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
              <p className="text-xs text-gray-500">Dashboard</p>
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

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTabClick(item.value)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                activeTab === item.value
                  ? "bg-[#E8751A] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className={cn("flex-shrink-0", item.color)}>
                {item.icon}
              </span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer du sidebar */}
        <div className="p-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate("/transport/settings")}
          >
            <Settings className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Paramètres</span>}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">{companyName}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-1 max-h-96 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleTabClick(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  activeTab === item.value
                    ? "bg-[#E8751A] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
