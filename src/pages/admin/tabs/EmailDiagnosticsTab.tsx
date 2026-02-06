import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  Send,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAdminApi } from '@/hooks/useAdminApi';
import { toast } from 'sonner';
import { format, subDays, startOfDay } from 'date-fns';
import EmailTemplatePreview from '@/components/admin/EmailTemplatePreview';

interface EmailLog {
  id: string;
  resend_id: string | null;
  to_email: string;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

const EmailDiagnosticsTab = () => {
  const { callAdminApi } = useAdminApi();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0
  });

  const fetchEmailLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_email_logs', { 
        page: 1, 
        limit: 200,
        status: statusFilter === 'all' ? undefined : statusFilter,
        email_type: typeFilter === 'all' ? undefined : typeFilter
      });

      const emailLogs = (result.logs || []) as EmailLog[];
      setLogs(emailLogs);

      // Calculate stats
      const newStats: EmailStats = {
        total: emailLogs.length,
        sent: emailLogs.filter(l => l.status === 'sent').length,
        delivered: emailLogs.filter(l => l.status === 'delivered').length,
        failed: emailLogs.filter(l => l.status === 'failed').length,
        pending: emailLogs.filter(l => l.status === 'pending').length
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      toast.error('Failed to fetch email logs');
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi, statusFilter, typeFilter]);

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success/10 text-success border-success"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'sent':
        return <Badge className="bg-primary/10 text-primary border-primary"><Send className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge className="bg-risk/10 text-risk border-risk"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'payment_verified': 'Payment Verified',
      'payment_rejected': 'Payment Rejected',
      'welcome': 'Welcome',
      'signal_notification': 'Signal',
      'guidance_notification': 'Guidance',
      'milestone_notification': 'Milestone',
      'badge_notification': 'Badge',
      'booking_confirmation': 'Booking',
      'mt5_license': 'MT5 License',
      'mt5_order_update': 'MT5 Order',
      'performance_report': 'Performance',
      'weekly_digest': 'Weekly Digest'
    };
    return labels[type] || type;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resend_id && log.resend_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.email_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueTypes = [...new Set(logs.map(l => l.email_type))];

  // Calculate delivery rate
  const deliveryRate = stats.total > 0 
    ? ((stats.delivered / stats.total) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 text-center">
            <Mail className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Emails</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Send className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">{stats.sent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto text-success mb-1" />
            <p className="text-2xl font-bold text-success">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-risk/5 border-risk/20">
          <CardContent className="p-4 text-center">
            <XCircle className="w-5 h-5 mx-auto text-risk mb-1" />
            <p className="text-2xl font-bold text-risk">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-success/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{deliveryRate}%</p>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs Table */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Delivery Logs
              </CardTitle>
              <CardDescription>Track Resend email delivery status and troubleshoot issues</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEmailLogs}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, subject, or Resend ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{getEmailTypeLabel(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No email logs found</p>
              <p className="text-sm mt-1">Emails will appear here once sent through the system</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resend ID</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.to_email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getEmailTypeLabel(log.email_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.resend_id ? (
                          <code className="text-xs bg-white/5 px-2 py-1 rounded">
                            {log.resend_id.slice(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Error Summary */}
          {stats.failed > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-risk/5 border border-risk/20">
              <h4 className="font-semibold text-risk flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Recent Failures ({stats.failed})
              </h4>
              <div className="space-y-2">
                {logs
                  .filter(l => l.status === 'failed')
                  .slice(0, 3)
                  .map((log) => (
                    <div key={log.id} className="text-sm p-2 rounded bg-white/5">
                      <p className="font-medium">{log.to_email}</p>
                      <p className="text-xs text-muted-foreground">{log.error_message || 'Unknown error'}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Template Preview */}
      <EmailTemplatePreview />
    </div>
  );
};

export default EmailDiagnosticsTab;
