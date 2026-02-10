import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Search, Loader2, BookOpen } from 'lucide-react';
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

const categories = ['All', 'Trading Strategy', 'Prop Trading', 'Technology', 'Psychology'];

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
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <SEO
        title="Trading Insights & Prop Firm Challenge Tips"
        description="Expert trading analysis, prop firm challenge strategies, and market insights to help you become a consistently profitable funded trader."
        keywords="trading blog, prop firm tips, trading strategies, market analysis, forex signals, funded trading tips"
        canonicalUrl="https://traderedgepro.com/blog"
      />
      <Header />

      {/* Hero - Left aligned */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Blog
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Trading</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Insights</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                Expert analysis and strategies to help you become a better trader.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm bg-white/[0.03] border-white/[0.08] rounded-lg focus:border-purple-500/30 focus:bg-white/[0.05] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/30 transition-all duration-300 font-light"
              />
            </motion.div>
          </div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white font-medium'
                    : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.06]'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-light">No articles found. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link to={`/blog/${filteredPosts[0].id}`}>
                  <div className="group relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300">
                    <div className="grid md:grid-cols-2">
                      <div className="relative h-64 md:h-auto overflow-hidden">
                        <img
                          src={getPostImage(0)}
                          alt={filteredPosts[0].title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        {filteredPosts[0].target_keyword && (
                          <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs mb-4 w-fit border border-purple-500/20">
                            {filteredPosts[0].target_keyword}
                          </span>
                        )}
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3 group-hover:text-purple-300 transition-colors">
                          {filteredPosts[0].title}
                        </h2>
                        <p className="text-white/40 mb-4 font-light line-clamp-2">{filteredPosts[0].excerpt || 'Read more...'}</p>
                        <div className="flex items-center gap-4 text-sm text-white/30">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(filteredPosts[0].published_at || filteredPosts[0].created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Posts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.slice(1).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Link to={`/blog/${post.id}`}>
                      <div className="group rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300 h-full">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={getPostImage(index + 1)}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {post.target_keyword && (
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-purple-300 rounded-full text-xs border border-purple-500/20">
                                {post.target_keyword}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-medium mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-white/30 text-sm mb-4 line-clamp-2 font-light">{post.excerpt || 'Read more...'}</p>
                          <div className="flex items-center justify-between text-xs text-white/20">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 text-purple-400 group-hover:gap-2 transition-all">
                              Read More <ArrowRight className="w-3 h-3" />
                            </span>
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
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
