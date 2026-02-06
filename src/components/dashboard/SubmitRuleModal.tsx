import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface SubmitRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propFirmName?: string;
  propFirmId?: string;
}

const RULE_TYPES = [
  { value: 'consistency', label: 'Consistency Rule' },
  { value: 'hidden', label: 'Hidden Restriction' },
  { value: 'correction', label: 'Rule Correction' },
  { value: 'missing', label: 'Missing Rule' },
];

const RULE_FIELDS = [
  { value: 'consistency_rule_percent', label: 'Consistency Rule %', description: 'Max % of total profit allowed in single day' },
  { value: 'max_position_size', label: 'Max Position Size', description: 'Maximum lot size allowed per trade' },
  { value: 'max_open_trades', label: 'Max Open Trades', description: 'Maximum simultaneous positions allowed' },
  { value: 'max_open_lots', label: 'Max Open Lots', description: 'Maximum total lots across all positions' },
  { value: 'hedging_allowed', label: 'Hedging Allowed', description: 'Whether hedging same pair is allowed (true/false)' },
  { value: 'martingale_allowed', label: 'Martingale Allowed', description: 'Whether martingale/averaging is allowed (true/false)' },
  { value: 'stop_loss_required', label: 'Stop Loss Required', description: 'Whether SL is mandatory (true/false)' },
  { value: 'min_stop_loss_pips', label: 'Min Stop Loss Pips', description: 'Minimum stop loss distance in pips' },
  { value: 'payout_split', label: 'Payout Split %', description: 'Profit split percentage for traders' },
  { value: 'payout_frequency', label: 'Payout Frequency', description: 'e.g., weekly, bi-weekly, monthly, on-demand' },
  { value: 'first_payout_delay', label: 'First Payout Delay (days)', description: 'Days until first payout eligible' },
  { value: 'inactivity_rule_days', label: 'Inactivity Rule (days)', description: 'Days without trading before account termination' },
  { value: 'prohibited_instruments', label: 'Prohibited Instruments', description: 'Comma-separated list of banned instruments' },
  { value: 'prohibited_strategies', label: 'Prohibited Strategies', description: 'e.g., grid, martingale, latency_arbitrage' },
  { value: 'reset_fee', label: 'Reset Fee ($)', description: 'Cost to reset a failed challenge' },
  { value: 'max_daily_loss_percent', label: 'Max Daily Loss %', description: 'Maximum daily loss percentage' },
  { value: 'max_total_drawdown_percent', label: 'Max Total Drawdown %', description: 'Maximum overall drawdown percentage' },
  { value: 'profit_target_percent', label: 'Profit Target %', description: 'Profit target to pass challenge' },
  { value: 'other', label: 'Other Rule', description: 'Specify the rule in notes' },
];

export function SubmitRuleModal({ open, onOpenChange, propFirmName = '', propFirmId }: SubmitRuleModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    propFirmName: propFirmName,
    ruleType: '',
    ruleField: '',
    ruleValue: '',
    supportingEvidence: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propFirmName || !formData.ruleType || !formData.ruleField || !formData.ruleValue) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to submit a rule');
      }

      // Use any type to bypass strict typing for new tables
      const { error } = await (supabase as any).from('user_submitted_rules').insert({
        user_id: user.id,
        prop_firm_name: formData.propFirmName,
        prop_firm_id: propFirmId || null,
        rule_type: formData.ruleType,
        rule_field: formData.ruleField,
        rule_value: formData.ruleValue,
        supporting_evidence: formData.supportingEvidence || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Rule Submitted',
        description: 'Your rule has been submitted for review. You\'ll be notified when it\'s approved.',
      });

      // Reset form after delay
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          propFirmName: '',
          ruleType: '',
          ruleField: '',
          ruleValue: '',
          supportingEvidence: '',
          notes: '',
        });
        onOpenChange(false);
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting rule:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFieldInfo = RULE_FIELDS.find(f => f.value === formData.ruleField);

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Submitted for Review</h3>
            <p className="text-muted-foreground">
              Our team will verify this rule and update the database if approved.
              Thank you for helping improve our prop firm data!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Missing or Incorrect Rule
          </DialogTitle>
          <DialogDescription>
            Help us improve our prop firm database by reporting rules we may have missed or got wrong.
            All submissions are reviewed by our team before being added.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="propFirmName">Prop Firm Name *</Label>
            <Input
              id="propFirmName"
              value={formData.propFirmName}
              onChange={(e) => setFormData(prev => ({ ...prev, propFirmName: e.target.value }))}
              placeholder="e.g., FTMO, Funding Pips, MyFundedFX"
              disabled={!!propFirmName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruleType">Rule Type *</Label>
            <Select
              value={formData.ruleType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ruleType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rule type" />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruleField">Rule Category *</Label>
            <Select
              value={formData.ruleField}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ruleField: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select which rule" />
              </SelectTrigger>
              <SelectContent>
                {RULE_FIELDS.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFieldInfo && (
              <p className="text-xs text-muted-foreground">{selectedFieldInfo.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruleValue">Rule Value *</Label>
            <Input
              id="ruleValue"
              value={formData.ruleValue}
              onChange={(e) => setFormData(prev => ({ ...prev, ruleValue: e.target.value }))}
              placeholder="Enter the correct value"
            />
            <p className="text-xs text-muted-foreground">
              For boolean fields, enter "true" or "false". For lists, use comma-separated values.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportingEvidence">Source URL (optional)</Label>
            <Input
              id="supportingEvidence"
              value={formData.supportingEvidence}
              onChange={(e) => setFormData(prev => ({ ...prev, supportingEvidence: e.target.value }))}
              placeholder="https://ftmo.com/rules or other source"
            />
            <p className="text-xs text-muted-foreground">
              Link to the official source where you found this information
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional context or explanation..."
              rows={3}
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
            <p className="text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> Your submission will be reviewed by our team. If approved, you'll receive a 
              "Community Contributor" badge and the rule will be added to our database to help all traders.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Review'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
