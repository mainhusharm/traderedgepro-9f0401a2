import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface SessionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionNumber: string;
  topic: string;
  agentId?: string | null;
  onRatingSubmitted?: () => void;
}

const SessionRatingModal = ({
  isOpen,
  onClose,
  sessionId,
  sessionNumber,
  topic,
  agentId,
  onRatingSubmitted
}: SessionRatingModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase
        .from('session_ratings' as any)
        .insert({
          session_id: sessionId,
          user_id: user.id,
          agent_id: agentId || null,
          rating,
          feedback: feedback.trim() || null
        }) as any);

      if (error) throw error;

      // Send notification to agent if assigned
      if (agentId) {
        try {
          // Fetch agent email
          const { data: agent } = await (supabase
            .from('admin_agents' as any)
            .select('email, name')
            .eq('id', agentId)
            .single() as any);
          
          if (agent?.email) {
            await callEdgeFunction('send-rating-notification', {
              agentEmail: agent.email,
              agentName: agent.name || 'Agent',
              sessionNumber,
              topic,
              rating,
              feedback: feedback.trim() || undefined,
              userName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
            });
            console.log('Rating notification sent to agent');
          }
        } catch (notifyError) {
          console.error('Failed to send rating notification:', notifyError);
          // Don't fail the rating if notification fails
        }
      }

      toast.success('Thank you for your feedback!');
      onRatingSubmitted?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (error.code === '23505') {
        toast.error('You have already rated this session');
      } else {
        toast.error('Failed to submit rating');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Rate Your Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Session Info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Session {sessionNumber}</p>
            <p className="font-medium">{topic}</p>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      (hoveredRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <p className="text-sm font-medium text-primary">
              {getRatingLabel(hoveredRating || rating)}
            </p>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Share your experience (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="What went well? Any suggestions for improvement?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full btn-glow"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionRatingModal;
