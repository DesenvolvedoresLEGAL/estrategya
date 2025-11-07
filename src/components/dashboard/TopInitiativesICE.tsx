import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Rocket, Star, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Initiative {
  id: string;
  title: string;
  description?: string;
  ice_score?: number;
  what?: string;
  why?: string;
  who?: string;
}

interface TopInitiativesICEProps {
  initiatives: Initiative[];
}

export const TopInitiativesICE = ({ initiatives }: TopInitiativesICEProps) => {
  const navigate = useNavigate();

  const top3 = [...initiatives]
    .filter(i => i.ice_score !== null && i.ice_score !== undefined)
    .sort((a, b) => (b.ice_score || 0) - (a.ice_score || 0))
    .slice(0, 3);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Rocket className="h-5 w-5 text-blue-500" />;
    if (index === 2) return <Star className="h-5 w-5 text-purple-500" />;
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 700) return "text-green-600 dark:text-green-400";
    if (score >= 400) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const has5W2H = (initiative: Initiative) => {
    return initiative.what && initiative.why && initiative.who;
  };

  if (top3.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Top 3 Iniciativas ICE
          </CardTitle>
          <CardDescription>
            Suas iniciativas prioritárias aparecem aqui
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          Nenhuma iniciativa com ICE Score ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Top 3 Iniciativas ICE
            </CardTitle>
            <CardDescription>
              Iniciativas com maior prioridade (ICE Score)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/objetivos')}
          >
            Ver todas
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {top3.map((initiative, index) => (
          <div
            key={initiative.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/iniciativa/${initiative.id}`)}
          >
            {/* Rank Icon */}
            <div className="mt-1">
              {getRankIcon(index)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm leading-tight">
                  {initiative.title}
                </h4>
                <div className={`text-xl font-bold ${getScoreColor(initiative.ice_score || 0)}`}>
                  {initiative.ice_score}
                </div>
              </div>

              {initiative.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {initiative.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-xs">
                  Top {index + 1}
                </Badge>
                {has5W2H(initiative) ? (
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-600 dark:text-green-400">
                    5W2H Completo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600 dark:text-orange-400">
                    5W2H Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
