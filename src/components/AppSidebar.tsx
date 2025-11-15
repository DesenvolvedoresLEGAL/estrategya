import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  Users,
  Sparkles,
  Shield,
  PanelLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Objetivos", url: "/objetivos", icon: Target },
  { title: "Métricas", url: "/metricas", icon: TrendingUp },
  { title: "Insights IA", url: "/insights", icon: Lightbulb },
  { title: "Equipe", url: "/equipe", icon: Users },
];

const planningItems = [
  { title: "Planejamento", url: "/planejamento", icon: Settings },
  { title: "Plano Completo", url: "/plano-estrategico", icon: FileText },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Validador Planos", url: "/plan-validator", icon: Shield },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent className="pt-2">
        {/* Reduced top padding for mobile */}
        {/* Logo/Brand - Optimized for mobile */}
        <div className="p-3 sm:p-4 mb-1 sm:mb-2 transition-all duration-300">
          {open ? (
            <div className="flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground transition-transform duration-300" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-base sm:text-lg truncate">Estrategya</h2>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">Smart Planner</p>
                </div>
              </div>
              <SidebarTrigger className="shrink-0 h-8 w-8 transition-transform duration-200 hover:scale-110" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <SidebarTrigger className="h-8 w-8 transition-transform duration-200 hover:scale-110" />
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground transition-transform duration-300" />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Main Navigation - Touch-friendly */}
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs sm:text-sm px-3 sm:px-4">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="touch-target">
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 transition-all duration-200 min-h-[44px] flex items-center group"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
                      {open && <span className="text-sm sm:text-base truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Planning Navigation - Touch-friendly */}
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs sm:text-sm px-3 sm:px-4">Configuração</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {planningItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="touch-target">
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 transition-all duration-200 min-h-[44px] flex items-center group"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
                      {open && <span className="text-sm sm:text-base truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Admin Navigation - Touch-friendly */}
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs sm:text-sm px-3 sm:px-4">Admin</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="touch-target">
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 transition-all duration-200 min-h-[44px] flex items-center group"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
                      {open && <span className="text-sm sm:text-base truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - Touch-friendly */}
      <SidebarFooter className="pb-safe">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="touch-target">
              <NavLink
                to="/pricing"
                end
                className="hover:bg-primary/10 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center group"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                {open && <span className="text-sm sm:text-base truncate">Ver Planos</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 touch-target min-h-[44px] group"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
              {open && <span className="text-sm sm:text-base truncate">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
