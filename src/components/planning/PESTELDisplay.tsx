import { Card } from "@/components/ui/card";
import { Building2, DollarSign, Users, Cpu, Leaf, Scale } from "lucide-react";

interface PESTELData {
  politico: string | null;
  economico: string | null;
  social: string | null;
  tecnologico: string | null;
  ambiental: string | null;
  legal: string | null;
}

interface PESTELDisplayProps {
  pestel: PESTELData;
}

export const PESTELDisplay = ({ pestel }: PESTELDisplayProps) => {
  const factors = [
    { key: 'politico', label: 'Político', icon: Building2, value: pestel.politico },
    { key: 'economico', label: 'Econômico', icon: DollarSign, value: pestel.economico },
    { key: 'social', label: 'Social', icon: Users, value: pestel.social },
    { key: 'tecnologico', label: 'Tecnológico', icon: Cpu, value: pestel.tecnologico },
    { key: 'ambiental', label: 'Ambiental', icon: Leaf, value: pestel.ambiental },
    { key: 'legal', label: 'Legal', icon: Scale, value: pestel.legal },
  ];

  const relevantFactors = factors.filter(f => f.value);

  if (relevantFactors.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Nenhum fator PESTEL relevante identificado para este segmento.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {relevantFactors.map((factor) => {
        const Icon = factor.icon;
        return (
          <Card key={factor.key} className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{factor.label}</h4>
                <p className="text-sm text-muted-foreground">{factor.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
