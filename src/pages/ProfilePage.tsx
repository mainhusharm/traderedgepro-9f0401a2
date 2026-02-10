import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User, Mail, MapPin, Building2, Shield,
  CreditCard, Users, Settings, LogOut, Check,
  X, Edit2, Save, Loader2, Crown, Zap, Star, Gift, Bell
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import EmailPreferencesCard from '@/components/settings/EmailPreferencesCard';
import ReferralCreditsCard from '@/components/settings/ReferralCreditsCard';
import ReferralLeaderboard from '@/components/referrals/ReferralLeaderboard';
import ReferralAnalytics from '@/components/referrals/ReferralAnalytics';
import ReferralBadges from '@/components/referrals/ReferralBadges';
import ReferralClickStats from '@/components/referrals/ReferralClickStats';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  company: string | null;
  avatar_url: string | null;
}

interface AffiliateData {
  affiliate_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  commission_rate: number;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { membership, isLoading: membershipLoading, daysRemaining, isPremium } = useSubscription();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profileData) {
        setProfile({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          country: profileData.country,
          company: profileData.company,
          avatar_url: profileData.avatar_url,
        });
        setEditedProfile({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          country: profileData.country,
          company: profileData.company,
          avatar_url: profileData.avatar_url,
        });
      }

      // Fetch affiliate data
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!affiliateError && affiliateData) {
        setAffiliate({
          affiliate_code: affiliateData.affiliate_code,
          total_referrals: affiliateData.total_referrals || 0,
          total_earnings: affiliateData.total_earnings || 0,
          pending_earnings: affiliateData.pending_earnings || 0,
          paid_earnings: affiliateData.paid_earnings || 0,
          commission_rate: affiliateData.commission_rate || 20,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          country: editedProfile.country,
          company: editedProfile.company,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanIcon = (planName: string | undefined) => {
    switch (planName?.toLowerCase()) {
      case 'kickstarter': return Gift;
      case 'starter': return Zap;
      case 'pro': return Star;
      case 'enterprise': return Crown;
      default: return Shield;
    }
  };

  const getPlanColor = (planName: string | undefined) => {
    switch (planName?.toLowerCase()) {
      case 'kickstarter': return 'text-green-500 bg-green-500/10';
      case 'starter': return 'text-blue-500 bg-blue-500/10';
      case 'pro': return 'text-purple-500 bg-purple-500/10';
      case 'enterprise': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const PlanIcon = getPlanIcon(membership?.planName);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="relative max-w-5xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-300 flex items-center justify-center text-3xl font-bold text-white">
                {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Your Profile'}
                </h1>
                <p className="text-white/40 font-light">{user?.email}</p>
                {membership && (
                  <Badge className={`mt-2 ${getPlanColor(membership.planName)}`}>
                    <PlanIcon className="w-3 h-3 mr-1" />
                    {membership.planName} Plan
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15] text-white/60">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="bg-white/[0.02] border-white/[0.05]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Personal Information</CardTitle>
                    <CardDescription className="text-white/40">Manage your account details</CardDescription>
                  </div>
                  {editing ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditing(false);
                        setEditedProfile(profile);
                      }}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      {editing ? (
                        <Input
                          id="firstName"
                          value={editedProfile?.first_name || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{profile?.first_name || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      {editing ? (
                        <Input
                          id="lastName"
                          value={editedProfile?.last_name || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{profile?.last_name || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{user?.email}</span>
                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      {editing ? (
                        <Input
                          id="country"
                          value={editedProfile?.country || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, country: e.target.value} : null)}
                          placeholder="Enter country"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{profile?.country || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      {editing ? (
                        <Input
                          id="company"
                          value={editedProfile?.company || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, company: e.target.value} : null)}
                          placeholder="Enter company name"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{profile?.company || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <div className="space-y-6">
                {/* Current Plan Card */}
                <Card className="bg-white/[0.02] border-white/[0.05] overflow-hidden">
                  <div className={`h-2 ${membership?.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white/5'}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getPlanColor(membership?.planName)}`}>
                            <PlanIcon className="w-5 h-5" />
                          </div>
                          {membership?.planName || 'No Active Plan'}
                        </CardTitle>
                        <CardDescription>
                          {membership?.status === 'active' ? 'Your current subscription' : 'Subscribe to unlock features'}
                        </CardDescription>
                      </div>
                      <Badge variant={membership?.status === 'active' ? 'default' : 'secondary'}>
                        {membership?.status || 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {membership ? (
                      <>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Plan Price</p>
                            <p className="text-2xl font-bold">${membership.planPrice}</p>
                            <p className="text-xs text-muted-foreground">/{membership.billingPeriod}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Billing Period</p>
                            <p className="text-2xl font-bold capitalize">{membership.billingPeriod}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Days Remaining</p>
                            <p className="text-2xl font-bold">{daysRemaining || 0}</p>
                            {daysRemaining && daysRemaining <= 7 && (
                              <p className="text-xs text-amber-500">Renew soon!</p>
                            )}
                          </div>
                        </div>

                        {daysRemaining && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subscription Progress</span>
                              <span>{Math.max(0, 100 - (daysRemaining / 30) * 100).toFixed(0)}% used</span>
                            </div>
                            <Progress value={Math.max(0, 100 - (daysRemaining / 30) * 100)} className="h-2" />
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => navigate('/membership')}>
                            {isPremium ? 'Manage Plan' : 'Upgrade Plan'}
                          </Button>
                          <Button variant="ghost" className="text-muted-foreground">
                            View Invoice History
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                        <p className="text-muted-foreground mb-4">
                          Choose a plan to unlock premium trading features
                        </p>
                        <Button onClick={() => navigate('/membership')}>
                          View Plans
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals">
              <div className="space-y-6">
                <ReferralCreditsCard />
                <ReferralBadges />
                <ReferralClickStats />
                <ReferralAnalytics />
                <ReferralLeaderboard />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <EmailPreferencesCard />
                
                {/* Affiliate Program */}
                {affiliate ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Affiliate Program
                      </CardTitle>
                      <CardDescription>Earn commission on referrals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <p className="text-xs text-muted-foreground">Referrals</p>
                          <p className="text-xl font-bold">{affiliate.total_referrals}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10">
                          <p className="text-xs text-muted-foreground">Earned</p>
                          <p className="text-xl font-bold text-success">${affiliate.total_earnings.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-warning/10">
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <p className="text-xl font-bold text-warning">${affiliate.pending_earnings.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/10">
                          <p className="text-xs text-muted-foreground">Rate</p>
                          <p className="text-xl font-bold">{affiliate.commission_rate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          readOnly 
                          value={`https://traderedge.pro/?ref=${affiliate.affiliate_code}`}
                          className="bg-muted/50"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://traderedge.pro/?ref=${affiliate.affiliate_code}`);
                            toast.success('Link copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card">
                    <CardContent className="py-8 text-center">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="font-semibold mb-2">Join Affiliate Program</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Earn 30%+ commission on every referral
                      </p>
                      <Button size="sm" onClick={() => navigate('/affiliates')}>
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
