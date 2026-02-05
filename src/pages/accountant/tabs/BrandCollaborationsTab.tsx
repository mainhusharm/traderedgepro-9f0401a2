import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Plus, Trash2, Edit2, DollarSign, Calendar, 
  User, Mail, Phone, FileText, CheckCircle, Clock, AlertCircle,
  TrendingUp, Package, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountantApi } from '@/hooks/useAccountantApi';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Deliverable {
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface BrandCollaboration {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  deal_type: string;
  deal_title: string;
  deal_description: string | null;
  upfront_amount: number;
  currency: string;
  revenue_share_pct: number;
  deliverables: Deliverable[];
  contract_start_date: string | null;
  contract_end_date: string | null;
  payment_status: string;
  payment_received_at: string | null;
  payment_method: string | null;
  invoice_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const USD_TO_INR = 83.5;

const DEAL_TYPES = [
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'affiliate', label: 'Affiliate Partnership' },
  { value: 'content', label: 'Content Creation' },
  { value: 'ambassador', label: 'Brand Ambassador' },
  { value: 'licensing', label: 'Licensing Deal' },
  { value: 'data_sale', label: 'Data Sale' },
  { value: 'integration', label: 'Product Integration' },
  { value: 'other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: 'negotiating', label: 'Negotiating', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { value: 'pending_signature', label: 'Pending Signature', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: 'active', label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 'completed', label: 'Completed', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-500' },
  { value: 'partial', label: 'Partially Paid', color: 'text-orange-500' },
  { value: 'received', label: 'Received', color: 'text-emerald-500' },
  { value: 'overdue', label: 'Overdue', color: 'text-red-500' }
];

const BrandCollaborationsTab = () => {
  const [collaborations, setCollaborations] = useState<BrandCollaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<BrandCollaboration | null>(null);
  const [showCurrency, setShowCurrency] = useState<'USD' | 'INR'>('USD');
  const { callAccountantApi } = useAccountantApi();

  const [formData, setFormData] = useState({
    brand_name: '',
    brand_logo_url: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    deal_type: 'sponsorship',
    deal_title: '',
    deal_description: '',
    upfront_amount: '',
    currency: 'USD',
    revenue_share_pct: '0',
    contract_start_date: '',
    contract_end_date: '',
    payment_status: 'pending',
    payment_method: '',
    invoice_number: '',
    status: 'negotiating',
    notes: '',
    deliverables: [] as Deliverable[]
  });

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      const result = await callAccountantApi('get_brand_collaborations');
      setCollaborations(result.collaborations || []);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand_name: '',
      brand_logo_url: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      deal_type: 'sponsorship',
      deal_title: '',
      deal_description: '',
      upfront_amount: '',
      currency: 'USD',
      revenue_share_pct: '0',
      contract_start_date: '',
      contract_end_date: '',
      payment_status: 'pending',
      payment_method: '',
      invoice_number: '',
      status: 'negotiating',
      notes: '',
      deliverables: []
    });
    setEditingCollab(null);
  };

  const handleEdit = (collab: BrandCollaboration) => {
    setEditingCollab(collab);
    setFormData({
      brand_name: collab.brand_name,
      brand_logo_url: collab.brand_logo_url || '',
      contact_person: collab.contact_person || '',
      contact_email: collab.contact_email || '',
      contact_phone: collab.contact_phone || '',
      deal_type: collab.deal_type,
      deal_title: collab.deal_title,
      deal_description: collab.deal_description || '',
      upfront_amount: collab.upfront_amount.toString(),
      currency: collab.currency,
      revenue_share_pct: collab.revenue_share_pct.toString(),
      contract_start_date: collab.contract_start_date || '',
      contract_end_date: collab.contract_end_date || '',
      payment_status: collab.payment_status,
      payment_method: collab.payment_method || '',
      invoice_number: collab.invoice_number || '',
      status: collab.status,
      notes: collab.notes || '',
      deliverables: collab.deliverables || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.brand_name || !formData.deal_title) {
      toast({ title: "Error", description: "Brand name and deal title are required", variant: "destructive" });
      return;
    }

    try {
      if (editingCollab) {
        await callAccountantApi('update_brand_collaboration', {
          id: editingCollab.id,
          ...formData,
          upfront_amount: parseFloat(formData.upfront_amount) || 0,
          revenue_share_pct: parseFloat(formData.revenue_share_pct) || 0
        });
        toast({ title: "Updated", description: "Brand collaboration updated successfully" });
      } else {
        await callAccountantApi('add_brand_collaboration', {
          ...formData,
          upfront_amount: parseFloat(formData.upfront_amount) || 0,
          revenue_share_pct: parseFloat(formData.revenue_share_pct) || 0
        });
        toast({ title: "Added", description: "Brand collaboration added successfully" });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadCollaborations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collaboration?')) return;
    
    try {
      await callAccountantApi('delete_brand_collaboration', { id });
      toast({ title: "Deleted", description: "Collaboration removed" });
      loadCollaborations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { title: '', description: '', due_date: '', status: 'pending' }]
    }));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => i === index ? { ...d, [field]: value } : d)
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const formatAmount = (amount: number, currency: string) => {
    if (showCurrency === 'INR') {
      const inrAmount = currency === 'USD' ? amount * USD_TO_INR : amount;
      return `₹${inrAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    const usdAmount = currency === 'INR' ? amount / USD_TO_INR : amount;
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const totalUpfront = collaborations.reduce((sum, c) => {
    const usdAmount = c.currency === 'INR' ? c.upfront_amount / USD_TO_INR : c.upfront_amount;
    return sum + usdAmount;
  }, 0);

  const activeDeals = collaborations.filter(c => c.status === 'active').length;
  const pendingPayments = collaborations.filter(c => c.payment_status === 'pending' && c.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Upfront Value</p>
                <p className="text-xl font-bold">{formatAmount(totalUpfront, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collaborations</p>
                <p className="text-xl font-bold">{collaborations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-xl font-bold">{activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 border-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-xl font-bold">{pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={showCurrency === 'USD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCurrency('USD')}
          >
            USD
          </Button>
          <Button
            variant={showCurrency === 'INR' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCurrency('INR')}
          >
            INR
          </Button>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Collaboration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCollab ? 'Edit' : 'Add'} Brand Collaboration</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Brand Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-500">Brand Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Name *</Label>
                    <Input
                      value={formData.brand_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                      placeholder="e.g., Nike, Adidas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Logo URL</Label>
                    <Input
                      value={formData.brand_logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_logo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-500">Contact Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="john@brand.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>

              {/* Deal Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-500">Deal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deal Type *</Label>
                    <Select value={formData.deal_type} onValueChange={(v) => setFormData(prev => ({ ...prev, deal_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEAL_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deal Title *</Label>
                    <Input
                      value={formData.deal_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, deal_title: e.target.value }))}
                      placeholder="Q1 2026 Sponsorship"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deal Description</Label>
                  <Textarea
                    value={formData.deal_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, deal_description: e.target.value }))}
                    placeholder="Detailed description of the collaboration..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-500">Financial Details</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Upfront Amount</Label>
                    <Input
                      type="number"
                      value={formData.upfront_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, upfront_amount: e.target.value }))}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue Share %</Label>
                    <Input
                      type="number"
                      value={formData.revenue_share_pct}
                      onChange={(e) => setFormData(prev => ({ ...prev, revenue_share_pct: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={formData.payment_status} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Input
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      placeholder="Bank Transfer, PayPal, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input
                      value={formData.invoice_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                      placeholder="INV-2026-001"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Dates */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-500">Contract Period</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-emerald-500">Deliverables</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                    <Plus className="w-4 h-4 mr-1" /> Add Deliverable
                  </Button>
                </div>
                {formData.deliverables.map((del, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-end border border-white/[0.08] rounded-lg p-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={del.title}
                        onChange={(e) => updateDeliverable(idx, 'title', e.target.value)}
                        placeholder="Social Post"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={del.description}
                        onChange={(e) => updateDeliverable(idx, 'description', e.target.value)}
                        placeholder="Instagram reel"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Due Date</Label>
                      <Input
                        type="date"
                        value={del.due_date}
                        onChange={(e) => updateDeliverable(idx, 'due_date', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={del.status} onValueChange={(v) => updateDeliverable(idx, 'status', v)}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDeliverable(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingCollab ? 'Update' : 'Save'} Collaboration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collaborations Table */}
      <Card className="bg-background/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Brand Collaborations
          </CardTitle>
          <CardDescription>Track all upfront brand deals and sponsorships</CardDescription>
        </CardHeader>
        <CardContent>
          {collaborations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No brand collaborations yet</p>
              <p className="text-sm">Add your first collaboration to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Upfront</TableHead>
                  <TableHead>Rev Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborations.map((collab) => {
                  const statusOpt = STATUS_OPTIONS.find(s => s.value === collab.status);
                  const paymentOpt = PAYMENT_STATUS_OPTIONS.find(p => p.value === collab.payment_status);
                  
                  return (
                    <TableRow key={collab.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {collab.brand_logo_url ? (
                            <img src={collab.brand_logo_url} alt={collab.brand_name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-emerald-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{collab.brand_name}</p>
                            {collab.contact_person && (
                              <p className="text-xs text-muted-foreground">{collab.contact_person}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{collab.deal_title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{collab.deal_type.replace('_', ' ')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-500">
                        {formatAmount(collab.upfront_amount, collab.currency)}
                      </TableCell>
                      <TableCell>
                        {collab.revenue_share_pct > 0 ? `${collab.revenue_share_pct}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${statusOpt?.bg} ${statusOpt?.color}`}>
                          {statusOpt?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${paymentOpt?.color}`}>
                          {paymentOpt?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {collab.contract_start_date && collab.contract_end_date ? (
                          <>
                            {format(new Date(collab.contract_start_date), 'MMM d')} - {format(new Date(collab.contract_end_date), 'MMM d, yyyy')}
                          </>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(collab)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(collab.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BrandCollaborationsTab;