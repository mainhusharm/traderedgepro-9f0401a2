import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostTradeReflectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalEntryId?: string;
  allocationId?: string;
  userId: string;
  symbol?: string;
  pnl?: number;
  onComplete?: () => void;
}

const EMOTIONAL_STATES = [
  { value: 'calm', label: 'Calm & Focused', emoji: '😌' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
];

export default function PostTradeReflectionModal({
  open,
  onOpenChange,
  journalEntryId,
  allocationId,
  userId,
  symbol,
  pnl,
  onComplete,
}: PostTradeReflectionModalProps) {
  const [followedPlan, setFollowedPlan] = useState<boolean | null>(null);
  const [emotionalState, setEmotionalState] = useState<string>('');
  const [lessonLearned, setLessonLearned] = useState('');
  const [wouldTakeAgain, setWouldTakeAgain] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please rate your trade execution');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('trade_post_mortems')
        .insert({
          user_id: userId,
          journal_entry_id: journalEntryId || null,
          allocation_id: allocationId || null,
          followed_plan: followedPlan,
          emotional_state: emotionalState,
          lesson_learned: lessonLearned || null,
          would_take_again: wouldTakeAgain,
          rating,
        });

      if (error) throw error;

      toast.success('Reflection saved!');
      onOpenChange(false);
      onComplete?.();

      // Reset form
      setFollowedPlan(null);
      setEmotionalState('');
      setLessonLearned('');
      setWouldTakeAgain(null);
      setRating(0);
    } catch (error: any) {
      toast.error('Failed to save reflection', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Post-Trade Reflection
            {symbol && <span className="text-sm font-normal text-muted-foreground">({symbol})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* P&L Display */}
          {pnl !== undefined && (
            <div className={`text-center p-3 rounded-lg ${pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <span className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
              </span>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rate your execution (1-5 stars)</Label>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Followed Plan */}
          <div className="space-y-2">
            <Label>Did you follow your trading plan?</Label>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant={followedPlan === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFollowedPlan(true)}
                className="flex items-center gap-1"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes
              </Button>
              <Button
                type="button"
                variant={followedPlan === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFollowedPlan(false)}
                className="flex items-center gap-1"
              >
                <ThumbsDown className="h-4 w-4" />
                No
              </Button>
              <Button
                type="button"
                variant={followedPlan === null ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFollowedPlan(null)}
                className="flex items-center gap-1"
              >
                <Meh className="h-4 w-4" />
                Partially
              </Button>
            </div>
          </div>

          {/* Emotional State */}
          <div className="space-y-2">
            <Label>How were you feeling?</Label>
            <div className="flex flex-wrap gap-2 justify-center">
              {EMOTIONAL_STATES.map((state) => (
                <Button
                  key={state.value}
                  type="button"
                  variant={emotionalState === state.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEmotionalState(state.value)}
                  className="text-xs"
                >
                  {state.emoji} {state.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Would Take Again */}
          <div className="space-y-2">
            <Label>Would you take this trade again?</Label>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant={wouldTakeAgain === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWouldTakeAgain(true)}
              >
                Yes, definitely
              </Button>
              <Button
                type="button"
                variant={wouldTakeAgain === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWouldTakeAgain(false)}
              >
                No, skip it
              </Button>
            </div>
          </div>

          {/* Lesson Learned */}
          <div className="space-y-2">
            <Label>Key lesson from this trade (optional)</Label>
            <Textarea
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              placeholder="What did you learn? What would you do differently?"
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? 'Saving...' : 'Save Reflection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
