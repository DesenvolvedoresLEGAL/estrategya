import { Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Step {
  id: number;
  title: string;
  description: string;
  tooltip?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
}

export const Stepper = ({ steps, currentStep, completedSteps = [], onStepClick }: StepperProps) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
  const totalCompletedSteps = completedSteps.length;

  return (
    <div className="w-full py-8">
      {/* Barra de Progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Etapa {currentStep} de {steps.length}
            </span>
            {totalCompletedSteps > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {totalCompletedSteps} concluídas
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-primary">
            {Math.round(progressPercentage)}% completo
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Stepper Original */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = (isCompleted || isCurrent) && onStepClick;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index !== 0 && (
                  <div
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isCompleted && "bg-primary text-primary-foreground shadow-md",
                    isCurrent && "bg-primary text-primary-foreground shadow-lg scale-110",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-semibold">{step.id}</span>
                  )}
                </button>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      isCompleted || isCurrent ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="mt-4 text-center max-w-[120px]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="focus:outline-none">
                            <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{step.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
