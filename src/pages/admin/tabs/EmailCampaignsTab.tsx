import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { callEdgeFunction } from '@/config/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Eye, 
  Trash2,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  target_plans: string[];
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const PLAN_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'Starter', label: 'Starter Plan' },
  { value: 'Pro', label: 'Pro Plan' },
  { value: 'Enterprise', label: 'Enterprise Plan' },
];

const EMAIL_TEMPLATES = [
  {
    id: 'update',
    name: 'Platform Update',
    subject: '🚀 New Features Available!',
    html: `<h1>Exciting Updates!</h1>
<p>Hi {{first_name}},</p>
<p>We've just released some amazing new features that will help you trade smarter.</p>
<ul>
  <li>New AI-powered analysis</li>
  <li>Improved signal accuracy</li>
  <li>Enhanced risk management tools</li>
</ul>
<p>Log in now to explore!</p>
<p>Best,<br>The Team</p>`,
  },
  {
    id: 'promo',
    name: 'Special Offer',
    subject: '🎉 Exclusive Offer Just for You!',
    html: `<h1>Special Offer!</h1>
<p>Hi {{first_name}},</p>
<p>As a valued member of our {{plan_name}} plan, we're offering you an exclusive discount!</p>
<p>Upgrade now and save 20% on your next renewal.</p>
<p>Use code: <strong>UPGRADE20</strong></p>
<p>Hurry, this offer expires soon!</p>`,
  },
  {
    id: 'newsletter',
    name: 'Weekly Newsletter',
    subject: '📊 Your Weekly Trading Digest',
    html: `<h1>Weekly Digest</h1>
<p>Hi {{first_name}},</p>
<p>Here's your weekly summary of market insights and trading opportunities.</p>
<h2>Top Signals This Week</h2>
<p>[Signal summary goes here]</p>
<h2>Market Overview</h2>
<p>[Market overview goes here]</p>
<p>Happy Trading!</p>`,
  },
];

const EmailCampaignsTab = () => {
  const { user } = useAuth();
  const { callAdminApi } = useAdminApi();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [targetPlan, setTargetPlan] = useState('all');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_email_campaigns');
      setCampaigns(result.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    estimateRecipients();
  }, [targetPlan]);

  const estimateRecipients = async () => {
    try {
      const result = await callAdminApi('estimate_recipients', { plan: targetPlan });
      setRecipientCount(result.count || 0);
    } catch (error) {
      console.error('Error estimating recipients:', error);
      setRecipientCount(null);
    }
  };

  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.subject);
    setHtmlContent(template.html);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleCreateCampaign = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      await callAdminApi('create_email_campaign', {
        name,
        subject,
        html_content: htmlContent,
        target_plans: targetPlan === 'all' ? [] : [targetPlan],
      });

      toast.success('Campaign created as draft');
      setShowCreateDialog(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await callEdgeFunction('send-email-campaign', { campaign_id: campaignId });

      if (error) throw error;

      toast.success(`Campaign sent to ${data.sent_count} recipients!`);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.message || 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await callAdminApi('delete_email_campaign', { campaignId });

      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.message || 'Failed to delete campaign');
    }
  };

  const resetForm = () => {
    setName('');
    setSubject('');
    setHtmlContent('');
    setTargetPlan('all');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Sending</Badge>;
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-400">Sent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const stats = {
    total: campaigns.length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    sent: campaigns.filter((c) => c.status === 'sent').length,
    totalEmails: campaigns.reduce((acc, c) => acc + c.sent_count, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Campaigns
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and send email campaigns to your users (like Mailchimp)
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Compose a new email campaign to send to your users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex gap-2 flex-wrap">
                  {EMAIL_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="e.g., January Newsletter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={targetPlan} onValueChange={setTargetPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Subject *</Label>
                <Input
                  placeholder="Enter email subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Content (HTML) *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewHtml(htmlContent)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <Textarea
                  placeholder="Enter HTML email content..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{first_name}}'}, {'{{plan_name}}'} for personalization
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {recipientCount !== null ? (
                    <span>Estimated recipients: <strong className="text-foreground">{recipientCount}</strong></span>
                  ) : (
                    <span>Calculating...</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCampaign} 
                    disabled={isSending || !name.trim() || !subject.trim() || !htmlContent.trim()}
                  >
                    {isSending ? 'Creating...' : 'Create Draft'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Emails Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalEmails}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Manage your email campaigns</CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No campaigns found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      {getStatusBadge(campaign.status)}
                      {campaign.target_plans.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {campaign.target_plans.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Subject: {campaign.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {campaign.status === 'sent' && (
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-4 h-4" />
                          {campaign.sent_count} sent
                        </div>
                        {campaign.failed_count > 0 && (
                          <div className="flex items-center gap-1 text-risk">
                            <XCircle className="w-3 h-3" />
                            {campaign.failed_count} failed
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewHtml(campaign.html_content)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={isSending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-risk hover:text-risk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div 
            className="bg-white text-black p-6 rounded-lg"
            dangerouslySetInnerHTML={{ __html: previewHtml || '' }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailCampaignsTab;
