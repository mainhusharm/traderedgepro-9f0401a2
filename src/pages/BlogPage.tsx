import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Search, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/common/SEO';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  target_keyword: string | null;
  created_at: string;
  published_at: string | null;
}

const categories = ['All', 'Trading Strategy', 'Prop Trading', 'Technology', 'Psychology', 'Automation', 'Market Analysis'];

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('marketing_blog_posts_v2')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'All' || post.target_keyword?.includes(selectedCategory.toLowerCase());
    return matchesSearch && (selectedCategory === 'All' || matchesCategory);
  });

  const getPostImage = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&h=400&fit=crop',
    ];
    return images[index % images.length];
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trading Insights & Prop Firm Challenge Tips"
        description="Expert trading analysis, prop firm challenge strategies, and market insights to help you become a consistently profitable funded trader."
        keywords="trading blog, prop firm tips, trading strategies, market analysis, forex signals, funded trading tips"
        canonicalUrl="https://traderedgepro.com/blog"
      />
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trading <span className="gradient-text">Insights</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert analysis, trading strategies, and market insights to help you become a better trader.
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div 
            className="flex flex-col md:flex-row gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'btn-glow' : ''}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No articles found. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link to={`/blog/${filteredPosts[0].id}`}>
                  <div className="relative rounded-2xl overflow-hidden group">
                    <img 
                      src={getPostImage(0)} 
                      alt={filteredPosts[0].title}
                      className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      {filteredPosts[0].target_keyword && (
                        <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-sm mb-4">
                          {filteredPosts[0].target_keyword}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {filteredPosts[0].title}
                      </h2>
                      <p className="text-muted-foreground mb-4 max-w-2xl">{filteredPosts[0].excerpt || 'Read more...'}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(filteredPosts[0].published_at || filteredPosts[0].created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Posts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.slice(1).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Link to={`/blog/${post.id}`}>
                      <div className="glass-card rounded-2xl overflow-hidden group h-full">
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={getPostImage(index + 1)} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {post.target_keyword && (
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-primary rounded-full text-xs">
                                {post.target_keyword}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt || 'Read more...'}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                            Read More <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
