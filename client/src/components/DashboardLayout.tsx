import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BedDouble,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Gift,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PanelLeft,
  Settings,
  Sparkles,
  Star,
  Users,
  UserSquare2,
  Wrench,
  Zap,
  TrendingUp,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BedDouble, label: "Chambres", path: "/chambres" },
  { icon: CalendarCheck, label: "Réservations", path: "/reservations" },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: CreditCard, label: "Caisse", path: "/caisse" },
  { icon: Sparkles, label: "Services", path: "/services" },
  { icon: ClipboardList, label: "Housekeeping", path: "/housekeeping" },
  { icon: Package, label: "Inventaire", path: "/inventaire" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: UserSquare2, label: "Employés", path: "/employes" },
  { icon: MessageSquare, label: "Avis clients", path: "/avis" },
  { icon: Gift, label: "Offres spéciales", path: "/offres" },
  { icon: Zap, label: "Crédits — Suivi", path: "/credits" },
  { icon: TrendingUp, label: "Demandes de crédit", path: "/credit-requests" },
];

const SIDEBAR_WIDTH_KEY = "hub-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[oklch(0.20_0.06_250)] to-[oklch(0.15_0.05_250)]">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-8 w-8 text-amber-500" />
              <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                NEXUS
              </span>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-lg font-semibold text-center text-foreground mt-2">
              Système de Gestion Hôtelière
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find((item) => item.path === location);

  const { data: hotelSettings } = trpc.hotel.getSettings.useQuery();
  const { data: hotelProfile } = trpc.publicHotels.myProfile.useQuery();
  const { data: pendingReservations } = trpc.reservations.getPending.useQuery();
  const pendingCount = pendingReservations?.length ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* Header */}
          <SidebarHeader className="h-16 border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-3 h-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  {hotelProfile?.logoUrl ? (
                    <img src={hotelProfile.logoUrl} alt={hotelProfile.hotelName} className="h-8 w-8 rounded-lg object-cover shrink-0 border border-amber-400/30" />
                  ) : (
                    <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span
                      className="font-bold text-sidebar-foreground text-sm truncate"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {hotelProfile?.hotelName ?? hotelSettings?.name ?? "NEXUS"}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: hotelProfile?.stars ?? hotelSettings?.stars ?? 4 }).map((_, i) => (
                        <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 gap-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                const isReservations = item.path === "/reservations";
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 transition-all"
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-400" : "text-sidebar-foreground/60"}`} />
                      <span className={isActive ? "font-medium" : "font-normal"}>{item.label}</span>
                      {isReservations && pendingCount > 0 && !isCollapsed && (
                        <span className="ml-auto flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                          {pendingCount}
                        </span>
                      )}
                      {isActive && !isReservations && !isCollapsed && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-amber-400" />
                      )}
                      {isActive && isReservations && pendingCount === 0 && !isCollapsed && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-amber-400" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Séparateur */}
            <div className="mx-4 my-2 border-t border-sidebar-border" />

            {/* Settings */}
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/parametres"}
                  onClick={() => setLocation("/parametres")}
                  tooltip="Paramètres"
                  className="h-9"
                >
                  <Settings className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 shrink-0 border border-amber-400/30">
                    <AvatarFallback className="text-xs font-semibold bg-amber-500/20 text-amber-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-sidebar-foreground leading-none">
                        {user?.name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50 truncate mt-1">
                        {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/parametres")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-400/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-medium text-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 min-h-screen bg-background">{children}</main>
      </SidebarInset>
    </>
  );
}
