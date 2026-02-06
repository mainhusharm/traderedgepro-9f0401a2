import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Filter,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface RuleSubmission {
  id: string;
  user_id: string;
  prop_firm_name: string;
  prop_firm_id: string | null;
  rule_type: string;
  rule_field: string;
  rule_value: string;
  supporting_evidence: string | null;
  screenshot_url: string | null;
  status: string;
  reviewed_by: string | null;
  review_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export default function RuleSubmissionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<RuleSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['rule-submissions', statusFilter],
    queryFn: async () => {
      // Use any type to bypass strict typing for new tables
      const client = supabase as any;
      let query = client
        .from('user_submitted_rules')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RuleSubmission[];
    },
  });

  const handleApprove = async (submission: RuleSubmission) => {
    setIsProcessing(true);
    const client = supabase as any;
    
    try {
      // 1. Update the submission status
      const { error: updateError } = await client
        .from('user_submitted_rules')
        .update({
          status: 'approved',
          reviewed_by: 'admin',
          review_notes: reviewNotes || 'Approved and added to database',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // 2. Update the prop_firm_rules table if we have a firm ID
      if (submission.prop_firm_id) {
        // Get the current rules
        const { data: existingRules } = await supabase
          .from('prop_firm_rules')
          .select('*')
          .eq('prop_firm_id', submission.prop_firm_id)
          .eq('is_current', true)
          .maybeSingle();

        if (existingRules) {
          // Build the update object dynamically
          const updateObj: Record<string, any> = {};
          
          // Handle different field types
          const field = submission.rule_field;
          let value: any = submission.rule_value;
          
          // Parse boolean values
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Parse numeric values for known numeric fields
          else if (['consistency_rule_percent', 'max_position_size', 'max_open_trades', 
                   'max_open_lots', 'min_stop_loss_pips', 'payout_split', 
                   'first_payout_delay', 'inactivity_rule_days', 'reset_fee',
                   'max_daily_loss_percent', 'max_total_drawdown_percent', 
                   'profit_target_percent', 'max_leverage'].includes(field)) {
            value = parseFloat(value);
          }
          // Parse JSON arrays
          else if (['prohibited_instruments', 'prohibited_strategies'].includes(field)) {
            value = submission.rule_value.split(',').map((s: string) => s.trim());
          }

          updateObj[field] = value;
          updateObj['updated_at'] = new Date().toISOString();

          const { error: rulesError } = await client
            .from('prop_firm_rules')
            .update(updateObj)
            .eq('id', existingRules.id);

          if (rulesError) {
            console.error('Error updating prop_firm_rules:', rulesError);
          }

          // Log the change using any type
          await (supabase as any).from('prop_firm_rule_changes').insert({
            prop_firm_id: submission.prop_firm_id,
            change_type: 'field_updated',
            field_name: field,
            old_value: String((existingRules as any)[field] || 'null'),
            new_value: String(value),
          });
        }
      }

      toast({
        title: 'Rule Approved',
        description: 'The rule has been approved and added to the database.',
      });

      queryClient.invalidateQueries({ queryKey: ['rule-submissions'] });
      setSelectedSubmission(null);
      setReviewNotes('');

    } catch (error: any) {
      console.error('Error approving rule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve rule',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (submission: RuleSubmission) => {
    if (!reviewNotes) {
      toast({
        title: 'Review Notes Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const client = supabase as any;
    
    try {
      const { error } = await client
        .from('user_submitted_rules')
        .update({
          status: 'rejected',
          reviewed_by: 'admin',
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: 'Rule Rejected',
        description: 'The submission has been rejected.',
      });

      queryClient.invalidateQueries({ queryKey: ['rule-submissions'] });
      setSelectedSubmission(null);
      setReviewNotes('');

    } catch (error: any) {
      console.error('Error rejecting rule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject rule',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consistency: 'Consistency Rule',
      hidden: 'Hidden Restriction',
      correction: 'Rule Correction',
      missing: 'Missing Rule',
    };
    return labels[type] || type;
  };

  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rule Submissions</h2>
          <p className="text-muted-foreground">
            Review user-submitted prop firm rules
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-500 text-white px-3 py-1 text-base">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading submissions...</div>
      ) : submissions?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No {statusFilter === 'all' ? '' : statusFilter} submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions?.map((submission) => (
            <Card key={submission.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{submission.prop_firm_name}</span>
                      {getStatusBadge(submission.status)}
                      <Badge variant="secondary">{getRuleTypeLabel(submission.rule_type)}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Field:</span>{' '}
                        <span className="font-medium">{submission.rule_field.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>{' '}
                        <span className="font-medium font-mono bg-muted px-2 py-0.5 rounded">
                          {submission.rule_value}
                        </span>
                      </div>
                    </div>

                    {submission.supporting_evidence && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <a 
                          href={submission.supporting_evidence} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-md"
                        >
                          {submission.supporting_evidence}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {submission.user_id.slice(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>

                    {submission.review_notes && (
                      <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{submission.review_notes}</span>
                      </div>
                    )}
                  </div>

                  {submission.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Rule Submission</DialogTitle>
            <DialogDescription>
              Review and approve or reject this user-submitted rule
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Prop Firm</p>
                  <p className="font-semibold">{selectedSubmission.prop_firm_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{getRuleTypeLabel(selectedSubmission.rule_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Field</p>
                  <p className="font-medium">{selectedSubmission.rule_field.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value</p>
                  <p className="font-mono bg-background px-2 py-1 rounded">{selectedSubmission.rule_value}</p>
                </div>
              </div>

              {selectedSubmission.supporting_evidence && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <a 
                    href={selectedSubmission.supporting_evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedSubmission.supporting_evidence}
                  </a>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision (required for rejection)"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedSubmission)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Update DB
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
