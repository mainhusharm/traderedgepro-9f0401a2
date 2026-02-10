import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="relative pt-32 md:pt-40 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 mb-8">
                <Search className="w-12 h-12 text-purple-400" />
              </div>

              <h1 className="text-6xl md:text-8xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">404</span>
              </h1>

              <h2 className="text-2xl md:text-3xl tracking-tight mb-4">
                <span className="font-light text-white/50">Page</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">not found</span>
              </h2>

              <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed font-light mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white"
                >
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white"
                >
                  <Link to="/contact-support">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
