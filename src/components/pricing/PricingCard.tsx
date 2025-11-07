import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  buttonText: string;
  onButtonClick: () => void;
  isRecommended?: boolean;
  price?: {
    monthly?: number;
    annual?: number;
  } | null;
  currentTier?: string;
}

export const PricingCard = ({
  title,
  subtitle,
  description,
  features,
  buttonText,
  onButtonClick,
  isRecommended = false,
  price,
  currentTier,
}: PricingCardProps) => {
  const isCurrentPlan = currentTier === title.toLowerCase();

  return (
    <Card 
      className={`relative p-6 flex flex-col h-full ${
        isRecommended 
          ? "border-2 border-primary shadow-lg scale-105" 
          : "border-border"
      }`}
    >
      {isRecommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Recomendado
        </Badge>
      )}
      
      <div className="space-y-4 flex-1">
        <div>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {price !== null ? (
          <div className="py-4">
            {price?.monthly !== undefined ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    R$ {price.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                {price.annual && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ou R$ {price.annual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                    <span className="text-primary font-medium ml-1">(2 meses grátis)</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                Sob consulta
              </div>
            )}
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="space-y-3 pt-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-foreground flex-1">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={onButtonClick}
        className="w-full mt-6"
        variant={isRecommended ? "default" : "outline"}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? "Plano atual" : buttonText}
      </Button>
    </Card>
  );
};
