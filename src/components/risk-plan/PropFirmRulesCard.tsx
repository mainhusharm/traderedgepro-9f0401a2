import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Calendar, 
  Target, 
  TrendingDown, 
  Newspaper, 
  Clock, 
  Bot, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Flag,
  Percent,
  Ban,
  Layers,
  DollarSign
} from 'lucide-react';
import { SubmitRuleModal } from '@/components/dashboard/SubmitRuleModal';

interface PropFirmRulesCardProps {
  propFirmName: string;
  accountType: string;
  propFirmId?: string;
}

interface PropFirmRules {
  id: string;
  max_daily_loss_percent: number | null;
  max_total_drawdown_percent: number | null;
  profit_target_percent: number | null;
  min_trading_days: number | null;
  max_trading_days: number | null;
  news_trading_allowed: boolean | null;
  weekend_holding_allowed: boolean | null;
  ea_allowed: boolean | null;
  copy_trading_allowed: boolean | null;
  additional_rules: any;
  // New fields
  consistency_rule_percent: number | null;
  consistency_rule_type: string | null;
  max_open_trades: number | null;
  max_open_lots: number | null;
  hedging_allowed: boolean | null;
  martingale_allowed: boolean | null;
  stop_loss_required: boolean | null;
  min_stop_loss_pips: number | null;
  payout_split: number | null;
  payout_frequency: string | null;
  first_payout_delay: number | null;
  inactivity_rule_days: number | null;
  prohibited_instruments: string[] | null;
  prohibited_strategies: string[] | null;
}

const PropFirmRulesCard = ({ propFirmName, accountType, propFirmId }: PropFirmRulesCardProps) => {
  const [rules, setRules] = useState<PropFirmRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firmNotFound, setFirmNotFound] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [firmId, setFirmId] = useState<string | undefined>(propFirmId);

  useEffect(() => {
    const fetchRules = async () => {
      if (!propFirmName) {
        setIsLoading(false);
        return;
      }

      try {
        // First find the prop firm
        const { data: propFirm } = await supabase
          .from('prop_firms')
          .select('id')
          .ilike('name', propFirmName)
          .maybeSingle();

        if (!propFirm) {
          setFirmNotFound(true);
          setIsLoading(false);
          return;
        }

        setFirmId(propFirm.id);

        // Get the rules for this prop firm and account type
        const { data: rulesData } = await supabase
          .from('prop_firm_rules')
          .select('*')
          .eq('prop_firm_id', propFirm.id)
          .eq('is_current', true)
          .maybeSingle();

        if (rulesData) {
          setRules(rulesData as PropFirmRules);
        }
      } catch (error) {
        console.error('Error fetching prop firm rules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, [propFirmName, accountType]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (firmNotFound || !rules) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              {propFirmName} Rules
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSubmitModal(true)}
            >
              <Flag className="w-4 h-4 mr-1" />
              Report Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Rules not yet extracted for this prop firm. Complete questionnaire to update.</span>
          </div>
        </CardContent>
        <SubmitRuleModal 
          open={showSubmitModal} 
          onOpenChange={setShowSubmitModal}
          propFirmName={propFirmName}
          propFirmId={firmId}
        />
      </Card>
    );
  }

  const RuleItem = ({ 
    icon: Icon, 
    label, 
    value, 
    isAllowed 
  }: { 
    icon: any; 
    label: string; 
    value: string | number | null; 
    isAllowed?: boolean | null;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      {isAllowed !== undefined && isAllowed !== null ? (
        <Badge variant={isAllowed ? "default" : "destructive"} className="text-xs">
          {isAllowed ? (
            <><CheckCircle className="w-3 h-3 mr-1" /> Allowed</>
          ) : (
            <><XCircle className="w-3 h-3 mr-1" /> Not Allowed</>
          )}
        </Badge>
      ) : value !== null ? (
        <span className="text-sm font-medium">{value}</span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )}
    </div>
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              {propFirmName} Rules
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{accountType}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSubmitModal(true)}
          >
            <Flag className="w-4 h-4 mr-1" />
            Report Issue
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Core Rules */}
        <RuleItem 
          icon={TrendingDown} 
          label="Max Daily Loss" 
          value={rules.max_daily_loss_percent ? `${rules.max_daily_loss_percent}%` : null} 
        />
        <RuleItem 
          icon={Shield} 
          label="Max Total Drawdown" 
          value={rules.max_total_drawdown_percent ? `${rules.max_total_drawdown_percent}%` : null} 
        />
        <RuleItem 
          icon={Target} 
          label="Profit Target" 
          value={rules.profit_target_percent ? `${rules.profit_target_percent}%` : null} 
        />
        <RuleItem 
          icon={Calendar} 
          label="Min Trading Days" 
          value={rules.min_trading_days} 
        />
        <RuleItem 
          icon={Clock} 
          label="Max Trading Days" 
          value={rules.max_trading_days || 'Unlimited'} 
        />

        {/* Consistency Rules (NEW) */}
        {rules.consistency_rule_percent && (
          <RuleItem 
            icon={Percent} 
            label="Consistency Rule" 
            value={`Max ${rules.consistency_rule_percent}% from single day`} 
          />
        )}

        {/* Position Limits (NEW) */}
        {rules.max_open_trades && (
          <RuleItem 
            icon={Layers} 
            label="Max Open Trades" 
            value={rules.max_open_trades} 
          />
        )}
        {rules.max_open_lots && (
          <RuleItem 
            icon={Layers} 
            label="Max Open Lots" 
            value={rules.max_open_lots} 
          />
        )}

        {/* Trading Restrictions */}
        <RuleItem 
          icon={Newspaper} 
          label="News Trading" 
          value={null}
          isAllowed={rules.news_trading_allowed} 
        />
        <RuleItem 
          icon={Calendar} 
          label="Weekend Holding" 
          value={null}
          isAllowed={rules.weekend_holding_allowed} 
        />
        <RuleItem 
          icon={Bot} 
          label="EA/Bots" 
          value={null}
          isAllowed={rules.ea_allowed} 
        />
        <RuleItem 
          icon={Users} 
          label="Copy Trading" 
          value={null}
          isAllowed={rules.copy_trading_allowed} 
        />

        {/* Strategy Restrictions (NEW) */}
        <RuleItem 
          icon={Ban} 
          label="Hedging" 
          value={null}
          isAllowed={rules.hedging_allowed} 
        />
        <RuleItem 
          icon={Ban} 
          label="Martingale/Grid" 
          value={null}
          isAllowed={rules.martingale_allowed} 
        />

        {/* Payout Info (NEW) */}
        {rules.payout_split && (
          <RuleItem 
            icon={DollarSign} 
            label="Payout Split" 
            value={`${rules.payout_split}% to trader`} 
          />
        )}
        {rules.payout_frequency && (
          <RuleItem 
            icon={Clock} 
            label="Payout Frequency" 
            value={rules.payout_frequency} 
          />
        )}
        {rules.first_payout_delay && (
          <RuleItem 
            icon={Calendar} 
            label="First Payout Delay" 
            value={`${rules.first_payout_delay} days`} 
          />
        )}

        {/* Prohibited Items (NEW) */}
        {rules.prohibited_instruments && rules.prohibited_instruments.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Prohibited Instruments:</p>
            <div className="flex flex-wrap gap-1">
              {rules.prohibited_instruments.map((inst, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{inst}</Badge>
              ))}
            </div>
          </div>
        )}
        {rules.prohibited_strategies && rules.prohibited_strategies.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Prohibited Strategies:</p>
            <div className="flex flex-wrap gap-1">
              {rules.prohibited_strategies.map((strat, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{strat}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Inactivity Warning (NEW) */}
        {rules.inactivity_rule_days && (
          <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Account closed after {rules.inactivity_rule_days} days without trading
            </p>
          </div>
        )}
      </CardContent>

      <SubmitRuleModal 
        open={showSubmitModal} 
        onOpenChange={setShowSubmitModal}
        propFirmName={propFirmName}
        propFirmId={firmId}
      />
    </Card>
  );
};

export default PropFirmRulesCard;
