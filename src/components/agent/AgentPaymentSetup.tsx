import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Building, 
  Bitcoin, 
  Wallet,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  method_type: string;
  is_primary: boolean;
  details: Record<string, any>;
  verified: boolean;
}

interface AgentPaymentSetupProps {
  agentId: string;
}

const PAYMENT_TYPES = [
  { 
    id: 'bank_transfer', 
    label: 'Bank Transfer', 
    icon: Building,
    description: 'Receive payments directly to your bank account'
  },
  { 
    id: 'crypto', 
    label: 'Cryptocurrency', 
    icon: Bitcoin,
    description: 'Receive payments in USDT, USDC, or other crypto'
  },
  { 
    id: 'paypal', 
    label: 'PayPal', 
    icon: Wallet,
    description: 'Receive payments to your PayPal account'
  },
];

const CRYPTO_NETWORKS = ['TRC20 (Tron)', 'ERC20 (Ethereum)', 'BEP20 (BSC)', 'Solana', 'Polygon'];

const AgentPaymentSetup = ({ agentId }: AgentPaymentSetupProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [paymentRequested, setPaymentRequested] = useState(false);

  // Form states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
    checkPaymentRequested();
  }, [agentId]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_payment_methods')
        .select('*')
        .eq('agent_id', agentId);

      if (error) throw error;
      setPaymentMethods((data || []).map(pm => ({
        ...pm,
        details: (pm.details || {}) as Record<string, any>
      })));
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentRequested = async () => {
    try {
      const { data } = await supabase
        .from('agent_salaries')
        .select('payment_method_requested')
        .eq('agent_id', agentId)
        .single();

      setPaymentRequested(!!data?.payment_method_requested);
    } catch (err) {
      // Ignore - might not have salary record yet
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!selectedType) {
      toast.error('Please select a payment method type');
      return;
    }

    let details: Record<string, any> = {};

    if (selectedType === 'bank_transfer') {
      if (!bankName || !accountNumber || !accountName) {
        toast.error('Please fill in all required bank details');
        return;
      }
      details = { bank_name: bankName, account_number: accountNumber, routing_number: routingNumber, account_name: accountName };
    } else if (selectedType === 'crypto') {
      if (!cryptoNetwork || !cryptoAddress) {
        toast.error('Please fill in all required crypto details');
        return;
      }
      details = { network: cryptoNetwork, address: cryptoAddress };
    } else if (selectedType === 'paypal') {
      if (!paypalEmail) {
        toast.error('Please enter your PayPal email');
        return;
      }
      details = { email: paypalEmail };
    }

    setIsSaving(true);
    try {
      const isPrimary = paymentMethods.length === 0;
      
      const { error } = await supabase
        .from('agent_payment_methods')
        .insert({
          agent_id: agentId,
          method_type: selectedType,
          details,
          is_primary: isPrimary,
        });

      if (error) throw error;

      toast.success('Payment method added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error adding payment method:', err);
      toast.error('Failed to add payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async (methodId: string) => {
    try {
      // Unset all as primary
      await supabase
        .from('agent_payment_methods')
        .update({ is_primary: false })
        .eq('agent_id', agentId);

      // Set selected as primary
      await supabase
        .from('agent_payment_methods')
        .update({ is_primary: true })
        .eq('id', methodId);

      toast.success('Primary payment method updated');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting primary:', err);
      toast.error('Failed to update primary method');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      await supabase
        .from('agent_payment_methods')
        .delete()
        .eq('id', methodId);

      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (err) {
      console.error('Error deleting method:', err);
      toast.error('Failed to remove payment method');
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setBankName('');
    setAccountNumber('');
    setRoutingNumber('');
    setAccountName('');
    setCryptoNetwork('');
    setCryptoAddress('');
    setPaypalEmail('');
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building className="w-5 h-5" />;
      case 'crypto':
        return <Bitcoin className="w-5 h-5" />;
      case 'paypal':
        return <Wallet className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-white/5">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Don't show if payment not requested and no methods exist
  if (!paymentRequested && paymentMethods.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Set up how you want to receive your salary payments
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentRequested && paymentMethods.length === 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Payment Method Required</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your manager has requested you to set up a payment method to receive your salary.
              </p>
            </div>
          )}

          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    method.is_primary 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        {getPaymentMethodIcon(method.method_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">
                            {method.method_type.replace('_', ' ')}
                          </p>
                          {method.is_primary && (
                            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                          {method.verified && (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.method_type === 'bank_transfer' && (
                            <>Bank: {method.details.bank_name} • •••• {method.details.account_number?.slice(-4)}</>
                          )}
                          {method.method_type === 'crypto' && (
                            <>{method.details.network} • {method.details.address?.slice(0, 8)}...{method.details.address?.slice(-6)}</>
                          )}
                          {method.method_type === 'paypal' && (
                            <>{method.details.email}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_primary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetPrimary(method.id)}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeleteMethod(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !paymentRequested && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No payment methods set up yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Add Payment Method
            </DialogTitle>
            <DialogDescription>
              Choose how you want to receive your salary payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Type Selection */}
            <RadioGroup value={selectedType} onValueChange={setSelectedType}>
              <div className="grid gap-3">
                {PAYMENT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedType === type.id
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <RadioGroupItem value={type.id} id={type.id} />
                    <div className="p-2 rounded-lg bg-white/10">
                      <type.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>

            {/* Bank Transfer Form */}
            {selectedType === 'bank_transfer' && (
              <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-2">
                  <Label>Account Holder Name *</Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full name as on bank account"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase, Bank of America"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Routing Number</Label>
                    <Input
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="Optional"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Crypto Form */}
            {selectedType === 'crypto' && (
              <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-2">
                  <Label>Network *</Label>
                  <select
                    value={cryptoNetwork}
                    onChange={(e) => setCryptoNetwork(e.target.value)}
                    className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm"
                  >
                    <option value="">Select network</option>
                    {CRYPTO_NETWORKS.map((network) => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Wallet Address *</Label>
                  <Input
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400">
                    ⚠️ Make sure the wallet address matches the selected network. Incorrect addresses may result in permanent loss of funds.
                  </p>
                </div>
              </div>
            )}

            {/* PayPal Form */}
            {selectedType === 'paypal' && (
              <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-2">
                  <Label>PayPal Email *</Label>
                  <Input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-500"
                onClick={handleAddPaymentMethod}
                disabled={isSaving || !selectedType}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add Payment Method'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentPaymentSetup;
