import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Lightbulb, Target, Eye, Check, X } from "lucide-react";

interface InsightCardProps {
  type: 'progresso' | 'risco' | 'oportunidade' | 'recomendacao';
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  status?: 'novo' | 'visualizado' | 'resolvido' | 'ignorado';
  onMarkAsViewed?: () => void;
  onResolve?: () => void;
  onIgnore?: () => void;
}

const typeConfig = {
  progresso: {
    icon: TrendingUp,
    label: 'Progresso',
    className: 'bg-success/10 text-success border-success/20'
  },
  risco: {
    icon: AlertCircle,
    label: 'Risco',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  oportunidade: {
    icon: Lightbulb,
    label: 'Oportunidade',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
  },
  recomendacao: {
    icon: Target,
    label: 'Recomendação',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
  }
};

const priorityConfig = {
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  media: { label: 'Média', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  alta: { label: 'Alta', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' },
  critica: { label: 'Crítica', className: 'bg-destructive/10 text-destructive' }
};

export const InsightCard = ({
  type,
  title,
  description,
  priority,
  status = 'novo',
  onMarkAsViewed,
  onResolve,
  onIgnore
}: InsightCardProps) => {
  const typeInfo = typeConfig[type];
  const priorityInfo = priorityConfig[priority];
  const Icon = typeInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${typeInfo.className}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant="outline" className={typeInfo.className}>
                  {typeInfo.label}
                </Badge>
                <Badge variant="outline" className={priorityInfo.className}>
                  {priorityInfo.label}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {description}
            </p>

            {status === 'novo' && (
              <div className="flex gap-2">
                {onMarkAsViewed && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onMarkAsViewed}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                )}
                {onResolve && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={onResolve}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Resolver
                  </Button>
                )}
                {onIgnore && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onIgnore}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Ignorar
                  </Button>
                )}
              </div>
            )}

            {status === 'resolvido' && (
              <Badge variant="outline" className="bg-success/10 text-success">
                ✓ Resolvido
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
