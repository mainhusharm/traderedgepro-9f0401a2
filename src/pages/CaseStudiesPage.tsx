import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Clock, DollarSign, Target, ChevronRight, Star, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  summary: string;
  prop_firm: string;
  account_size: string;
  time_to_pass: string;
  total_profit: string;
  key_strategies: string[];
  thumbnail_url: string | null;
  published_at: string;
}

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string | null;
  prop_firm: string;
  account_size: string;
  quote: string;
  rating: number;
  is_verified: boolean;
}

const CaseStudiesPage = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch case studies - using type assertion for newly created table
      const { data: casesData } = await supabase
        .from('case_studies' as any)
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      // Fetch testimonials - using type assertion for newly created table
      const { data: testimonialData } = await supabase
        .from('testimonials' as any)
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      setCaseStudies((casesData as unknown as CaseStudy[]) || []);
      setTestimonials((testimonialData as unknown as Testimonial[]) || []);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const hasContent = caseStudies.length > 0 || testimonials.length > 0;

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
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 mb-6">
                <Trophy className="w-3.5 h-3.5" />
                Success Stories
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Real traders,</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">real results.</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                Discover how traders passed their prop firm challenges and got funded with TraderEdge Pro.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button asChild className="rounded-full px-6 bg-amber-500 hover:bg-amber-400 text-black">
                <Link to="/submit-story">
                  <Star className="w-4 h-4 mr-2" />
                  Share Your Story
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="relative pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full mb-4 rounded-lg" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasContent ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Be Our First Success Story!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                We're just getting started and would love to feature YOUR success. 
                Passed a prop firm challenge with TraderEdge? Share your journey with us!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/submit-story">
                    <Star className="w-4 h-4" />
                    Submit Your Story
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/membership">
                    Start Your Journey
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Featured Case Study */}
              {caseStudies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-12"
                >
                  <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-8">
                        <Badge className="mb-4 bg-primary">Featured Story</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                          {caseStudies[0].title}
                        </h2>
                        <p className="text-muted-foreground mb-6">{caseStudies[0].summary}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Prop Firm</p>
                              <p className="font-medium text-foreground">{caseStudies[0].prop_firm}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Account Size</p>
                              <p className="font-medium text-foreground">{caseStudies[0].account_size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Time to Pass</p>
                              <p className="font-medium text-foreground">{caseStudies[0].time_to_pass}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Total Profit</p>
                              <p className="font-medium text-green-500">{caseStudies[0].total_profit}</p>
                            </div>
                          </div>
                        </div>

                        <Button asChild className="gap-2">
                          <Link to={`/case-study/${caseStudies[0].slug}`}>
                            Read Full Story <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="relative h-64 md:h-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Trophy className="w-24 h-24 text-primary/30" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* More Case Studies Grid */}
              {caseStudies.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-16"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-6">More Success Stories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {caseStudies.slice(1).map((study, index) => (
                      <motion.div
                        key={study.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card className="h-full hover:border-primary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="outline">{study.prop_firm}</Badge>
                              <Badge variant="secondary">{study.account_size}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{study.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{study.summary}</p>
                            <Button variant="ghost" size="sm" asChild className="gap-1 p-0">
                              <Link to={`/case-study/${study.slug}`}>
                                Read More <ChevronRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Testimonials Section */}
              {testimonials.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-6">What Our Traders Say</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card className="h-full">
                          <CardContent className="p-6">
                            <div className="flex gap-1 mb-4">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                              ))}
                            </div>
                            <p className="text-foreground mb-6">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                {testimonial.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{testimonial.name}</span>
                                  {testimonial.is_verified && (
                                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {testimonial.prop_firm} • {testimonial.account_size}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudiesPage;
