import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileSignature, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserConsent } from '@/hooks/useUserConsent';

interface ConsentGateProps {
  children: ReactNode;
}

const ConsentGate = ({ children }: ConsentGateProps) => {
  const navigate = useNavigate();
  const { hasSignedConsent, isLoading } = useUserConsent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSignedConsent) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card max-w-lg text-center p-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-warning/20 to-destructive/20 flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-warning" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Consent Required</h2>
            <p className="text-muted-foreground mb-6">
              Before accessing trading signals, you must review and accept our terms of service, privacy policy, and risk disclosure agreement.
            </p>
            <ul className="text-left space-y-3 mb-6 text-sm">
              <li className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Terms of Service
              </li>
              <li className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Privacy Policy
              </li>
              <li className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-warning" />
                Risk Disclosure Agreement
              </li>
              <li className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Electronic Signature
              </li>
            </ul>
            <Button 
              className="btn-glow w-full" 
              onClick={() => navigate('/consent-form')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Review & Sign Agreements
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ConsentGate;
