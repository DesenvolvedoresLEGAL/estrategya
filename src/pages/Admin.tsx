import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Clock,
  Target,
  Zap,
  BarChart3,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has platform_admin role using security definer function
      const { data, error } = await supabase.rpc('is_platform_admin');

      if (error) {
        console.error('Error checking platform admin:', error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Tente novamente mais tarde",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      if (!data) {
        toast({
          title: "Acesso Negado",
          description: "Apenas administradores da plataforma podem acessar esta área",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadMetrics();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Get all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, created_at, segment, model');

      if (companiesError) throw companiesError;

      // Get all users (count)
      const { count: usersCount } = await supabase
        .from('wizard_progress')
        .select('user_id', { count: 'exact', head: true });

      // Get objectives count
      const { count: objectivesCount } = await supabase
        .from('strategic_objectives')
        .select('*', { count: 'exact', head: true });

      // Get initiatives count
      const { count: initiativesCount } = await supabase
        .from('initiatives')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { data: subscriptions } = await supabase
        .from('company_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('status', 'active');

      // Calculate DAU (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: dauCount } = await supabase
        .from('activity_log')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      // Calculate MAU (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: mauCount } = await supabase
        .from('activity_log')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Plans created by day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const plansPerDay: Record<string, number> = {};
      companies?.forEach(company => {
        const date = new Date(company.created_at).toLocaleDateString('pt-BR');
        plansPerDay[date] = (plansPerDay[date] || 0) + 1;
      });

      const plansChartData = Object.entries(plansPerDay).map(([date, count]) => ({
        date,
        plans: count
      }));

      // Segment distribution
      const segmentDistribution: Record<string, number> = {};
      companies?.forEach(company => {
        segmentDistribution[company.segment] = (segmentDistribution[company.segment] || 0) + 1;
      });

      const segmentChartData = Object.entries(segmentDistribution).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate MRR (simplified - assuming R$97/month per active subscription)
      const mrr = (subscriptions?.length || 0) * 97;
      const arr = mrr * 12;

      setMetrics({
        totalUsers: usersCount || 0,
        totalCompanies: companies?.length || 0,
        totalObjectives: objectivesCount || 0,
        totalInitiatives: initiativesCount || 0,
        dau: dauCount || 0,
        mau: mauCount || 0,
        activeSubscriptions: subscriptions?.length || 0,
        mrr,
        arr,
        plansPerDay: plansChartData,
        segmentDistribution: segmentChartData,
        companies: companies || [],
        subscriptions: subscriptions || [],
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Métricas e analytics do produto</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Usuários Totais</span>
              </div>
              <div className="text-4xl font-bold">{metrics?.totalUsers}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-green-600">DAU: {metrics?.dau}</span>
                <span className="text-muted-foreground">MAU: {metrics?.mau}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Planos Criados</span>
              </div>
              <div className="text-4xl font-bold">{metrics?.totalCompanies}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {metrics?.totalObjectives} objetivos | {metrics?.totalInitiatives} iniciativas
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Assinaturas Ativas</span>
              </div>
              <div className="text-4xl font-bold">{metrics?.activeSubscriptions}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Taxa de conversão: {metrics?.totalCompanies > 0 
                  ? ((metrics?.activeSubscriptions / metrics?.totalCompanies) * 100).toFixed(1)
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">MRR / ARR</span>
              </div>
              <div className="text-4xl font-bold">R$ {metrics?.mrr?.toLocaleString('pt-BR')}</div>
              <p className="text-sm text-muted-foreground mt-2">
                ARR: R$ {metrics?.arr?.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="growth">Crescimento</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="segments">Segmentos</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planos Criados por Dia</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.plansPerDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="plans" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Taxa de Ativação</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {metrics?.totalCompanies > 0 
                      ? ((metrics?.totalObjectives / metrics?.totalCompanies) * 100).toFixed(0)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Empresas com objetivos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Média de Objetivos</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {metrics?.totalCompanies > 0 
                      ? (metrics?.totalObjectives / metrics?.totalCompanies).toFixed(1)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por empresa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Média de Iniciativas</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {metrics?.totalObjectives > 0 
                      ? (metrics?.totalInitiatives / metrics?.totalObjectives).toFixed(1)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por objetivo
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Segmento</CardTitle>
                <CardDescription>Total de empresas por setor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.segmentDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics?.segmentDistribution?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>Lista de todas as empresas no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.companies?.slice(0, 20).map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{company.segment}</p>
                        <p className="text-sm text-muted-foreground">{company.model}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}