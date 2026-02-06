import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Upload, ExternalLink, AlertCircle, Loader2, Shield, Star, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPaymentProps {
  amount: number;
  planName: string;
  onPaymentComplete: (transactionHash: string) => void;
  onBack: () => void;
  paymentId?: string; // Optional payment ID for auto-verification
}

const cryptoAddresses = {
  // Stablecoins (Recommended - No Volatility)
  USDT_TRC20: {
    address: 'TLcXZWVARKZn5sTpKjmNm5Cyo6NgH572ZG',
    name: 'USDT (TRC20)',
    network: 'Tron Network',
    networkCode: 'trc20',
    symbol: 'USDT',
    explorer: 'https://tronscan.org/#/transaction/',
    category: 'stablecoin',
    recommended: true,
    networkWarning: 'Only send USDT on TRON network (TRC20). Do NOT send ERC20 tokens.'
  },
  USDT_ERC20: {
    address: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
    name: 'USDT (ERC20)',
    network: 'Ethereum Mainnet',
    networkCode: 'erc20',
    symbol: 'USDT',
    explorer: 'https://etherscan.io/tx/',
    category: 'stablecoin',
    recommended: false,
    networkWarning: 'Higher gas fees. Consider using USDT TRC20 for lower fees.'
  },
  USDC: {
    address: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
    name: 'USDC',
    network: 'Ethereum Mainnet',
    networkCode: 'erc20',
    symbol: 'USDC',
    explorer: 'https://etherscan.io/tx/',
    category: 'stablecoin',
    recommended: false,
    networkWarning: 'Only send USDC on Ethereum Mainnet.'
  },
  // Cryptocurrencies
  ETH: {
    address: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
    name: 'Ethereum (ETH)',
    network: 'Ethereum Mainnet',
    networkCode: 'eth',
    symbol: 'ETH',
    explorer: 'https://etherscan.io/tx/',
    category: 'crypto',
    recommended: false,
    networkWarning: 'Only send ETH on Ethereum Mainnet.'
  },
  BTC: {
    address: 'bc1quht7k8fxwy8frc3gzpgn73kyxhuynxpt5ua2es',
    name: 'Bitcoin (BTC)',
    network: 'Bitcoin Mainnet',
    networkCode: 'btc',
    symbol: 'BTC',
    explorer: 'https://blockstream.info/tx/',
    category: 'crypto',
    recommended: false,
    networkWarning: 'Only send BTC on Bitcoin Mainnet. Do NOT send wrapped BTC.'
  },
  SOL: {
    address: 'GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3',
    name: 'Solana (SOL)',
    network: 'Solana Mainnet',
    networkCode: 'solana',
    symbol: 'SOL',
    explorer: 'https://solscan.io/tx/',
    category: 'crypto',
    recommended: false,
    networkWarning: 'Only send SOL on Solana Mainnet.'
  }
};

type CryptoKey = keyof typeof cryptoAddresses;

interface VerificationStatus {
  status: 'idle' | 'verifying' | 'confirmed' | 'pending' | 'failed' | 'not_found';
  message: string;
  confirmations?: number;
}

const CryptoPayment = ({ amount, planName, onPaymentComplete, onBack, paymentId }: CryptoPaymentProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoKey | null>(null);
  const [step, setStep] = useState<'select' | 'pay' | 'verify'>('select');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationData, setVerificationData] = useState({
    transactionHash: '',
    fromAddress: '',
    screenshot: null as File | null
  });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'idle',
    message: ''
  });

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCryptoSelect = (crypto: CryptoKey) => {
    setSelectedCrypto(crypto);
    setStep('pay');
  };

  // Automatic blockchain verification
  const handleAutoVerify = async () => {
    if (!verificationData.transactionHash.trim() || !selectedCrypto) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setVerificationStatus({ status: 'verifying', message: 'Checking blockchain...' });

    try {
      const crypto = cryptoAddresses[selectedCrypto];
      
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
        body: {
          paymentId: paymentId || null,
          transactionHash: verificationData.transactionHash,
          network: crypto.networkCode,
          expectedAmount: amount,
          expectedAddress: crypto.address
        }
      });

      if (error) throw error;

      if (data.verified) {
        setVerificationStatus({
          status: 'confirmed',
          message: data.message,
          confirmations: data.confirmations
        });
        toast.success('Payment verified automatically!');
        
        // If auto-verified, complete the payment
        if (paymentId) {
          onPaymentComplete(verificationData.transactionHash);
        }
      } else if (data.status === 'pending') {
        setVerificationStatus({
          status: 'pending',
          message: data.message,
          confirmations: data.confirmations
        });
        toast.info('Transaction found but pending confirmation');
      } else if (data.status === 'not_found') {
        setVerificationStatus({
          status: 'not_found',
          message: data.message
        });
        toast.warning('Transaction not found. It may take a few minutes to appear.');
      } else {
        setVerificationStatus({
          status: 'failed',
          message: data.message
        });
      }
    } catch (error: unknown) {
      console.error('Auto-verification error:', error);
      setVerificationStatus({
        status: 'failed',
        message: 'Automatic verification failed. Please submit for manual review.'
      });
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationData.transactionHash.trim()) {
      toast.error('Transaction hash is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store verification for admin review
      const verificationRecord = {
        crypto: selectedCrypto,
        address: selectedCrypto ? cryptoAddresses[selectedCrypto].address : '',
        transactionHash: verificationData.transactionHash,
        amount,
        planName,
        fromAddress: verificationData.fromAddress,
        timestamp: new Date().toISOString(),
        status: 'pending_verification',
        autoVerificationAttempted: verificationStatus.status !== 'idle',
        autoVerificationResult: verificationStatus.status
      };

      // In production, this would be sent to your backend
      const existing = JSON.parse(localStorage.getItem('crypto_pending_payments') || '[]');
      existing.push(verificationRecord);
      localStorage.setItem('crypto_pending_payments', JSON.stringify(existing));

      toast.success('Payment submitted for manual verification. You will receive confirmation within 24 hours.');
      onPaymentComplete(verificationData.transactionHash);
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group crypto by category
  const stablecoins = Object.entries(cryptoAddresses).filter(([_, c]) => c.category === 'stablecoin');
  const cryptos = Object.entries(cryptoAddresses).filter(([_, c]) => c.category === 'crypto');

  const getStatusIcon = () => {
    switch (verificationStatus.status) {
      case 'verifying':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'confirmed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'failed':
      case 'not_found':
        return <AlertCircle className="w-5 h-5 text-risk" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Zero Dispute Risk Badge */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
        <Shield className="w-5 h-5 text-success" />
        <span className="text-success font-medium">Zero Dispute Risk - Cryptocurrency payments cannot be reversed</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-center">Select Cryptocurrency</h3>
            
            {/* Stablecoins Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Stablecoins (Recommended - No Price Volatility)</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {stablecoins.map(([key, crypto]) => (
                  <motion.button
                    key={key}
                    onClick={() => handleCryptoSelect(key as CryptoKey)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-4 bg-white/5 hover:bg-white/10 rounded-xl border transition-all ${
                      crypto.recommended 
                        ? 'border-warning/50 hover:border-warning' 
                        : 'border-white/10 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          crypto.recommended 
                            ? 'bg-gradient-to-br from-warning to-orange-500' 
                            : 'bg-gradient-to-br from-primary to-accent'
                        }`}>
                          <span className="text-primary-foreground font-bold text-sm">{crypto.symbol}</span>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{crypto.name}</p>
                          <p className="text-sm text-muted-foreground">{crypto.network}</p>
                        </div>
                      </div>
                      {crypto.recommended && (
                        <Badge className="bg-warning/20 text-warning border-warning/30">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cryptocurrencies Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">Other Cryptocurrencies</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cryptos.map(([key, crypto]) => (
                  <motion.button
                    key={key}
                    onClick={() => handleCryptoSelect(key as CryptoKey)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-primary/50 transition-all"
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">{crypto.symbol}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{crypto.symbol}</p>
                        <p className="text-xs text-muted-foreground">{crypto.network.split(' ')[0]}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <Button variant="outline" onClick={onBack} className="w-full">
              Back to Payment Options
            </Button>
          </motion.div>
        )}

        {step === 'pay' && selectedCrypto && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Send {cryptoAddresses[selectedCrypto].symbol}</h3>
              <p className="text-muted-foreground text-sm">
                Send exactly <span className="text-primary font-bold">${amount}</span> worth of {cryptoAddresses[selectedCrypto].symbol}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Network</Label>
                <p className="font-medium">{cryptoAddresses[selectedCrypto].network}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-black/30 p-3 rounded-lg overflow-x-auto break-all">
                    {cryptoAddresses[selectedCrypto].address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAddress(cryptoAddresses[selectedCrypto].address)}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  {cryptoAddresses[selectedCrypto].networkWarning}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Plan:</strong> {planName}<br />
                <strong className="text-foreground">Amount:</strong> ${amount} in {cryptoAddresses[selectedCrypto].symbol}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('verify')} className="flex-1">
                I've Sent Payment
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'verify' && selectedCrypto && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Verify Your Payment</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your transaction hash to verify on the blockchain
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="txHash">Transaction Hash *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="txHash"
                      value={verificationData.transactionHash}
                      onChange={(e) => {
                        setVerificationData({
                          ...verificationData,
                          transactionHash: e.target.value
                        });
                        setVerificationStatus({ status: 'idle', message: '' });
                      }}
                      placeholder="0x... or signature..."
                      required
                    />
                    {verificationData.transactionHash && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <a
                          href={`${cryptoAddresses[selectedCrypto].explorer}${verificationData.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Auto-verification Button */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoVerify}
                    disabled={!verificationData.transactionHash || verificationStatus.status === 'verifying'}
                    className="w-full"
                  >
                    {verificationStatus.status === 'verifying' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying on Blockchain...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Verify Automatically
                      </>
                    )}
                  </Button>

                  {/* Verification Status */}
                  {verificationStatus.status !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        verificationStatus.status === 'confirmed' ? 'bg-success/10 border border-success/30' :
                        verificationStatus.status === 'pending' ? 'bg-warning/10 border border-warning/30' :
                        verificationStatus.status === 'verifying' ? 'bg-primary/10 border border-primary/30' :
                        'bg-risk/10 border border-risk/30'
                      }`}
                    >
                      {getStatusIcon()}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          verificationStatus.status === 'confirmed' ? 'text-success' :
                          verificationStatus.status === 'pending' ? 'text-warning' :
                          verificationStatus.status === 'verifying' ? 'text-primary' :
                          'text-risk'
                        }`}>
                          {verificationStatus.status === 'confirmed' ? 'Verified!' :
                           verificationStatus.status === 'pending' ? 'Pending Confirmation' :
                           verificationStatus.status === 'verifying' ? 'Checking...' :
                           'Verification Issue'}
                        </p>
                        <p className="text-xs text-muted-foreground">{verificationStatus.message}</p>
                        {verificationStatus.confirmations !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Confirmations: {verificationStatus.confirmations}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or submit for manual review
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromAddress">Your Wallet Address (Optional)</Label>
                  <Input
                    id="fromAddress"
                    value={verificationData.fromAddress}
                    onChange={(e) => setVerificationData({
                      ...verificationData,
                      fromAddress: e.target.value
                    })}
                    placeholder="Your sending wallet address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="screenshot">Transaction Screenshot (Optional)</Label>
                  <div className="mt-1">
                    <label
                      htmlFor="screenshot"
                      className="flex items-center justify-center gap-2 p-4 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {verificationData.screenshot?.name || 'Upload screenshot'}
                      </span>
                    </label>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setVerificationData({
                        ...verificationData,
                        screenshot: e.target.files?.[0] || null
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Plan:</strong> {planName}<br />
                  <strong className="text-foreground">Amount:</strong> ${amount}<br />
                  <strong className="text-foreground">Crypto:</strong> {cryptoAddresses[selectedCrypto].name}
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('pay')} className="flex-1">
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || verificationStatus.status === 'confirmed'} 
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : verificationStatus.status === 'confirmed' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Verified!
                    </>
                  ) : (
                    'Submit for Manual Review'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CryptoPayment;
