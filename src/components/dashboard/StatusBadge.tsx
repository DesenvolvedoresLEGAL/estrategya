import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'nao_iniciado' | 'em_andamento' | 'em_risco' | 'concluido' | 'pausado';
}

const statusConfig = {
  nao_iniciado: {
    label: 'Não Iniciado',
    className: 'bg-muted text-muted-foreground border-border'
  },
  em_andamento: {
    label: 'Em Andamento',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
  },
  em_risco: {
    label: 'Em Risco',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  concluido: {
    label: 'Concluído',
    className: 'bg-success/10 text-success border-success/20'
  },
  pausado: {
    label: 'Pausado',
    className: 'bg-muted text-muted-foreground border-border'
  }
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
