import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface BreakEvenConfigWidgetProps {
  accountId: string;
}

export default function BreakEvenConfigWidget({ accountId }: BreakEvenConfigWidgetProps) {
  const [autoBePips, setAutoBePips] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, [accountId]);

  const fetchConfig = async () => {
    try {
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (account) {
        const acc = account as any;
        const pips = acc.auto_be_pips || 0;
        setAutoBePips(pips);
        setIsEnabled(pips > 0);
      }
    } catch (err) {
      console.error('Error fetching break-even config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const pipsToSave = isEnabled ? autoBePips : 0;

      const { error } = await supabase
        .from('user_prop_accounts')
        .update({ auto_be_pips: pipsToSave } as any)
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Break-even settings saved');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Auto Break-Even
          </CardTitle>
          {isEnabled ? (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              Active
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Disabled
            </span>
          )}
        </div>
        <CardDescription>
          Automatically move SL to entry after profit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="be-enabled">Enable Auto Break-Even</Label>
              <Switch
                id="be-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            {isEnabled && (
              <div className="space-y-2">
                <Label>Move to BE after (pips)</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={autoBePips}
                  onChange={(e) => setAutoBePips(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 20"
                />
                <p className="text-xs text-muted-foreground">
                  When price moves {autoBePips} pips in your favor, SL moves to entry
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isEnabled ? (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm">Move SL to break-even after</p>
                <p className="text-2xl font-bold text-primary">{autoBePips} pips</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Auto break-even is disabled. Enable to protect profits automatically.
              </p>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
