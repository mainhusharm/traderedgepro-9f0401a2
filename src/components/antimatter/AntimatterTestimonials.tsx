import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "TraderEdge Pro completely changed my approach to prop firm challenges. I passed my FTMO challenge on the first try with their AI signals and risk management.",
    name: "Michael R.",
    role: "Funded Trader",
    company: "FTMO",
  },
  {
    quote: "The Risk Guard Protocol saved me from blowing my account multiple times. Now I'm consistently profitable with 3 funded accounts totaling $350K.",
    name: "Sarah K.",
    role: "Professional Trader",
    company: "The Funded Trader",
  },
  {
    quote: "I tried 5 other signal services before finding TraderEdge. The difference is night and day - the AI reasoning and personalized risk management actually work.",
    name: "James T.",
    role: "Part-time Trader",
    company: "E8 Funding",
  },
];

const AntimatterTestimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-32 relative overflow-hidden bg-[#0a0a0f]">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white">
            What our clients
          </h2>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#a5b4fc] italic mt-2">
            say about us
          </h2>
        </motion.div>
        
        {/* Testimonial display */}
        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              {/* Large quote */}
              <div className="mb-12">
                <Quote className="w-12 h-12 text-[#6366f1]/30 mb-6" />
                <p className="text-2xl md:text-3xl lg:text-4xl text-white font-light leading-relaxed">
                  {testimonials[activeIndex].quote}
                </p>
              </div>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-1 h-12 bg-[#6366f1]" />
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {testimonials[activeIndex].name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[activeIndex].role} • {testimonials[activeIndex].company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="flex items-center gap-4 mt-12">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Dots */}
            <div className="flex gap-2 ml-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'bg-[#6366f1] w-8' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AntimatterTestimonials;
