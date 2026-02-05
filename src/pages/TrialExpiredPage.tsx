import { motion } from 'framer-motion';
import { Clock, CheckCircle, ArrowRight, Zap, Shield, Bot, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const TrialExpiredPage = () => {
  const navigate = useNavigate();

  const featuresYouTried = [
    { icon: Zap, label: 'VIP Trading Signals' },
    { icon: Bot, label: 'AI Trading Coach' },
    { icon: BarChart3, label: 'Performance Analytics' },
    { icon: Shield, label: 'Risk Management Tools' },
    { icon: Users, label: '1-on-1 Guidance Sessions' },
  ];

  const plans = [
    {
      name: 'Pro',
      price: 97,
      description: 'Perfect for serious traders',
      features: ['All trading signals', 'AI Coach access', 'Performance tracking'],
    },
    {
      name: 'Enterprise',
      price: 197,
      description: 'For professional traders',
      features: ['Everything in Pro', '1-on-1 Guidance', 'Priority support', 'Custom strategies'],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Trial Ended Banner */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Your 24-Hour Trial Has Ended</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We hope you enjoyed exploring Trader Edge Pro! To continue accessing all features, 
              choose a plan that fits your trading journey.
            </p>
          </div>

          {/* Features You Tried */}
          <Card className="mb-12 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Features You Experienced</CardTitle>
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
          <div className="grid md:grid-cols-2 gap-6 mb-12">
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
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate(`/payment?plan=${plan.name.toLowerCase()}`)}
                    >
                      Upgrade to {plan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/pricing')}>
              View All Plans
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

export default TrialExpiredPage;
