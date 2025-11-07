import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable';
  size?: number;
}

export const TrendIndicator = ({ trend, size = 16 }: TrendIndicatorProps) => {
  if (trend === 'up') {
    return <TrendingUp className="text-success" size={size} />;
  }
  
  if (trend === 'down') {
    return <TrendingDown className="text-destructive" size={size} />;
  }
  
  return <Minus className="text-muted-foreground" size={size} />;
};
