import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Mail,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
  RefreshCw,
  Send,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type EmailTemplate = 'signal' | 'vip_signal' | 'milestone' | 'badge' | 'performance_report' | 'welcome' | 'booking_confirmation';

interface TemplateData {
  signal?: {
    symbol: string;
    signal_type: 'BUY' | 'SELL';
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    ai_reasoning?: string;
  };
  milestone?: {
    name: string;
    description: string;
    achievement_date: string;
  };
  badge?: {
    name: string;
    description: string;
    icon: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

const defaultData: Record<EmailTemplate, TemplateData> = {
  signal: {
    signal: {
      symbol: 'EURUSD',
      signal_type: 'BUY',
      entry_price: 1.0850,
      stop_loss: 1.0800,
      take_profit: 1.0950,
      ai_reasoning: 'Strong bullish momentum with support at 1.0800 level. RSI showing oversold conditions.'
    },
    user: { name: 'John Trader', email: 'john@example.com' }
  },
  vip_signal: {
    signal: {
      symbol: 'XAUUSD',
      signal_type: 'SELL',
      entry_price: 2050.00,
      stop_loss: 2075.00,
      take_profit: 2000.00,
      ai_reasoning: 'Gold showing weakness at resistance. Multiple expert confirmations on bearish setup.'
    },
    user: { name: 'VIP Trader', email: 'vip@example.com' }
  },
  milestone: {
    milestone: {
      name: 'First Profitable Week',
      description: 'Congratulations! You\'ve completed your first profitable trading week.',
      achievement_date: new Date().toISOString()
    },
    user: { name: 'John Trader', email: 'john@example.com' }
  },
  badge: {
    badge: {
      name: 'Risk Master',
      description: 'You\'ve maintained disciplined risk management for 30 consecutive trades.',
      icon: '🛡️'
    },
    user: { name: 'John Trader', email: 'john@example.com' }
  },
  performance_report: {
    user: { name: 'John Trader', email: 'john@example.com' }
  },
  welcome: {
    user: { name: 'New Trader', email: 'newtrader@example.com' }
  },
  booking_confirmation: {
    user: { name: 'John Trader', email: 'john@example.com' }
  }
};

const templateDescriptions: Record<EmailTemplate, string> = {
  signal: 'Standard trading signal notification',
  vip_signal: 'VIP signal with expert review badge',
  milestone: 'Trading milestone achievement',
  badge: 'Badge unlock celebration',
  performance_report: 'Weekly/Monthly performance report',
  welcome: 'New user welcome email',
  booking_confirmation: 'Guidance session booking confirmation'
};

const EmailTemplatePreview = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('signal');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [templateData, setTemplateData] = useState<TemplateData>(defaultData.signal);

  const handleTemplateChange = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateData(defaultData[template]);
  };

  const renderSignalEmail = (isVip = false) => {
    const signal = templateData.signal!;
    const signalColor = signal.signal_type === 'BUY' ? '#22c55e' : '#ef4444';
    const signalIcon = signal.signal_type === 'BUY' ? '📈' : '📉';
    const vipBadge = isVip ? '⭐ VIP ' : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            ${isVip ? `<div style="text-align: center; margin-bottom: 16px;"><span style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: #000; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">⭐ VIP SIGNAL</span></div>` : ''}
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">${signalIcon} ${vipBadge}New Trading Signal</h1>
              <p style="color: #a0a0a0; font-size: 16px; margin: 0;">A new signal has been posted</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid ${signalColor};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">${signal.symbol}</span>
                <span style="background: ${signalColor}; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;">${signal.signal_type}</span>
              </div>
              
              <table style="width: 100%; color: #ffffff;">
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0;">Entry Price</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${signal.entry_price}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0;">Stop Loss</td>
                  <td style="padding: 8px 0; text-align: right; color: #ef4444; font-weight: bold;">${signal.stop_loss}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0;">Take Profit</td>
                  <td style="padding: 8px 0; text-align: right; color: #22c55e; font-weight: bold;">${signal.take_profit}</td>
                </tr>
              </table>
              
              ${signal.ai_reasoning ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px 0;">ANALYSIS</p>
                <p style="color: #ffffff; font-size: 14px; margin: 0;">${signal.ai_reasoning}</p>
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View in Dashboard
              </a>
            </div>
          </div>
          
          <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 24px;">
            You received this because you have signal notifications enabled.<br>
            <a href="#" style="color: #6366f1;">Manage preferences</a>
          </p>
        </div>
      </body>
      </html>
    `;
  };

  const renderMilestoneEmail = () => {
    const milestone = templateData.milestone!;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎯</div>
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">Milestone Achieved!</h1>
            <p style="color: #22c55e; font-size: 20px; font-weight: bold; margin: 16px 0;">${milestone.name}</p>
            <p style="color: #a0a0a0; font-size: 16px; margin: 0 0 32px 0;">${milestone.description}</p>
            
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Achievement
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const renderBadgeEmail = () => {
    const badge = templateData.badge!;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">${badge.icon}</div>
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">Badge Unlocked!</h1>
            <p style="color: #a855f7; font-size: 20px; font-weight: bold; margin: 16px 0;">${badge.name}</p>
            <p style="color: #a0a0a0; font-size: 16px; margin: 0 0 32px 0;">${badge.description}</p>
            
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View All Badges
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getEmailHtml = () => {
    switch (selectedTemplate) {
      case 'signal':
        return renderSignalEmail(false);
      case 'vip_signal':
        return renderSignalEmail(true);
      case 'milestone':
        return renderMilestoneEmail();
      case 'badge':
        return renderBadgeEmail();
      default:
        return renderSignalEmail(false);
    }
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile':
        return 375;
      case 'tablet':
        return 768;
      default:
        return '100%';
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);
    try {
      // Here you would call your edge function to send a test email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-card/50 border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email Template Preview</CardTitle>
              <CardDescription>Preview and test email templates before sending</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggles */}
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <Button
                variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('desktop')}
                className="h-8 w-8"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('tablet')}
                className="h-8 w-8"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('mobile')}
                className="h-8 w-8"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selector */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Select Template</Label>
            <Select value={selectedTemplate} onValueChange={(v) => handleTemplateChange(v as EmailTemplate)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signal">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Signal Notification
                  </div>
                </SelectItem>
                <SelectItem value="vip_signal">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    VIP Signal Notification
                  </div>
                </SelectItem>
                <SelectItem value="milestone">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-success" />
                    Milestone Achievement
                  </div>
                </SelectItem>
                <SelectItem value="badge">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Badge Unlock
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {templateDescriptions[selectedTemplate]}
            </p>
          </div>

          <div>
            <Label>Send Test Email</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSendTest} disabled={isSending}>
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <Badge variant="outline" className="text-xs">
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Preview
            </Badge>
          </div>
          <div className="flex justify-center p-4 bg-muted/20 min-h-[500px]">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{ width: getPreviewWidth() }}
              className="bg-[#0a0a0a] overflow-auto max-h-[600px] rounded-lg shadow-2xl"
            >
              <iframe
                srcDoc={getEmailHtml()}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplatePreview;