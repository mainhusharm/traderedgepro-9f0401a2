import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Mail, User, Clock, CheckCircle, XCircle, 
  Loader2, RefreshCw, Send, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

interface PropFirmRequest {
  id: string;
  user_name: string;
  user_email: string;
  prop_firm_name: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  admin_notes: string | null;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'working_on_it', label: 'Working On It', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'denied', label: 'Denied', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const AdminPropFirmRequestsTab = () => {
  const [requests, setRequests] = useState<PropFirmRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from('prop_firm_requests' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setRequests((data || []) as PropFirmRequest[]);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    setUpdatingId(requestId);
    try {
      // Update status in database
      const { error: updateError } = await (supabase
        .from('prop_firm_requests' as any)
        .update({ 
          status: newStatus,
          responded_at: new Date().toISOString()
        } as any)
        .eq('id', requestId) as any);

      if (updateError) throw updateError;

      // If delivered, send email notification
      if (newStatus === 'delivered') {
        const { error: emailError } = await callEdgeFunction('send-prop-firm-delivered', {
          userEmail: request.user_email,
          userName: request.user_name,
          propFirmName: request.prop_firm_name,
        });

        if (emailError) {
          console.error('Email error:', emailError);
          toast.warning('Status updated but email failed to send');
        } else {
          toast.success(`Status updated & email sent to ${request.user_email}`);
        }
      } else {
        toast.success('Status updated successfully');
      }

      // Refresh list
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge variant="outline" className={`${option.color} border`}>
        {option.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'working_on_it':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const workingCount = requests.filter(r => r.status === 'working_on_it').length;
  const deliveredCount = requests.filter(r => r.status === 'delivered').length;
  const deniedCount = requests.filter(r => r.status === 'denied').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Prop Firm Requests</h2>
            <p className="text-sm text-muted-foreground">Manage affiliate partnership requests</p>
          </div>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{workingCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{deniedCount}</p>
                <p className="text-xs text-muted-foreground">Denied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No prop firm requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Request Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{request.prop_firm_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {request.user_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${request.user_email}`} className="hover:text-primary transition-colors">
                              {request.user_email}
                            </a>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 lg:shrink-0">
                      <Select
                        value={request.status}
                        onValueChange={(value) => handleStatusChange(request.id, value)}
                        disabled={updatingId === request.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          {updatingId === request.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Update status" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="working_on_it">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 text-blue-400" />
                              Working On It
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Delivered
                              <Send className="w-3 h-3 text-muted-foreground ml-1" />
                            </div>
                          </SelectItem>
                          <SelectItem value="denied">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-400" />
                              Denied
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status Info */}
                  {request.status === 'denied' && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Request denied: No affiliate option available for this prop firm</span>
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'delivered' && request.responded_at && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Delivered on {new Date(request.responded_at).toLocaleDateString()} - Email sent to user</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPropFirmRequestsTab;
