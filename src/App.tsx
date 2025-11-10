import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Planejamento from "./pages/Planejamento";
import Dashboard from "./pages/Dashboard";
import Objetivos from "./pages/Objetivos";
import Metricas from "./pages/Metricas";
import Insights from "./pages/Insights";
import PlanoEstrategico from "@/pages/PlanoEstrategico";
import InitiativeDetail from "@/pages/InitiativeDetail";
import Equipe from "@/pages/Equipe";
import Admin from "@/pages/Admin";
import PlanValidator from "@/pages/PlanValidator";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const showSidebar = !["/", "/auth", "/pricing"].includes(location.pathname);

  if (!showSidebar) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger />
          </header>

          <main className="flex-1">
            <Routes>
              <Route path="/planejamento" element={<Planejamento />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/objetivos" element={<Objetivos />} />
              <Route path="/metricas" element={<Metricas />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/plano-estrategico" element={<PlanoEstrategico />} />
              <Route path="/iniciativa/:id" element={<InitiativeDetail />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/plan-validator" element={<PlanValidator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
