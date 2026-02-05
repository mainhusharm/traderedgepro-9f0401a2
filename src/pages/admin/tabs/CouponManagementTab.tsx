import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Loader2,
  Calendar,
  Percent,
  DollarSign,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Target,
  PiggyBank
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  is_private: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

interface PaymentWithCoupon {
  id: string;
  coupon_code: string | null;
  plan_name: string;
  discount_amount: number;
  original_price: number;
  final_price: number;
  created_at: string;
  status: string;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CouponManagementTab = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [payments, setPayments] = useState<PaymentWithCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('coupons');
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_uses: 0,
    is_active: true,
    is_private: false,
    valid_from: '',
    valid_until: '',
  });

  useEffect(() => {
    fetchCoupons();
    fetchPaymentsWithCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [totalRevenueWithoutCoupons, setTotalRevenueWithoutCoupons] = useState(0);

  const fetchPaymentsWithCoupons = async () => {
    try {
      // Fetch payments with coupons
      const { data, error } = await supabase
        .from('payments')
        .select('id, coupon_code, plan_name, discount_amount, original_price, final_price, created_at, status')
        .not('coupon_code', 'is', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);

      // Fetch total payments count for conversion rate
      const { count: totalCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      setTotalPaymentsCount(totalCount || 0);

      // Calculate total revenue from non-coupon payments
      const { data: nonCouponPayments } = await supabase
        .from('payments')
        .select('final_price')
        .is('coupon_code', null)
        .eq('status', 'completed');

      const nonCouponRevenue = (nonCouponPayments || []).reduce((sum, p) => sum + (p.final_price || 0), 0);
      setTotalRevenueWithoutCoupons(nonCouponRevenue);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  // Analytics calculations
  const analyticsData = useMemo(() => {
    // Redemptions over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const redemptionsByDay = last30Days.map(date => {
      const dayPayments = payments.filter(p => 
        p.created_at.split('T')[0] === date
      );
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        redemptions: dayPayments.length,
        savings: dayPayments.reduce((sum, p) => sum + (p.discount_amount || 0), 0)
      };
    });

    // Usage by plan
    const planUsage: Record<string, number> = {};
    payments.forEach(p => {
      planUsage[p.plan_name] = (planUsage[p.plan_name] || 0) + 1;
    });
    const planUsageData = Object.entries(planUsage).map(([name, value]) => ({
      name,
      value
    }));

    // Top coupons by usage with enhanced metrics
    const couponUsage: Record<string, { uses: number; savings: number; revenue: number; originalRevenue: number }> = {};
    payments.forEach(p => {
      if (p.coupon_code) {
        if (!couponUsage[p.coupon_code]) {
          couponUsage[p.coupon_code] = { uses: 0, savings: 0, revenue: 0, originalRevenue: 0 };
        }
        couponUsage[p.coupon_code].uses++;
        couponUsage[p.coupon_code].savings += p.discount_amount || 0;
        couponUsage[p.coupon_code].revenue += p.final_price || 0;
        couponUsage[p.coupon_code].originalRevenue += p.original_price || 0;
      }
    });
    const topCoupons = Object.entries(couponUsage)
      .map(([code, data]) => ({ 
        code, 
        ...data,
        redemptionRate: coupons.find(c => c.code === code)?.max_uses 
          ? ((data.uses / (coupons.find(c => c.code === code)?.max_uses || 1)) * 100).toFixed(1)
          : 'N/A'
      }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);

    // Total stats
    const totalRedemptions = payments.length;
    const totalSavings = payments.reduce((sum, p) => sum + (p.discount_amount || 0), 0);
    const totalCouponRevenue = payments.reduce((sum, p) => sum + (p.final_price || 0), 0);
    const totalOriginalRevenue = payments.reduce((sum, p) => sum + (p.original_price || 0), 0);

    // New metrics
    const redemptionRate = totalPaymentsCount > 0 
      ? ((totalRedemptions / totalPaymentsCount) * 100).toFixed(1)
      : '0';
    
    const conversionRate = totalPaymentsCount > 0 
      ? ((totalRedemptions / totalPaymentsCount) * 100).toFixed(1)
      : '0';

    // Revenue impact: difference between what could have been earned vs what was earned
    const totalAllRevenue = totalCouponRevenue + totalRevenueWithoutCoupons;
    const potentialRevenue = totalOriginalRevenue + totalRevenueWithoutCoupons;
    const revenueImpact = potentialRevenue - totalAllRevenue;

    // Revenue impact chart data
    const revenueImpactData = [
      { name: 'Potential Revenue', value: potentialRevenue },
      { name: 'Actual Revenue', value: totalAllRevenue },
      { name: 'Discount Given', value: totalSavings }
    ];

    return {
      redemptionsByDay,
      planUsageData,
      topCoupons,
      totalRedemptions,
      totalSavings,
      redemptionRate,
      conversionRate,
      revenueImpact,
      revenueImpactData,
      totalCouponRevenue,
      potentialRevenue: totalOriginalRevenue
    };
  }, [payments, coupons, totalPaymentsCount, totalRevenueWithoutCoupons]);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: 0,
      is_active: true,
      is_private: false,
      valid_from: '',
      valid_until: '',
    });
    setEditingCoupon(null);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase || 0,
        max_uses: coupon.max_uses || 0,
        is_active: coupon.is_active,
        is_private: coupon.is_private,
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    setIsSaving(true);
    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase: formData.min_purchase || null,
        max_uses: formData.max_uses || null,
        is_active: formData.is_active,
        is_private: formData.is_private,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `$${coupon.discount_value}`;
  };

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
        <div>
          <h2 className="text-xl font-bold">Coupon Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage discount coupons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="coupons">
                <Ticket className="w-4 h-4 mr-2" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., SAVE20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">
                      {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount ($)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_purchase">Min Purchase ($)</Label>
                    <Input
                      id="min_purchase"
                      type="number"
                      min="0"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_uses">Max Uses (0 = unlimited)</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="0"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <Label htmlFor="is_private">Private Coupon</Label>
                  </div>
                  <Switch
                    id="is_private"
                    checked={formData.is_private}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSaveCoupon} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingCoupon ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {analyticsData.conversionRate}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Redemption Rate</p>
                  <p className="text-2xl font-bold">{analyticsData.totalRedemptions}/{totalPaymentsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">of all completed payments</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-destructive" />
                  </div>
                  <Badge variant="outline" className="text-xs text-destructive">
                    Revenue Lost
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Revenue Impact</p>
                  <p className="text-2xl font-bold text-destructive">-${analyticsData.totalSavings.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">total discounts given</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-success" />
                  </div>
                  <Badge variant="outline" className="text-xs text-success">
                    Earned
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Coupon Revenue</p>
                  <p className="text-2xl font-bold text-success">${analyticsData.totalCouponRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">from coupon users</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">
                    ${analyticsData.totalRedemptions > 0 
                      ? (analyticsData.totalCouponRevenue / analyticsData.totalRedemptions).toFixed(2)
                      : '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per coupon order</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Redemptions</p>
                  <p className="text-2xl font-bold">{analyticsData.totalRedemptions}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Savings Given</p>
                  <p className="text-2xl font-bold text-success">${analyticsData.totalSavings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Coupons Used</p>
                  <p className="text-2xl font-bold">{analyticsData.topCoupons.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Discount</p>
                  <p className="text-2xl font-bold">
                    ${analyticsData.totalRedemptions > 0 
                      ? (analyticsData.totalSavings / analyticsData.totalRedemptions).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Redemptions Over Time */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Redemptions (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.redemptionsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="redemptions" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Usage by Plan */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  Usage by Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analyticsData.planUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.planUsageData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {analyticsData.planUsageData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Coupons Performance Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Coupon Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.topCoupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No coupon redemptions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Coupon Code</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Redemptions</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Redemption Rate</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Revenue Generated</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Discount Given</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Avg. Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topCoupons.map((coupon, index) => (
                        <tr key={coupon.code} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{coupon.code}</span>
                              {index === 0 && (
                                <Badge className="bg-primary/20 text-primary text-xs">Top</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 font-medium">{coupon.uses}</td>
                          <td className="text-right py-3 px-2">
                            <Badge variant="outline" className="text-xs">
                              {coupon.redemptionRate === 'N/A' ? 'Unlimited' : `${coupon.redemptionRate}%`}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-2 text-success font-medium">
                            ${coupon.revenue.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-2 text-destructive">
                            -${coupon.savings.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-2">
                            ${coupon.uses > 0 ? (coupon.revenue / coupon.uses).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Top Coupons by Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.topCoupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No coupon redemptions yet</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.topCoupons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis 
                        dataKey="code" 
                        type="category" 
                        width={100}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'uses' ? value : `$${value.toFixed(2)}`,
                          name === 'uses' ? 'Redemptions' : name === 'revenue' ? 'Revenue' : 'Discounts'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="uses" fill="hsl(var(--primary))" name="Redemptions" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Coupons</p>
                  <p className="text-2xl font-bold">{coupons.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Private</p>
                  <p className="text-2xl font-bold">{coupons.filter(c => c.is_private).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                  <p className="text-2xl font-bold">
                    {coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coupons List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                All Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No coupons created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-6 h-6 text-primary" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg">{coupon.code}</span>
                            {!coupon.is_active && (
                              <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                            )}
                            {coupon.is_private && (
                              <Badge variant="outline" className="text-warning">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="text-success font-medium">{formatDiscount(coupon)} off</span>
                            {coupon.min_purchase && coupon.min_purchase > 0 && (
                              <span>Min: ${coupon.min_purchase}</span>
                            )}
                            <span>
                              Used: {coupon.current_uses || 0}
                              {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                            </span>
                            {coupon.valid_until && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires: {new Date(coupon.valid_until).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCoupon(coupon)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CouponManagementTab;
