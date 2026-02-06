import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Pen, Check, Calendar, User, Building, Shield, Scale, FileCheck, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccountantApi } from '@/hooks/useAccountantApi';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Contract {
  id: string;
  contract_type: string;
  contract_version: string;
  owner_name: string;
  owner_role: string;
  ceo_name: string;
  ceo_role: string;
  owner_share_pct: number;
  ceo_share_pct: number;
  contract_terms: any;
  owner_signature_data: string | null;
  owner_signed_at: string | null;
  ceo_signature_data: string | null;
  ceo_signed_at: string | null;
  is_active: boolean;
  effective_date: string;
  created_at: string;
}

const CONTRACT_TERMS = {
  preamble: {
    title: "PARTNERSHIP AGREEMENT",
    subtitle: "TraderEdge Pro - Legal Partnership Contract",
    effectiveDate: new Date().toISOString().split('T')[0]
  },
  parties: {
    owner: {
      name: "Anchal",
      designation: "Founder & Owner",
      role: "Sole Proprietor with Full Rights",
      responsibilities: [
        "Complete ownership and control of TraderEdge Pro brand, domain, and all intellectual property",
        "Full authority over all business decisions, strategies, and operations",
        "Exclusive rights to all data, user information, algorithms, and proprietary systems",
        "Right to sell, transfer, license, or dispose of any company assets without consent",
        "Authority to modify, amend, or terminate this agreement at sole discretion",
        "Control over all financial accounts, payment gateways, and revenue streams",
        "Right to hire, fire, or restructure any aspect of the business",
        "Ownership of all current and future intellectual property created for the business"
      ]
    },
    ceo: {
      name: "Sahil", 
      designation: "CEO (Profit Share Partner)",
      role: "Operational Partner with Limited Profit Share",
      limitations: [
        "NO ownership stake in the company or its assets",
        "NO rights to company data, intellectual property, or proprietary information",
        "NO authority to sell, transfer, or license any company assets",
        "NO claim to proceeds from sale of company, data, or any assets",
        "NO voting rights or decision-making authority on ownership matters",
        "NO rights upon termination except for earned and unpaid profit share",
        "NO claim to customer lists, algorithms, trading strategies, or systems",
        "NO right to compete using company knowledge for 2 years post-termination"
      ],
      entitlements: [
        "40% profit share from subscription sales (after expenses)",
        "40% profit share from affiliate commissions (after expenses)",
        "Monthly profit distribution on the 1st of each month",
        "Access to financial reports for transparency on profit calculations"
      ]
    }
  },
  profitSharing: {
    title: "PROFIT SHARING TERMS",
    ownerPercentage: 60,
    ceoPercentage: 40,
    applicableRevenue: [
      "Subscription sales (monthly, quarterly, annual plans)",
      "Affiliate referral commissions",
      "Partnership revenue sharing deals"
    ],
    exclusions: [
      "Sale of company or its assets (100% to Owner)",
      "Sale of user data or customer lists (100% to Owner)",
      "Licensing of intellectual property (100% to Owner)",
      "Investment or funding received (100% to Owner)",
      "Any one-time windfalls not from regular operations (100% to Owner)"
    ],
    expenseDeductions: [
      "Server and infrastructure costs",
      "Payment gateway fees (Stripe, PayPal, Crypto)",
      "Marketing and advertising expenses",
      "Software subscriptions and tools",
      "Legal and accounting fees",
      "Employee/contractor salaries (excluding CEO)",
      "Any other operational business expenses"
    ]
  },
  ownership: {
    title: "OWNERSHIP & INTELLECTUAL PROPERTY",
    clauses: [
      {
        heading: "Sole Ownership",
        content: "The Owner (Anchal) is the sole and exclusive owner of TraderEdge Pro, including but not limited to: the brand name, domain names, logos, trademarks, source code, algorithms, trading strategies, user data, customer relationships, and all other tangible and intangible assets."
      },
      {
        heading: "No Transfer of Ownership",
        content: "This agreement does NOT grant the CEO any ownership interest in the company. The CEO's role is strictly limited to operational support in exchange for a profit share as defined herein."
      },
      {
        heading: "Work Product",
        content: "Any work, code, strategies, content, or intellectual property created by the CEO during the course of this partnership shall be the sole property of the Owner and TraderEdge Pro."
      },
      {
        heading: "Sale or Transfer Rights",
        content: "The Owner reserves the absolute and unilateral right to sell, merge, license, or transfer the company or any of its assets at any time, without notice to or consent from the CEO. Upon such sale, the CEO shall have no claim to any proceeds."
      }
    ]
  },
  termination: {
    title: "TERMINATION & EXIT",
    clauses: [
      {
        heading: "Owner's Right to Terminate",
        content: "The Owner may terminate this agreement at any time, with or without cause, by providing 30 days written notice. Upon termination, the CEO shall receive only the profit share earned up to the termination date."
      },
      {
        heading: "CEO's Exit",
        content: "The CEO may exit this agreement with 60 days written notice. No severance, buyout, or additional compensation shall be owed beyond the earned profit share."
      },
      {
        heading: "Post-Termination Obligations",
        content: "Upon termination, the CEO must: (1) Return all company materials, data, and credentials, (2) Not compete in similar business for 24 months, (3) Maintain confidentiality indefinitely, (4) Not solicit company customers or partners for 24 months."
      }
    ]
  },
  confidentiality: {
    title: "CONFIDENTIALITY & NON-DISCLOSURE",
    content: "The CEO agrees to maintain strict confidentiality regarding all proprietary information, including but not limited to: business strategies, financial data, customer information, trading algorithms, source code, and any other information not publicly available. This obligation survives termination indefinitely."
  },
  disputeResolution: {
    title: "DISPUTE RESOLUTION",
    content: "Any disputes arising from this agreement shall be resolved through binding arbitration in accordance with Indian law. The arbitration shall be conducted in [City], India, and the decision of the arbitrator shall be final and binding."
  },
  amendments: {
    title: "AMENDMENTS",
    content: "This agreement may only be amended in writing with the signature of the Owner. The Owner reserves the right to modify profit-sharing percentages with 30 days notice to the CEO."
  },
  acknowledgment: {
    title: "ACKNOWLEDGMENT",
    ceoStatement: "I, Sahil (CEO), acknowledge that I have read, understood, and agree to all terms of this agreement. I understand that I have NO ownership stake in TraderEdge Pro and my role is limited to receiving a 40% profit share on specified revenues only."
  }
};

const ContractTab = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signingParty, setSigningParty] = useState<'owner' | 'ceo' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { callAccountantApi } = useAccountantApi();

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      const result = await callAccountantApi('get_contract');
      setContract(result.contract);
    } catch (error) {
      console.error('Failed to load contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeContract = async () => {
    try {
      const result = await callAccountantApi('create_contract', {
        contract_terms: CONTRACT_TERMS
      });
      setContract(result.contract);
      toast({ title: "Contract Created", description: "Partnership agreement has been initialized." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const startSigning = (party: 'owner' | 'ceo') => {
    setSigningParty(party);
    setIsSigning(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
        }
      }
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !signingParty) return;

    const signatureData = canvas.toDataURL('image/png');
    
    try {
      await callAccountantApi('sign_contract', {
        contract_id: contract?.id,
        party: signingParty,
        signature_data: signatureData
      });
      
      toast({ 
        title: "Contract Signed!", 
        description: `${signingParty === 'owner' ? 'Owner' : 'CEO'} signature has been saved permanently.` 
      });
      
      setIsSigning(false);
      setSigningParty(null);
      loadContract();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (isSigning) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card className="bg-background/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              <Pen className="w-5 h-5" />
              Sign Contract - {signingParty === 'owner' ? 'Owner (Anchal)' : 'CEO (Sahil)'}
            </CardTitle>
            <CardDescription>Draw your signature below to legally bind this agreement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-white/[0.08] rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="cursor-crosshair w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearSignature}>Clear</Button>
              <Button variant="outline" onClick={() => { setIsSigning(false); setSigningParty(null); }}>Cancel</Button>
              <Button onClick={saveSignature} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-2" /> Confirm Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!contract) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card className="bg-background/50 border-white/[0.08]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-500">Initialize Partnership Contract</CardTitle>
            <CardDescription>Create the legal partnership agreement between Owner and CEO</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={initializeContract} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <FileText className="w-5 h-5 mr-2" /> Generate Contract
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const terms = contract.contract_terms || CONTRACT_TERMS;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Contract Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contract.owner_signed_at ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                {contract.owner_signed_at ? <Check className="w-6 h-6 text-emerald-500" /> : <Pen className="w-6 h-6 text-yellow-500" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Signature</p>
                <p className="font-semibold">{contract.owner_signed_at ? `Signed ${format(new Date(contract.owner_signed_at), 'MMM d, yyyy')}` : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contract.ceo_signed_at ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                {contract.ceo_signed_at ? <Check className="w-6 h-6 text-emerald-500" /> : <Pen className="w-6 h-6 text-yellow-500" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CEO Signature</p>
                <p className="font-semibold">{contract.ceo_signed_at ? `Signed ${format(new Date(contract.ceo_signed_at), 'MMM d, yyyy')}` : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contract.owner_signed_at && contract.ceo_signed_at ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                <FileCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Status</p>
                <p className="font-semibold">{contract.owner_signed_at && contract.ceo_signed_at ? 'Fully Executed' : 'Awaiting Signatures'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Contract Document */}
      <Card className="bg-background/50 border-white/[0.08]">
        <CardHeader className="border-b border-white/[0.08] text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-emerald-500">{terms.preamble?.title || 'PARTNERSHIP AGREEMENT'}</CardTitle>
          <CardDescription className="text-lg">{terms.preamble?.subtitle || 'TraderEdge Pro'}</CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Date: {format(new Date(contract.effective_date), 'MMMM d, yyyy')}
          </p>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-8 max-h-[600px] overflow-y-auto">
          {/* Parties */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
              <User className="w-5 h-5" /> PARTIES TO THIS AGREEMENT
            </h2>
            
            {/* Owner */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-500">{terms.parties?.owner?.name || 'Anchal'} - {terms.parties?.owner?.designation || 'Founder & Owner'}</h3>
                  <p className="text-sm text-muted-foreground">{terms.parties?.owner?.role || 'Sole Proprietor with Full Rights'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Owner Rights & Responsibilities:</h4>
                <ul className="space-y-2">
                  {(terms.parties?.owner?.responsibilities || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CEO */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-500">{terms.parties?.ceo?.name || 'Sahil'} - {terms.parties?.ceo?.designation || 'CEO'}</h3>
                  <p className="text-sm text-muted-foreground">{terms.parties?.ceo?.role || 'Profit Share Partner'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" /> CEO Limitations (NO Rights To):
                </h4>
                <ul className="space-y-2">
                  {(terms.parties?.ceo?.limitations || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-emerald-400">CEO Entitlements:</h4>
                <ul className="space-y-2">
                  {(terms.parties?.ceo?.entitlements || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Profit Sharing */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">{terms.profitSharing?.title || 'PROFIT SHARING TERMS'}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-emerald-500">{terms.profitSharing?.ownerPercentage || 60}%</p>
                <p className="text-sm text-muted-foreground">Owner Share</p>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-orange-500">{terms.profitSharing?.ceoPercentage || 40}%</p>
                <p className="text-sm text-muted-foreground">CEO Share</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Applicable Revenue Streams:</h4>
              <ul className="space-y-1">
                {(terms.profitSharing?.applicableRevenue || []).map((item: string, i: number) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-red-400">Revenue EXCLUDED from Profit Share (100% to Owner):</h4>
              <ul className="space-y-1">
                {(terms.profitSharing?.exclusions || []).map((item: string, i: number) => (
                  <li key={i} className="text-sm flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Ownership & IP */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">{terms.ownership?.title || 'OWNERSHIP & INTELLECTUAL PROPERTY'}</h2>
            {(terms.ownership?.clauses || []).map((clause: any, i: number) => (
              <div key={i} className="border-l-2 border-emerald-500/50 pl-4">
                <h4 className="font-semibold">{clause.heading}</h4>
                <p className="text-sm text-muted-foreground">{clause.content}</p>
              </div>
            ))}
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">{terms.termination?.title || 'TERMINATION & EXIT'}</h2>
            {(terms.termination?.clauses || []).map((clause: any, i: number) => (
              <div key={i} className="border-l-2 border-orange-500/50 pl-4">
                <h4 className="font-semibold">{clause.heading}</h4>
                <p className="text-sm text-muted-foreground">{clause.content}</p>
              </div>
            ))}
          </section>

          {/* Confidentiality */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">{terms.confidentiality?.title || 'CONFIDENTIALITY'}</h2>
            <p className="text-sm text-muted-foreground">{terms.confidentiality?.content}</p>
          </section>

          {/* Dispute Resolution */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">{terms.disputeResolution?.title || 'DISPUTE RESOLUTION'}</h2>
            <p className="text-sm text-muted-foreground">{terms.disputeResolution?.content}</p>
          </section>

          {/* Acknowledgment */}
          <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-500">{terms.acknowledgment?.title || 'ACKNOWLEDGMENT'}</h2>
            <p className="text-sm italic">"{terms.acknowledgment?.ceoStatement}"</p>
          </section>

          {/* Signatures Section */}
          <section className="border-t border-white/[0.08] pt-8 space-y-6">
            <h2 className="text-xl font-bold text-emerald-500 text-center">SIGNATURES</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Owner Signature */}
              <div className="border border-white/[0.08] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-center">Owner (Anchal)</h4>
                {contract.owner_signature_data ? (
                  <div className="space-y-2">
                    <img 
                      src={contract.owner_signature_data} 
                      alt="Owner Signature" 
                      className="w-full h-24 object-contain bg-[#1a1a1a] rounded"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Signed on {format(new Date(contract.owner_signed_at!), 'MMMM d, yyyy, h:mm a')}
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => startSigning('owner')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Pen className="w-4 h-4 mr-2" /> Sign as Owner
                  </Button>
                )}
              </div>

              {/* CEO Signature */}
              <div className="border border-white/[0.08] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-center">CEO (Sahil)</h4>
                {contract.ceo_signature_data ? (
                  <div className="space-y-2">
                    <img 
                      src={contract.ceo_signature_data} 
                      alt="CEO Signature" 
                      className="w-full h-24 object-contain bg-[#1a1a1a] rounded"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Signed on {format(new Date(contract.ceo_signed_at!), 'MMMM d, yyyy, h:mm a')}
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => startSigning('ceo')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Pen className="w-4 h-4 mr-2" /> Sign as CEO
                  </Button>
                )}
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContractTab;