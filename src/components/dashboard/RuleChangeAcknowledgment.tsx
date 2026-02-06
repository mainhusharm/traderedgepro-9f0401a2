import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface RuleChange {
  id: string;
  prop_firm_id: string;
  account_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  prop_firms?: {
    name: string;
  };
}

interface RuleChangeAcknowledgmentProps {
  propFirm: string;
  accountId?: string;
  onAcknowledged?: () => void;
}

const RuleChangeAcknowledgment = ({ propFirm, accountId, onAcknowledged }: RuleChangeAcknowledgmentProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [changes, setChanges] = useState<RuleChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkForUnacknowledgedChanges = async () => {
      if (!user || !propFirm) {
        setIsLoading(false);
        return;
      }

      try {
        // Get prop firm ID
        const { data: firm } = await supabase
          .from('prop_firms')
          .select('id')
          .eq('name', propFirm)
          .single();

        if (!firm) {
          setIsLoading(false);
          return;
        }

        // Get rule changes that haven't been acknowledged
        const { data: ruleChanges } = await supabase
          .from('prop_firm_rule_changes')
          .select(`
            *,
            prop_firms (name)
          `)
          .eq('prop_firm_id', firm.id)
          .order('detected_at', { ascending: false })
          .limit(20);

        if (!ruleChanges || ruleChanges.length === 0) {
          setIsLoading(false);
          return;
        }

        // Check which changes have been acknowledged
        const { data: acknowledgments } = await supabase
          .from('prop_firm_rule_acknowledgments')
          .select('rule_version')
          .eq('user_id', user.id)
          .eq('prop_firm', propFirm);

        const acknowledgedVersions = new Set(acknowledgments?.map(a => a.rule_version) || []);

        // Filter to unacknowledged changes (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const unacknowledged = ruleChanges.filter(c => {
          const changeDate = new Date(c.detected_at);
          const version = `${c.id}`;
          return changeDate > thirtyDaysAgo && !acknowledgedVersions.has(version);
        });

        if (unacknowledged.length > 0) {
          setChanges(unacknowledged as RuleChange[]);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error checking rule changes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForUnacknowledgedChanges();
  }, [user, propFirm]);

  const handleAcknowledge = async () => {
    if (!user || !acknowledged) return;

    setIsAcknowledging(true);

    try {
      // Insert acknowledgments for all changes
      const acknowledgments = changes.map(change => ({
        user_id: user.id,
        account_id: accountId || null,
        prop_firm: propFirm,
        rule_version: change.id,
        previous_rules: { [change.field_name]: change.old_value },
        new_rules: { [change.field_name]: change.new_value }
      }));

      const { error } = await supabase
        .from('prop_firm_rule_acknowledgments')
        .insert(acknowledgments);

      if (error) throw error;

      // Update the account's acknowledged version
      if (accountId) {
        await supabase
          .from('user_prop_accounts')
          .update({ 
            rule_version_acknowledged: new Date().toISOString()
          })
          .eq('id', accountId);
      }

      toast.success('Rule changes acknowledged');
      setIsOpen(false);
      onAcknowledged?.();
    } catch (error) {
      console.error('Error acknowledging changes:', error);
      toast.error('Failed to acknowledge changes');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedChanges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/percent/g, '%')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading || changes.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            {propFirm} Rules Have Changed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The following trading rules have been updated. Please review before continuing to trade.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {changes.map(change => (
              <motion.div
                key={change.id}
                layout
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(change.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{formatFieldName(change.field_name)}</p>
                    <p className="text-xs text-muted-foreground">{change.account_type}</p>
                  </div>
                  {expandedChanges.has(change.id) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedChanges.has(change.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 overflow-hidden"
                    >
                      <div className="p-3 grid grid-cols-2 gap-3">
                        <div className="bg-destructive/10 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground mb-1">Previous Value</p>
                          <p className="text-sm font-medium text-destructive line-through">
                            {change.old_value || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-success/10 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground mb-1">New Value</p>
                          <p className="text-sm font-medium text-success">
                            {change.new_value || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm text-amber-200">
              ⚠️ These changes may affect your trading limits. Update your risk plan accordingly.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge" 
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
            />
            <label 
              htmlFor="acknowledge" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I have reviewed and understand these rule changes
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Review Later
            </Button>
            <Button
              onClick={handleAcknowledge}
              disabled={!acknowledged || isAcknowledging}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {isAcknowledging ? 'Saving...' : 'Acknowledge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RuleChangeAcknowledgment;
