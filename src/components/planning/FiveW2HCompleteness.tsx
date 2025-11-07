import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Target,
  HelpCircle,
  User,
  Calendar,
  MapPin,
  List,
  DollarSign
} from "lucide-react";

interface FiveW2HCompletenessProps {
  data: {
    what?: string;
    why?: string;
    who?: string;
    when_deadline?: string;
    where_location?: string;
    how?: string;
    how_much?: number;
  };
}

const FIELDS = [
  { key: "what", label: "What (O que)", icon: Target, critical: true },
  { key: "why", label: "Why (Por que)", icon: HelpCircle, critical: true },
  { key: "who", label: "Who (Quem)", icon: User, critical: true },
  { key: "when_deadline", label: "When (Quando)", icon: Calendar, critical: true },
  { key: "where_location", label: "Where (Onde)", icon: MapPin, critical: false },
  { key: "how", label: "How (Como)", icon: List, critical: true },
  { key: "how_much", label: "How Much (Quanto)", icon: DollarSign, critical: false },
];

export const FiveW2HCompleteness = ({ data }: FiveW2HCompletenessProps) => {
  const calculateCompleteness = () => {
    const filled = FIELDS.filter(field => {
      const value = data[field.key as keyof typeof data];
      return value !== null && value !== undefined && value.toString().trim() !== "";
    });
    return Math.round((filled.length / FIELDS.length) * 100);
  };

  const getMissingFields = () => {
    return FIELDS.filter(field => {
      const value = data[field.key as keyof typeof data];
      return !value || value.toString().trim() === "";
    });
  };

  const getMissingCriticalFields = () => {
    return getMissingFields().filter(f => f.critical);
  };

  const completeness = calculateCompleteness();
  const missingFields = getMissingFields();
  const missingCritical = getMissingCriticalFields();
  const isComplete = completeness === 100;
  const hasCriticalIssues = missingCritical.length > 0;

  const getStatusColor = () => {
    if (isComplete) return "text-success";
    if (hasCriticalIssues) return "text-destructive";
    return "text-orange-600";
  };

  const getStatusBg = () => {
    if (isComplete) return "bg-success/10 border-success";
    if (hasCriticalIssues) return "bg-destructive/10 border-destructive";
    return "bg-orange-100 dark:bg-orange-900/20 border-orange-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status de Completude do 5W2H</span>
          <Badge variant={isComplete ? "default" : "outline"} className={getStatusColor()}>
            {completeness}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={completeness} className="h-3" />
          <p className="text-sm text-muted-foreground text-center">
            {FIELDS.length - missingFields.length} de {FIELDS.length} campos preenchidos
          </p>
        </div>

        {/* Status Alert */}
        {hasCriticalIssues ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Ação necessária:</strong> {missingCritical.length} campo(s) crítico(s) não preenchido(s).
              Complete para garantir a execução efetiva da iniciativa.
            </AlertDescription>
          </Alert>
        ) : !isComplete ? (
          <Alert className={getStatusBg()}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quase lá!</strong> Preencha os {missingFields.length} campo(s) restante(s) 
              para ter um plano de ação completo.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-success/10 border-success">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              <strong>Perfeito!</strong> 5W2H 100% completo. Iniciativa pronta para execução.
            </AlertDescription>
          </Alert>
        )}

        {/* Fields Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Campos do 5W2H</h4>
          <div className="space-y-2">
            {FIELDS.map(field => {
              const value = data[field.key as keyof typeof data];
              const isFilled = value !== null && value !== undefined && value.toString().trim() !== "";
              const Icon = field.icon;

              return (
                <div
                  key={field.key}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isFilled ? "bg-muted/50" : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isFilled ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                    <span className={`text-sm ${isFilled ? "text-foreground" : "text-muted-foreground"}`}>
                      {field.label}
                    </span>
                    {field.critical && !isFilled && (
                      <Badge variant="outline" className="text-xs border-destructive text-destructive">
                        Crítico
                      </Badge>
                    )}
                  </div>
                  {isFilled ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Fields Summary */}
        {missingFields.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Campos pendentes:</p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map(field => (
                <Badge
                  key={field.key}
                  variant="outline"
                  className={field.critical ? "border-destructive text-destructive" : ""}
                >
                  {field.label}
                  {field.critical && " *"}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};