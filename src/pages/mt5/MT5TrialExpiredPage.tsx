import { motion } from 'framer-motion';
import { Clock, CheckCircle, ArrowRight, Bot, Code, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import MT5Header from '@/components/layout/MT5Header';
import Footer from '@/components/layout/Footer';

const MT5TrialExpiredPage = () => {
  const navigate = useNavigate();

  const featuresYouTried = [
    { icon: Bot, label: 'Custom MT5 Bot Development' },
    { icon: Code, label: 'AI-Generated Trading Code' },
    { icon: Zap, label: 'Automated Strategy Execution' },
    { icon: Shield, label: 'Risk Management Parameters' },
  ];

  const plans = [
    {
      name: 'Basic Bot',
      price: 299,
      description: 'Single strategy implementation',
      features: ['1 Custom MT5 Bot', 'Basic strategy', '2 Revisions', 'Email support'],
    },
    {
      name: 'Pro Bot',
      price: 599,
      description: 'Advanced trading automation',
      features: ['1 Advanced MT5 Bot', 'Complex strategies', '5 Revisions', 'Priority support', 'Backtesting report'],
      popular: true,
    },
    {
      name: 'Enterprise Bot',
      price: 999,
      description: 'Full trading suite',
      features: ['Multiple bots', 'Custom indicators', 'Unlimited revisions', 'Dedicated support', 'Source code included'],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MT5Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Trial Ended Banner */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Your MT5 Bot Trial Has Ended</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We hope you enjoyed exploring the MT5 Bot platform! To get your custom trading bot 
              developed, choose a plan below.
            </p>
          </div>

          {/* Features You Tried */}
          <Card className="mb-12 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">What You Explored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-4">
                {featuresYouTried.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full"
                  >
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative h-full ${
                    plan.popular 
                      ? 'border-primary shadow-lg shadow-primary/20' 
                      : 'border-border/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground text-sm">/one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6 text-left">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/mt5-payment')}
                    >
                      Get {plan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/mt5-bots')}>
              Learn More About MT5 Bots
            </Button>
            <Button variant="ghost" onClick={() => navigate('/contact-support')}>
              Need Help? Contact Support
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MT5TrialExpiredPage;
