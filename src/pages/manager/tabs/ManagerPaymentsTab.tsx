import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Save,
  X,
  Wallet,
  Building,
  Bitcoin,
  History,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AgentSalary {
  id: string;
  agent_id: string;
  salary_amount: number;
  currency: string;
  payment_status: string;
  payment_method_requested: boolean;
  payment_method_requested_at: string | null;
  agent?: {
    id: string;
    name: string | null;
    email: string;
    is_online: boolean;
  };
  payment_methods?: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  method_type: string;
  is_primary: boolean;
  details: Record<string, any>;
  verified: boolean;
}

interface PaymentHistory {
  id: string;
  agent_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  agent?: {
    name: string | null;
    email: string;
  };
}

const ManagerPaymentsTab = () => {
  const { callManagerApi } = useManagerApi();
  const [salaries, setSalaries] = useState<AgentSalary[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editedSalary, setEditedSalary] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('salaries');
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState<AgentSalary | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [viewPaymentMethods, setViewPaymentMethods] = useState<AgentSalary | null>(null);

  useEffect(() => {
    fetchSalaries();
    fetchPaymentHistory();
  }, []);

  const fetchSalaries = async () => {
    const response = await callManagerApi('get_agent_salaries');
    if (response?.success) {
      setSalaries(response.salaries || []);
    }
    setIsLoading(false);
  };

  const fetchPaymentHistory = async () => {
    const response = await callManagerApi('get_payment_history');
    if (response?.success) {
      setPaymentHistory(response.payments || []);
    }
  };

  const handleUpdateSalary = async (agentId: string) => {
    if (!editedSalary || isNaN(parseFloat(editedSalary))) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    setIsSaving(true);
    const response = await callManagerApi('update_agent_salary', {
      agentId,
      salaryAmount: parseFloat(editedSalary)
    });

    if (response?.success) {
      toast.success('Salary updated successfully');
      setEditingAgent(null);
      fetchSalaries();
    } else {
      toast.error('Failed to update salary');
    }
    setIsSaving(false);
  };

  const handleRequestPaymentMethod = async (agentId: string) => {
    const response = await callManagerApi('request_payment_method', { agentId });
    if (response?.success) {
      toast.success('Payment method request sent to agent');
      fetchSalaries();
    } else {
      toast.error('Failed to request payment method');
    }
  };

  const handleProcessPayment = async () => {
    if (!confirmPaymentDialog) return;

    setIsProcessingPayment(true);
    const response = await callManagerApi('process_salary_payment', {
      agentId: confirmPaymentDialog.agent_id,
      salaryId: confirmPaymentDialog.id,
      transactionReference: transactionRef,
      notes: paymentNotes
    });

    if (response?.success) {
      toast.success('Payment processed successfully');
      setConfirmPaymentDialog(null);
      setPaymentNotes('');
      setTransactionRef('');
      fetchSalaries();
      fetchPaymentHistory();
    } else {
      toast.error('Failed to process payment');
    }
    setIsProcessingPayment(false);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building className="w-4 h-4" />;
      case 'crypto':
        return <Bitcoin className="w-4 h-4" />;
      case 'paypal':
        return <Wallet className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agent Payments</h2>
          <p className="text-sm text-muted-foreground">Manage agent salaries and process payments</p>
        </div>
        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
          {salaries.length} Agents
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payroll</p>
              <p className="text-xl font-bold">
                ${salaries.reduce((sum, s) => sum + (s.salary_amount || 0), 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Methods Set</p>
              <p className="text-xl font-bold">
                {salaries.filter(s => s.payment_methods && s.payment_methods.length > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awaiting Setup</p>
              <p className="text-xl font-bold">
                {salaries.filter(s => s.payment_method_requested && (!s.payment_methods || s.payment_methods.length === 0)).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payments Made</p>
              <p className="text-xl font-bold">{paymentHistory.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="salaries" className="data-[state=active]:bg-purple-500/20">
            <Users className="w-4 h-4 mr-2" />
            Salaries
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20">
            <History className="w-4 h-4 mr-2" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* Salaries Tab */}
        <TabsContent value="salaries" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salaries.map((salary, index) => {
              const hasPaymentMethod = salary.payment_methods && salary.payment_methods.length > 0;
              const primaryMethod = salary.payment_methods?.find(m => m.is_primary);
              
              return (
                <motion.div
                  key={salary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-card/50 border-white/5 hover:border-purple-500/20 transition-colors">
                    <CardContent className="p-4 space-y-4">
                      {/* Agent Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">{salary.agent?.name || 'Unnamed Agent'}</p>
                            <p className="text-xs text-muted-foreground">{salary.agent?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Salary */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        {editingAgent === salary.agent_id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">$</span>
                            <Input
                              type="number"
                              value={editedSalary}
                              onChange={(e) => setEditedSalary(e.target.value)}
                              className="bg-white/5 border-white/10 h-8"
                              placeholder="0.00"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateSalary(salary.agent_id)}
                              disabled={isSaving}
                            >
                              <Save className="w-4 h-4 text-green-400" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingAgent(null)}
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly Salary</p>
                              <p className="text-2xl font-bold">${salary.salary_amount?.toLocaleString() || '0'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingAgent(salary.agent_id);
                                setEditedSalary(salary.salary_amount?.toString() || '');
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Status */}
                      <div className="space-y-2">
                        {hasPaymentMethod ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(primaryMethod?.method_type || '')}
                              <span className="text-sm capitalize">{primaryMethod?.method_type?.replace('_', ' ') || 'Unknown'}</span>
                              {primaryMethod?.verified && (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewPaymentMethods(salary)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : salary.payment_method_requested ? (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Awaiting agent setup</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-purple-500/30 hover:bg-purple-500/10"
                            onClick={() => handleRequestPaymentMethod(salary.agent_id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Request Payment Method
                          </Button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {hasPaymentMethod && salary.salary_amount > 0 && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-500"
                          onClick={() => setConfirmPaymentDialog(salary)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Process Payment
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {salaries.length === 0 && (
            <Card className="bg-card/50 border-white/5">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No agents found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="bg-card/50 border-white/5">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Agent</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reference</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white/5">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{payment.agent?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{payment.agent?.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-bold">${payment.amount.toLocaleString()}</td>
                        <td className="p-4">{getStatusBadge(payment.status)}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {payment.transaction_reference || '-'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                    {paymentHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No payment history yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Payment Dialog */}
      <Dialog open={!!confirmPaymentDialog} onOpenChange={() => setConfirmPaymentDialog(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Process Payment
            </DialogTitle>
            <DialogDescription>
              You are about to process a salary payment for {confirmPaymentDialog?.agent?.name || 'this agent'}.
            </DialogDescription>
          </DialogHeader>
          
          {confirmPaymentDialog && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Payment Amount</p>
                <p className="text-3xl font-bold text-green-400">
                  ${confirmPaymentDialog.salary_amount?.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Transaction Reference (Optional)</Label>
                <Input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Enter transaction ID or reference"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes for this payment"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmPaymentDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-500"
                  onClick={handleProcessPayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Payment Methods Dialog */}
      <Dialog open={!!viewPaymentMethods} onOpenChange={() => setViewPaymentMethods(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Payment Methods
            </DialogTitle>
            <DialogDescription>
              {viewPaymentMethods?.agent?.name || 'Agent'}'s registered payment methods
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {viewPaymentMethods?.payment_methods?.map((method) => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border ${
                  method.is_primary ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(method.method_type)}
                    <span className="font-medium capitalize">{method.method_type.replace('_', ' ')}</span>
                    {method.is_primary && (
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  {method.verified && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {method.method_type === 'bank_transfer' && method.details && (
                    <div className="space-y-1">
                      <p>Bank: {method.details.bank_name || 'Not provided'}</p>
                      <p>Account: •••• {method.details.account_number?.slice(-4) || '****'}</p>
                    </div>
                  )}
                  {method.method_type === 'crypto' && method.details && (
                    <div className="space-y-1">
                      <p>Network: {method.details.network || 'Not provided'}</p>
                      <p>Address: {method.details.address?.slice(0, 8)}...{method.details.address?.slice(-6) || '****'}</p>
                    </div>
                  )}
                  {method.method_type === 'paypal' && method.details && (
                    <p>Email: {method.details.email || 'Not provided'}</p>
                  )}
                </div>
              </div>
            ))}
            
            {(!viewPaymentMethods?.payment_methods || viewPaymentMethods.payment_methods.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                No payment methods registered
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerPaymentsTab;
