import { Check, HelpCircle, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  requiredPlan?: "free" | "pro" | "enterprise";
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
    <nav 
      className="w-full py-4 sm:py-6 md:py-8" 
      aria-label="Progresso do planejamento estratégico"
      role="navigation"
    >
      {/* Barra de Progresso - Mobile Optimized */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span 
              className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap"
              aria-current="step"
            >
              Etapa {currentStep}/{steps.length}
            </span>
            {totalCompletedSteps > 0 && (
              <span 
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary font-medium animate-fade-in whitespace-nowrap"
                role="status"
              >
                {totalCompletedSteps} ✓
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span 
              className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap"
              role="status"
              aria-label={`${Math.round(progressPercentage)} por cento completo`}
            >
              {Math.round(progressPercentage)}%
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden xs:inline">
              ~{(steps.length - currentStep) * 5} min
            </span>
          </div>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-1.5 sm:h-2 transition-all duration-500"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercentage}
        />
      </div>

      {/* Stepper - Mobile Optimized (Horizontal Scroll on small screens) */}
      <div className="relative">
        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <div className="flex items-center gap-1 min-w-max">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isClickable = (isCompleted || isCurrent) && onStepClick;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      "relative flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shrink-0",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isCompleted && "bg-primary text-primary-foreground shadow-md",
                      isCurrent && "bg-primary text-primary-foreground shadow-lg scale-110",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                      isClickable && "cursor-pointer active:scale-95"
                    )}
                    aria-label={`${step.title}: ${isCompleted ? 'Concluída' : isCurrent ? 'Atual' : 'Não iniciada'}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-semibold" aria-hidden="true">{step.id}</span>
                    )}
                  </button>
                  {index !== steps.length - 1 && (
                    <div
                      className={cn(
                        "w-6 h-0.5 transition-colors mx-1",
                        isCompleted || isCurrent ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Current step label for mobile */}
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-primary">
              {steps[currentStep - 1]?.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>

        {/* Desktop: Full stepper */}
        <div className="hidden md:flex items-center justify-between">
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
                      "relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full transition-all duration-300 shrink-0",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isCompleted && "bg-primary text-primary-foreground shadow-md",
                      isCurrent && "bg-primary text-primary-foreground shadow-lg scale-110",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                      isClickable && "cursor-pointer hover:scale-105 hover:shadow-md"
                    )}
                    aria-label={`${step.title}: ${isCompleted ? 'Concluída' : isCurrent ? 'Atual' : 'Não iniciada'}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                    ) : (
                      <span className="text-base lg:text-lg font-semibold" aria-hidden="true">{step.id}</span>
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
                <div className="mt-3 lg:mt-4 text-center max-w-[100px] lg:max-w-[120px] px-1">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <p
                      className={cn(
                        "text-xs lg:text-sm font-medium transition-colors duration-300 truncate",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.requiredPlan === "pro" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] gap-0.5">
                              <Crown className="w-2.5 h-2.5" />
                              PRO
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Recurso exclusivo do plano PRO</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {step.requiredPlan === "enterprise" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              ENT
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Recurso exclusivo do plano Enterprise</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {step.tooltip && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full shrink-0"
                              aria-label={`Informações sobre ${step.title}`}
                            >
                              <HelpCircle 
                                className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" 
                                aria-hidden="true"
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{step.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 hidden lg:block truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
