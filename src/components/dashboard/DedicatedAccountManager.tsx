import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Mail, Phone, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface AccountManager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

const DedicatedAccountManager = () => {
  const { user } = useAuth();
  const [manager, setManager] = useState<AccountManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedAt, setAssignedAt] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccountManager();
    }
  }, [user]);

  const fetchAccountManager = async () => {
    if (!user) return;
    
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('user_account_manager_assignments')
        .select('account_manager_id, assigned_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      
      if (assignment) {
        setAssignedAt(assignment.assigned_at);
        
        const { data: managerData, error: managerError } = await supabase
          .from('account_managers')
          .select('*')
          .eq('id', assignment.account_manager_id)
          .single();

        if (managerError) throw managerError;
        setManager(managerData);
      }
    } catch (error) {
      console.error('Error fetching account manager:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactManager = (method: 'email' | 'call') => {
    if (!manager) return;
    
    if (method === 'email') {
      window.location.href = `mailto:${manager.email}?subject=Support Request - Enterprise Account`;
    } else {
      if (manager.phone) {
        window.location.href = `tel:${manager.phone}`;
      } else {
        toast.info('Phone number not available. Please use email.');
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!manager) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Dedicated Account Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your dedicated account manager will be assigned shortly. You'll receive an email notification once they're ready to assist you.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Your Dedicated Account Manager
          </CardTitle>
          <Badge className="bg-primary/20 text-primary">Enterprise</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/30">
            <AvatarImage src={manager.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {manager.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{manager.name}</h3>
            {manager.specialty && (
              <p className="text-sm text-muted-foreground">{manager.specialty}</p>
            )}
            {assignedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Assigned {new Date(assignedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => handleContactManager('email')}
            className="w-full"
            variant="outline"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button 
            onClick={() => handleContactManager('call')}
            className="w-full"
            variant="outline"
            disabled={!manager.phone}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 text-success text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>Priority response within 1-6 hours guaranteed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DedicatedAccountManager;
