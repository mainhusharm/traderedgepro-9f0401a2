import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Send, Trophy, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

const propFirms = [
  'FTMO',
  'FundedNext',
  'MyFundedFX',
  'The5ers',
  'E8 Funding',
  'Blue Guardian',
  'Funded Trading Plus',
  'True Forex Funds',
  'Other'
];

const accountSizes = [
  '$10,000',
  '$25,000',
  '$50,000',
  '$100,000',
  '$200,000',
  '$400,000+'
];

const SubmitStoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    propFirm: '',
    accountSize: '',
    quote: '',
    rating: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.propFirm || !formData.accountSize || !formData.quote) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Using type assertion for newly created table
      const { error } = await supabase.from('testimonials' as any).insert({
        user_id: user?.id || null,
        name: formData.name,
        prop_firm: formData.propFirm,
        account_size: formData.accountSize,
        quote: formData.quote,
        rating: formData.rating,
        is_verified: !!user,
        status: 'pending'
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Story Submitted!",
        description: "Thank you for sharing your success story. We'll review it shortly.",
      });
    } catch (error) {
      console.error('Error submitting story:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-green-500/8 rounded-full blur-[150px]" />
        </div>
        <Header />
        <main className="relative pt-32 md:pt-40 pb-20 px-6">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Thank You!</h1>
              <p className="text-white/40 mb-8 font-light">
                Your success story has been submitted for review. Once approved, it will appear
                on our case studies page to inspire other traders.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/case-studies')} className="rounded-full px-6 bg-green-500 hover:bg-green-400 text-black">
                  View Success Stories
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="rounded-full px-6 bg-transparent border-white/10 hover:border-green-500/30 hover:bg-white/5 text-white">
                  Back to Home
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero - Left aligned */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 mb-6">
                <Trophy className="w-3.5 h-3.5" />
                Share Your Journey
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Submit your</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">success story</span>
              </h1>

              <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed font-light">
                Got funded? Passed a challenge? We'd love to feature your story to inspire other traders.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="relative pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Your Success Story</CardTitle>
                <CardDescription>
                  Fill in the details below. All submissions are reviewed before being published.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name (or Initials) *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Marcus J. or MJ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can use initials or a nickname for privacy
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prop Firm *</Label>
                      <Select
                        value={formData.propFirm}
                        onValueChange={(value) => setFormData({ ...formData, propFirm: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select firm" />
                        </SelectTrigger>
                        <SelectContent>
                          {propFirms.map((firm) => (
                            <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Size *</Label>
                      <Select
                        value={formData.accountSize}
                        onValueChange={(value) => setFormData({ ...formData, accountSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountSizes.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote">Your Story *</Label>
                    <Textarea
                      id="quote"
                      placeholder="Share your experience with TraderEdge AI. What helped you pass? What was the biggest challenge? How did you overcome it?"
                      rows={5}
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters. Be specific about what helped you succeed!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              rating <= formData.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Your Story
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to have your story published on our website. 
                    We may edit for clarity and length.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmitStoryPage;
