import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ChevronRight } from "lucide-react";

interface QuickWin {
  titulo: string;
  justificativa: string;
}

interface QuickWinListProps {
  quickWins: QuickWin[];
  onGenerateMore?: () => void;
  isLoading?: boolean;
}

export const QuickWinList = ({ quickWins, onGenerateMore, isLoading }: QuickWinListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <CardTitle>Quick Wins - Ações Rápidas</CardTitle>
          </div>
          {onGenerateMore && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onGenerateMore}
              disabled={isLoading}
            >
              {isLoading ? 'Gerando...' : 'Gerar Mais'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickWins.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma ação rápida disponível no momento
          </p>
        ) : (
          quickWins.map((win, index) => (
            <div 
              key={index}
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-bold">
                      {index + 1}
                    </span>
                    {win.titulo}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {win.justificativa}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
