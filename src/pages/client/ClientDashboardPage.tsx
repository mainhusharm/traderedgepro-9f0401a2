import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  LogOut, 
  User,
  Loader2 
} from 'lucide-react';
import { callEdgeFunction } from '@/config/api';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  permissions: {
    can_view_journal?: boolean;
    can_view_signals?: boolean;
    can_view_performance?: boolean;
  };
  agentName?: string;
}

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndLoad = async () => {
      const sessionToken = sessionStorage.getItem('client_session_token');
      
      if (!sessionToken) {
        navigate('/client', { replace: true });
        return;
      }

      try {
        const { data, error } = await callEdgeFunction('validate-client-session', { sessionToken });

        if (error || !data?.valid) {
          sessionStorage.removeItem('client_session_token');
          sessionStorage.removeItem('client_info');
          navigate('/client', { replace: true });
          return;
        }

        setClient(data.client);
      } catch (err) {
        console.error('Session error:', err);
        navigate('/client', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    validateAndLoad();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('client_session_token');
    sessionStorage.removeItem('client_info');
    navigate('/client', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const permissions = client.permissions || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{client.name || 'Welcome'}</h1>
              <p className="text-sm text-muted-foreground">
                Managed by {client.agentName || 'Your Agent'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {permissions.can_view_signals && (
                <TabsTrigger value="signals">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Signals
                </TabsTrigger>
              )}
              {permissions.can_view_journal && (
                <TabsTrigger value="journal">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Journal
                </TabsTrigger>
              )}
              {permissions.can_view_performance && (
                <TabsTrigger value="performance">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
              )}
            </TabsList>

            {permissions.can_view_signals && (
              <TabsContent value="signals">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Trading Signals
                    </CardTitle>
                    <CardDescription>
                      View trading signals shared with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No signals available yet</p>
                      <p className="text-sm">Your agent will share signals with you here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {permissions.can_view_journal && (
              <TabsContent value="journal">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Trade Journal
                    </CardTitle>
                    <CardDescription>
                      Your trading journal entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No journal entries yet</p>
                      <p className="text-sm">Start logging your trades</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {permissions.can_view_performance && (
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Performance Analytics
                    </CardTitle>
                    <CardDescription>
                      Your trading performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Trades</p>
                            <p className="text-3xl font-bold text-primary">0</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Win Rate</p>
                            <p className="text-3xl font-bold text-green-500">0%</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total P&L</p>
                            <p className="text-3xl font-bold">$0.00</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* No permissions message */}
          {!permissions.can_view_signals && !permissions.can_view_journal && !permissions.can_view_performance && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No features enabled</p>
                  <p className="text-sm">Contact your agent to enable dashboard features</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ClientDashboardPage;
