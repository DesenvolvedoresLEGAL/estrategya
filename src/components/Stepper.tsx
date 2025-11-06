import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper = ({ steps, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = currentStep >= step.id && onStepClick;

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
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
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
