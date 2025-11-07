import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ObjectiveCardProps {
  id: string;
  title: string;
  description?: string;
  status: 'nao_iniciado' | 'em_andamento' | 'em_risco' | 'concluido' | 'pausado';
  progress: number;
  perspective?: string;
  initiativesCount?: number;
}

export const ObjectiveCard = ({ 
  id,
  title, 
  description,
  status, 
  progress,
  perspective,
  initiativesCount = 0
}: ObjectiveCardProps) => {
  const navigate = useNavigate();

  const perspectiveColors: Record<string, string> = {
    'Financeiro': 'text-green-600 dark:text-green-500',
    'Clientes': 'text-blue-600 dark:text-blue-500',
    'Processos': 'text-purple-600 dark:text-purple-500',
    'Aprendizado': 'text-orange-600 dark:text-orange-500'
  };

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base mb-2 line-clamp-2">{title}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
              )}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          {perspective && (
            <span className={`font-medium ${perspectiveColors[perspective] || 'text-foreground'}`}>
              {perspective}
            </span>
          )}
          <span className="text-muted-foreground">
            {initiativesCount} {initiativesCount === 1 ? 'iniciativa' : 'iniciativas'}
          </span>
        </div>

        <Button 
          variant="ghost" 
          className="w-full group-hover:bg-muted/50"
          onClick={() => navigate('/objetivos')}
        >
          Ver detalhes
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
