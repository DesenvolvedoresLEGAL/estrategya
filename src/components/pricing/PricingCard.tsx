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
      className={`relative p-4 sm:p-6 flex flex-col h-full ${
        isRecommended 
          ? "border-2 border-primary shadow-lg sm:scale-105" 
          : "border-border"
      }`}
    >
      {isRecommended && !isCurrentPlan && (
        <Badge className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-primary text-xs sm:text-sm px-2 sm:px-3">
          Mais Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs sm:text-sm px-2 sm:px-3">
          Plano Atual
        </Badge>
      )}
      
      <div className="space-y-3 sm:space-y-4 flex-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {price !== null ? (
          <div className="py-3 sm:py-4">
            {price?.monthly !== undefined ? (
              <div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    R$ {price.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm sm:text-base text-muted-foreground">/mês</span>
                </div>
                {price.annual && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    ou R$ {price.annual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                    <span className="text-primary font-medium ml-1 block xs:inline">(2 meses grátis)</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                Sob consulta
              </div>
            )}
          </div>
        ) : null}

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 sm:gap-3">
              <div className="rounded-full bg-primary/10 p-0.5 sm:p-1 mt-0.5 shrink-0">
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              </div>
              <span className="text-xs sm:text-sm text-foreground flex-1 leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={onButtonClick}
        className="w-full mt-4 sm:mt-6 touch-target"
        variant={isRecommended ? "default" : "outline"}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? "Plano atual" : buttonText}
      </Button>
    </Card>
  );
};
