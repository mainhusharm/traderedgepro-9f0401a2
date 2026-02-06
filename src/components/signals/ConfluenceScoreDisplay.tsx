import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

interface ConfluenceScoreDisplayProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfluenceScoreDisplay = ({ 
  score, 
  showLabel = true, 
  size = 'md' 
}: ConfluenceScoreDisplayProps) => {
  const getScoreColor = () => {
    if (score >= 8) return 'text-success bg-success/20 border-success/30';
    if (score >= 6) return 'text-primary bg-primary/20 border-primary/30';
    if (score >= 4) return 'text-warning bg-warning/20 border-warning/30';
    return 'text-destructive bg-destructive/20 border-destructive/30';
  };

  const getScoreLabel = () => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Strong';
    if (score >= 5) return 'Moderate';
    return 'Weak';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border font-medium',
      getScoreColor(),
      sizeClasses[size]
    )}>
      <Target className={iconSizes[size]} />
      <span className="font-bold">{score}/10</span>
      {showLabel && (
        <span className="opacity-80">• {getScoreLabel()}</span>
      )}
    </div>
  );
};
