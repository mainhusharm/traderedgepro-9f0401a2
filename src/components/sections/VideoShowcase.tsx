import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react';

const VideoShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    handlePlayClick();
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" ref={containerRef}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span 
            className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
          >
            See It In Action
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <span className="gradient-text">Watch How Traders</span>
            <br />
            <span className="text-foreground">Get Funded</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            Experience the power of AI-driven trading signals and risk management in real-time
          </motion.p>
        </motion.div>

        {/* Video container */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", damping: 25 }}
        >
          {/* Outer glow */}
          <div className="absolute -inset-4 md:-inset-8 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-3xl opacity-50" />
          
          {/* Decorative frame corners */}
          <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
          <div className="absolute -top-2 -right-2 w-12 h-12 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />

          {/* Video wrapper */}
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl shadow-primary/10 cursor-pointer group"
            onClick={handleVideoClick}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-10 pointer-events-none" />
            
            {/* Play button overlay */}
            <motion.div 
              className={`absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-sm transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
              initial={false}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pulsing rings */}
                <div className="absolute inset-0 animate-ping">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/30" />
                </div>
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur-xl" />
                
                {/* Play button */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </motion.div>
            </motion.div>

            {/* Video controls overlay */}
            <div className={`absolute bottom-4 right-4 z-30 flex items-center gap-2 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
              <motion.button
                className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background hover:border-primary/30 transition-all"
                onClick={toggleMute}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-primary" />
                )}
              </motion.button>
              <motion.button
                className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background hover:border-primary/30 transition-all"
                onClick={handleFullscreen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Video element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="https://github.com/anchalw11/photos/raw/main/TraderEdgePro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 4px)',
                backgroundSize: '100% 4px'
              }} />
            </div>
          </div>

          {/* Bottom accent line */}
          <motion.div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
        </motion.div>

        {/* Feature highlights below video */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            { label: 'Real-Time Signals', value: 'Live Demo' },
            { label: 'Risk Management', value: 'In Action' },
            { label: 'AI Analysis', value: 'Explained' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="text-center p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
              <div className="text-lg font-semibold text-primary">{item.value}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default VideoShowcase;
