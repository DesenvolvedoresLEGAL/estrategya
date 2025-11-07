import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepTransitionProps {
  children: ReactNode;
  className?: string;
}

export const StepTransition = ({ children, className }: StepTransitionProps) => {
  return (
    <div
      className={cn(
        "animate-fade-in",
        className
      )}
      role="region"
      aria-live="polite"
    >
      {children}
    </div>
  );
};
