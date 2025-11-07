import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContextualHelpProps {
  label: string;
  description?: string;
  examples?: string[];
}

export const ContextualHelp = ({
  label,
  description,
  examples = [],
}: ContextualHelpProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label={`Ajuda sobre ${label}`}
          >
            <HelpCircle className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            {description && (
              <p className="text-sm">{description}</p>
            )}
            {examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Exemplos:
                </p>
                <ul className="text-xs space-y-1">
                  {examples.map((example, idx) => (
                    <li key={idx} className="text-foreground/80">
                      • {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
