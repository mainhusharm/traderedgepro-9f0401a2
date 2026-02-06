import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Share2, Twitter, Linkedin, Facebook, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEO from '@/components/common/SEO';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  target_keyword: string | null;
  meta_description: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('marketing_blog_posts_v2')
        .select('*')
        .eq('id', slug)
        .maybeSingle();

      if (!error && data) {
        setPost(data);
      }
      setIsLoading(false);
    };
    fetchPost();
  }, [slug]);

  const getPostImage = () => {
    const images = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&h=600&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop',
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
            <Link to="/blog">
              <Button className="btn-glow">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const articleSchema = {
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.meta_description || 'Read this article on TraderEdge Pro',
    author: {
      '@type': 'Organization',
      name: 'TraderEdge Pro',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TraderEdge Pro',
      logo: {
        '@type': 'ImageObject',
        url: 'https://traderedgepro.com/favicon.png',
      },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.created_at,
    image: getPostImage(),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.title}
        description={post.meta_description || post.excerpt || 'Read this article on TraderEdge Pro'}
        keywords={post.target_keyword || 'trading, prop firm, forex, funded trading'}
        canonicalUrl={`https://traderedgepro.com/blog/${post.id}`}
        ogType="article"
        ogImage={getPostImage()}
        article={{
          publishedTime: post.published_at || post.created_at,
          modifiedTime: post.created_at,
          author: 'TraderEdge Pro',
          section: post.target_keyword || 'Trading',
        }}
        schema={articleSchema}
      />
      <Header />
      
      <main className="pt-32 pb-20">
        <article className="container mx-auto px-6 max-w-4xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </motion.div>

          {/* Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {post.target_keyword && (
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-sm mb-4">
                {post.target_keyword}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold mb-6">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </motion.header>

          {/* Featured Image */}
          <motion.div
            className="relative rounded-2xl overflow-hidden mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <img 
              src={getPostImage()} 
              alt={post.title}
              className="w-full h-[400px] object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            className="prose prose-invert prose-lg max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-card p-8 rounded-2xl">
              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-6 italic">{post.excerpt}</p>
              )}
              <div className="whitespace-pre-wrap">{post.content || 'Content coming soon...'}</div>
            </div>
          </motion.div>

          {/* Share */}
          <motion.div
            className="mt-12 flex items-center gap-4 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="w-5 h-5" />
              Share this article:
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
