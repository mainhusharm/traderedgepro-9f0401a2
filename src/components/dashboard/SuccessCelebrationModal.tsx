import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  DollarSign, 
  Loader2, 
  Trophy,
  PartyPopper,
  Star,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface SuccessCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  firmName: string;
  onSuccess?: () => void;
}

export function SuccessCelebrationModal({ 
  open, 
  onOpenChange, 
  accountId,
  firmName,
  onSuccess
}: SuccessCelebrationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [consentToShare, setConsentToShare] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${accountId}/success-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('signal-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signal-images')
        .getPublicUrl(fileName);

      setScreenshotUrl(publicUrl);
      setScreenshotName(file.name);
      toast.success('Screenshot uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter the payout amount you received');
      return;
    }

    setLoading(true);
    try {
      // Record the success in payout_requests as a "reported" success
      const { error } = await (supabase as any).from('payout_requests').insert({
        user_id: user.id,
        account_id: accountId,
        prop_firm_name: firmName,
        amount: parseFloat(payoutAmount),
        net_amount: parseFloat(payoutAmount),
        status: 'reported',
        documents: screenshotUrl ? [{ name: screenshotName, url: screenshotUrl, type: 'success_proof' }] : [],
        notes: testimonial,
        payment_method: 'received_from_prop_firm'
      });

      if (error) throw error;

      // Update account status to 'passed' with payout info
      await supabase
        .from('user_prop_accounts')
        .update({ 
          status: 'passed',
          payout_amount: parseFloat(payoutAmount)
        })
        .eq('id', accountId);

      // If user consented, save testimonial separately
      if (consentToShare && testimonial) {
        await (supabase as any).from('user_activity_notifications').insert({
          activity_type: 'success_story',
          portal: 'main',
          user_id: user.id,
          user_email: user.email || 'unknown',
          user_name: 'User',
          amount: parseFloat(payoutAmount),
          details: {
            account_id: accountId,
            firm_name: firmName,
            testimonial,
            screenshot_url: screenshotUrl,
            consent_to_share: true
          }
        });
      }

      // Trigger confetti celebration!
      triggerConfetti();
      
      toast.success('🎉 Congratulations on your payout! Amazing work!');
      onSuccess?.();
      
      // Delay closing to show confetti
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);

    } catch (error) {
      console.error('Error recording success:', error);
      toast.error('Failed to record your success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-yellow-400" />
            Celebrate Your Success!
          </DialogTitle>
          <DialogDescription>
            You received a payout from {firmName} - let's celebrate! 🎉
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success Banner */}
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 via-green-500/10 to-emerald-500/10 border border-yellow-500/20 rounded-lg text-center">
            <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
            <p className="font-semibold text-lg">You did it!</p>
            <p className="text-sm text-muted-foreground">
              Record your payout for tracking and (optionally) share your success story
            </p>
          </div>

          {/* Payout Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Payout Amount Received *
            </Label>
            <Input
              type="number"
              placeholder="Enter the amount you received"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Optional Screenshot */}
          <div className="space-y-2">
            <Label>Proof Screenshot (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot of your payout confirmation
            </p>
            {screenshotUrl ? (
              <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded">
                <span className="text-sm truncate flex-1">{screenshotName}</span>
                <button 
                  onClick={() => { setScreenshotUrl(''); setScreenshotName(''); }}
                  className="p-1 hover:bg-destructive/20 rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            )}
          </div>

          {/* Testimonial */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              What helped you pass? (Optional)
            </Label>
            <Textarea 
              placeholder="Share what strategies or tools helped you succeed..."
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Checkbox
              id="consent"
              checked={consentToShare}
              onCheckedChange={(checked) => setConsentToShare(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="text-sm cursor-pointer">
                Share my success story
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow us to feature your success (anonymously or with name) to inspire others
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Later
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-green-600 hover:from-yellow-700 hover:to-green-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PartyPopper className="h-4 w-4 mr-2" />
              )}
              Celebrate!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
