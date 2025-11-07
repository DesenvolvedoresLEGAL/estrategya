import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Rocket, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Initiative {
  id: string;
  title: string;
  description?: string;
  ice_score?: number;
  impact_score?: number;
  confidence_score?: number;
  ease_score?: number;
  priority_quadrant?: string;
}

interface ICERankingListProps {
  initiatives: Initiative[];
}

export const ICERankingList = ({ initiatives }: ICERankingListProps) => {
  const navigate = useNavigate();

  const sortedInitiatives = [...initiatives]
    .filter(i => i.ice_score !== null && i.ice_score !== undefined)
    .sort((a, b) => (b.ice_score || 0) - (a.ice_score || 0));

  const getScoreColor = (score: number) => {
    if (score >= 700) return "text-green-600 dark:text-green-400";
    if (score >= 400) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 700) return { variant: "default" as const, label: "Alta" };
    if (score >= 400) return { variant: "secondary" as const, label: "Média" };
    return { variant: "outline" as const, label: "Baixa" };
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Rocket className="h-5 w-5 text-blue-500" />;
    if (index === 2) return <Star className="h-5 w-5 text-purple-500" />;
    return null;
  };

  if (sortedInitiatives.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma iniciativa com ICE Score calculado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedInitiatives.map((initiative, index) => {
        const scoreBadge = getScoreBadge(initiative.ice_score || 0);
        return (
          <Card key={initiative.id} className={index < 3 ? "border-primary/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Rank Icon */}
                <div className="mt-1">
                  {getRankIcon(index) || (
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm leading-tight">
                      {initiative.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-2xl font-bold ${getScoreColor(initiative.ice_score || 0)}`}>
                        {initiative.ice_score}
                      </div>
                    </div>
                  </div>

                  {initiative.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {initiative.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={scoreBadge.variant} className="text-xs">
                        {scoreBadge.label}
                      </Badge>
                      {initiative.priority_quadrant && (
                        <Badge variant="outline" className="text-xs">
                          {initiative.priority_quadrant}
                        </Badge>
                      )}
                      {index < 3 && (
                        <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                          Top 3
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/iniciativa/${initiative.id}`)}
                      className="text-xs"
                    >
                      Ver detalhes
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  {/* ICE Breakdown */}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>I: {initiative.impact_score || '-'}</span>
                    <span>C: {initiative.confidence_score || '-'}</span>
                    <span>E: {initiative.ease_score || '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
