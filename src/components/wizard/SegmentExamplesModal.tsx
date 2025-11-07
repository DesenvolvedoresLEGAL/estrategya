import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: string;
  examples: {
    strengths_examples?: string[];
    weaknesses_examples?: string[];
    opportunities_examples?: string[];
    threats_examples?: string[];
  };
  onUseExample: (field: string, example: string) => void;
}

export const SegmentExamplesModal = ({ 
  open, 
  onOpenChange, 
  segment, 
  examples,
  onUseExample 
}: Props) => {
  const sections = [
    { key: 'strengths_examples', label: 'Forças', color: 'bg-green-100 dark:bg-green-900/20' },
    { key: 'weaknesses_examples', label: 'Fraquezas', color: 'bg-red-100 dark:bg-red-900/20' },
    { key: 'opportunities_examples', label: 'Oportunidades', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { key: 'threats_examples', label: 'Ameaças', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Exemplos de SWOT para {segment}
          </DialogTitle>
          <DialogDescription>
            Clique em um exemplo para adicioná-lo ao seu formulário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {sections.map((section) => {
            const items = examples[section.key as keyof typeof examples] || [];
            if (items.length === 0) return null;

            return (
              <div key={section.key}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">{section.label}</Badge>
                </h3>
                <div className="space-y-2">
                  {items.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const field = section.key.replace('_examples', '');
                        onUseExample(field, example);
                      }}
                      className={`w-full text-left p-3 rounded-lg ${section.color} hover:opacity-80 transition-opacity flex items-start gap-2 group`}
                    >
                      <CheckCircle2 className="w-4 h-4 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <span className="text-sm">{example}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
