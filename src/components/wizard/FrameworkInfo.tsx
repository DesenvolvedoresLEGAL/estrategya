import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen } from "lucide-react";

interface FrameworkInfoProps {
  framework: 'SWOT' | 'OGSM' | 'OKR' | 'BSC' | 'MATRIZ' | '4DX';
}

const frameworkData = {
  SWOT: {
    name: "Análise SWOT",
    description: "Framework clássico de diagnóstico estratégico que identifica forças internas, fraquezas internas, oportunidades externas e ameaças externas.",
    links: [
      { label: "Wikipedia - SWOT", url: "https://pt.wikipedia.org/wiki/An%C3%A1lise_SWOT" },
      { label: "Harvard Business Review", url: "https://hbr.org/2007/11/a-new-approach-to-swot-analysis" }
    ]
  },
  OGSM: {
    name: "OGSM",
    description: "Objective, Goals, Strategies, Measures - framework de planejamento em uma página que conecta visão estratégica com execução tática.",
    links: [
      { label: "OGSM Framework Guide", url: "https://www.ogsm.com/" },
      { label: "What is OGSM?", url: "https://www.mindtools.com/a5bxfxg/ogsm" }
    ]
  },
  OKR: {
    name: "OKRs",
    description: "Objectives and Key Results - metodologia de definição de metas usada por Google, Intel e outras empresas líderes para alinhar objetivos e resultados mensuráveis.",
    links: [
      { label: "Google's OKR Guide", url: "https://rework.withgoogle.com/guides/set-goals-with-okrs/steps/introduction/" },
      { label: "OKR.com", url: "https://www.okr.com/" }
    ]
  },
  BSC: {
    name: "Balanced Scorecard",
    description: "Sistema de gestão estratégica que equilibra 4 perspectivas: Financeira, Clientes, Processos Internos e Aprendizado & Crescimento.",
    links: [
      { label: "BSC Institute", url: "https://balancedscorecard.org/" },
      { label: "Harvard Business Review - BSC", url: "https://hbr.org/1992/01/the-balanced-scorecard-measures-that-drive-performance-2" }
    ]
  },
  MATRIZ: {
    name: "Matriz Impacto x Esforço",
    description: "Ferramenta de priorização que classifica iniciativas em 4 quadrantes baseados no impacto potencial e esforço necessário.",
    links: [
      { label: "Priority Matrix Guide", url: "https://www.mindtools.com/a1xn8mr/eisenhower-box" },
      { label: "Impact Effort Matrix", url: "https://asana.com/resources/impact-effort-matrix" }
    ]
  },
  "4DX": {
    name: "4 Disciplinas da Execução (4DX)",
    description: "Framework de execução estratégica com 4 disciplinas: Foco no crucialmente importante, medidas de direção, placar visível e cadência de responsabilização.",
    links: [
      { label: "4DX Official Site", url: "https://www.franklincovey.com/the-4-disciplines/" },
      { label: "The 4 Disciplines Book", url: "https://www.amazon.com/Disciplines-Execution-Achieving-Wildly-Important/dp/1491517751" }
    ]
  }
};

export const FrameworkInfo = ({ framework }: FrameworkInfoProps) => {
  const info = frameworkData[framework];

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <Badge variant="outline" className="mb-2">Framework</Badge>
            <h4 className="font-semibold text-sm mb-1">{info.name}</h4>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {info.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};