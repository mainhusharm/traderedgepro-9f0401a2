import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "Third attempt at a prop challenge and finally cracked it. The risk management tools made all the difference - stopped me from revenge trading when I was down.",
    name: "Ravi Kumar",
    role: "Funded Trader",
    company: "E8 Markets $100K",
    location: "Mumbai, India",
    timeline: "Payout: $3,305",
  },
  {
    quote: "Was skeptical at first ngl. Tried so many signal services before and they were all trash. This one actually explains the reasoning behind each setup.",
    name: "James Miller",
    role: "Funded Trader",
    company: "Blueberry Funded $100K",
    location: "Dallas, USA",
    timeline: "Payout: $5,120",
  },
  {
    quote: "Quit my accounting job 6 months ago to trade full time. Everyone thought I was nuts. Just got my biggest payout yet. Whos laughing now lol",
    name: "Lisa Brown",
    role: "Full-time Trader",
    company: "Funded Trading Plus $200K",
    location: "Toronto, Canada",
    timeline: "Payout: $7,850",
  },
  {
    quote: "Almost 10k in one payout. Still feels surreal tbh. Failed 5 challenges before finding TraderEdge. The difference was learning to actually wait for the right setups.",
    name: "Sarah Jones",
    role: "Professional Trader",
    company: "Funded Trading Plus $200K",
    location: "London, UK",
    timeline: "Payout: $9,950",
  },
  {
    quote: "Twelve thousand dollars. From my laptop. While working my day job. My coworkers have no idea I made more from trading this month than my salary.",
    name: "David Kim",
    role: "Funded Trader",
    company: "Funded Trader Markets $200K",
    location: "Los Angeles, USA",
    timeline: "Payout: $12,000",
  },
  {
    quote: "Finally a service that works for Singapore timezone. Used to wake up at 3am for signals. Now I trade during lunch and after work. Life changing honestly.",
    name: "Wei Chen",
    role: "Part-time Trader",
    company: "Blueberry Funded $100K",
    location: "Singapore",
    timeline: "Payout: $3,850",
  },
  {
    quote: "Dubai is full of fake gurus flexing rented lambos. I just wanted something that actually works. No flexing, just consistent payouts every month.",
    name: "Omar Al-Fayed",
    role: "Funded Trader",
    company: "Funded Trading Plus $150K",
    location: "Dubai, UAE",
    timeline: "Payout: $6,210",
  },
  {
    quote: "Earning in USD while living in Mexico is basically a cheat code. My cost of living is low and my income keeps growing. Best decision I ever made.",
    name: "Mateo Cruz",
    role: "Full-time Trader",
    company: "Funded Trader Markets $100K",
    location: "Mexico City, Mexico",
    timeline: "Payout: $4,990",
  },
  {
    quote: "Software engineer by day, trader by night. The automated risk calculations appeal to my engineering brain. No emotions, just math. Thats how I like it.",
    name: "Arjun Patel",
    role: "Software Engineer",
    company: "Blueberry Funded $50K",
    location: "Bangalore, India",
    timeline: "Payout: $2,409",
  },
  {
    quote: "First payout ever from trading. Its not huge but its REAL. Everyone here thinks forex is a scam because of all the ponzi schemes. This proved them wrong.",
    name: "Ngozi Okafor",
    role: "Funded Trader",
    company: "FundedHive $100K",
    location: "Lagos, Nigeria",
    timeline: "Payout: $1,000",
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
                <div className="w-1 h-20 bg-[#6366f1]" />
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {testimonials[activeIndex].name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[activeIndex].role} • {testimonials[activeIndex].company}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {testimonials[activeIndex].location}
                  </p>
                  <p className="text-xs text-[#6366f1] mt-1 font-medium">
                    {testimonials[activeIndex].timeline}
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
