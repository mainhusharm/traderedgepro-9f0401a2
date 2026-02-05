import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  functionName: string;
  sampleData: Record<string, any>;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'agent-invitation',
    name: 'Agent Invitation',
    description: 'Sent when inviting a new trading expert',
    functionName: 'send-agent-invitation',
    sampleData: {
      email: '',
      name: 'Test Agent',
      invitationToken: 'TEST-TOKEN-123',
    },
  },
  {
    id: 'session-reminder',
    name: 'Session Reminder',
    description: 'Sent 1 hour before scheduled guidance sessions',
    functionName: 'session-reminder',
    sampleData: {},
  },
  {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    description: 'Sent when a user books a guidance session',
    functionName: 'send-booking-confirmation',
    sampleData: {
      userEmail: '',
      userName: 'Test User',
      sessionNumber: 'GS-TEST-123',
      topic: 'Risk Management Strategy',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      description: 'Sample session description',
    },
  },
  {
    id: 'rating-notification',
    name: 'Rating Notification',
    description: 'Sent to agents when they receive a session rating',
    functionName: 'send-rating-notification',
    sampleData: {
      agentEmail: '',
      agentName: 'Test Agent',
      rating: 5,
      feedback: 'Great session!',
      sessionNumber: 'GS-TEST-123',
      topic: 'Technical Analysis',
    },
  },
  {
    id: 'payment-receipt',
    name: 'Payment Receipt',
    description: 'Sent when a payment is completed',
    functionName: 'send-payment-receipt',
    sampleData: {
      userEmail: '',
      userName: 'Test User',
      planName: 'Pro Plan',
      amount: 99.00,
      transactionId: 'TXN-TEST-123',
    },
  },
];

const EmailTemplateManager = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const handleTestSend = async (template: EmailTemplate) => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setIsSending(true);
    setTestResults(prev => ({ ...prev, [template.id]: null }));

    try {
      // Prepare sample data with the test email
      const dataWithEmail = {
        ...template.sampleData,
        email: testEmail,
        userEmail: testEmail,
        agentEmail: testEmail,
      };

      const { data, error } = await callEdgeFunction(template.functionName, dataWithEmail);

      if (error) throw error;

      setTestResults(prev => ({ ...prev, [template.id]: 'success' }));
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setTestResults(prev => ({ ...prev, [template.id]: 'error' }));
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Email Templates
        </h3>
        <p className="text-sm text-muted-foreground">
          Preview and test email templates with branded styling
        </p>
      </div>

      {/* Test Email Input */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Badge variant="outline" className="mb-1">
              Emails will be sent to this address for testing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {EMAIL_TEMPLATES.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`glass-card hover:border-primary/30 transition-colors ${
              selectedTemplate.id === template.id ? 'border-primary/50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  {testResults[template.id] === 'success' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {testResults[template.id] === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTestSend(template)}
                    disabled={isSending || !testEmail}
                  >
                    {isSending && selectedTemplate.id === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Preview Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Template Preview: {selectedTemplate.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="data">Sample Data</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg p-6 text-white">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-2">
                      {selectedTemplate.id === 'agent-invitation' && '🎉 You\'re Invited!'}
                      {selectedTemplate.id === 'session-reminder' && '⏰ Session Reminder'}
                      {selectedTemplate.id === 'booking-confirmation' && '✅ Booking Confirmed'}
                      {selectedTemplate.id === 'rating-notification' && '⭐ New Rating Received'}
                      {selectedTemplate.id === 'payment-receipt' && '🧾 Payment Receipt'}
                    </h2>
                    <p className="text-gray-400 text-sm">{selectedTemplate.description}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-300">
                      This is a preview of the email template. The actual email will include
                      dynamic content based on the recipient and context.
                    </p>
                  </div>
                  <div className="text-center">
                    <button className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 rounded-lg font-semibold">
                      Primary Action Button
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-6">
                    © {new Date().getFullYear()} TraderEdge Pro. All rights reserved.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="data">
              <ScrollArea className="h-48">
                <pre className="text-sm bg-white/5 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(
                    {
                      ...selectedTemplate.sampleData,
                      email: testEmail || '(enter test email above)',
                    },
                    null,
                    2
                  )}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateManager;
