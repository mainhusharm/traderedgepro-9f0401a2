import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Twitter, Sparkles, Crown, Medal, Award, Gift, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface TreasureHuntWinnerProps {
  position: number;
  twitterHandle: string;
  partnerHandle?: string;
  prizes?: string[];
  discountCode?: string;
}

export function TreasureHuntWinner({ 
  position, 
  twitterHandle, 
  partnerHandle = "PartnerHandle",
  prizes = ["Free Pro Account", "Free Pro Account", "Free Pro Account"],
  discountCode
}: TreasureHuntWinnerProps) {
  const navigate = useNavigate();
  useEffect(() => {
    // Epic confetti celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const positionData = {
    1: { icon: Crown, color: "text-amber-400", bgColor: "from-amber-500/20 to-yellow-500/20", borderColor: "border-amber-500/50", label: "1ST PLACE" },
    2: { icon: Medal, color: "text-gray-300", bgColor: "from-gray-400/20 to-gray-300/20", borderColor: "border-gray-400/50", label: "2ND PLACE" },
    3: { icon: Award, color: "text-amber-600", bgColor: "from-amber-700/20 to-orange-600/20", borderColor: "border-amber-600/50", label: "3RD PLACE" },
  }[position] || { icon: Trophy, color: "text-primary", bgColor: "from-primary/20 to-primary/10", borderColor: "border-primary/50", label: "WINNER" };

  const Icon = positionData.icon;

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `🏴‍☠️ I just claimed the treasure at @TraderEdgePro x @${partnerHandle}! 🏆\n\n` +
      `Finished in ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : 'rd'} place!\n\n` +
      `Think you can beat me? 💰\n\n` +
      `#TreasureHunt #Trading #Giveaway`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className={`bg-gradient-to-br ${positionData.bgColor} ${positionData.borderColor} border-2 overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                scale: 0,
                opacity: 0 
              }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
              }}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <Sparkles className={`w-4 h-4 ${positionData.color}`} />
            </motion.div>
          ))}
        </div>

        <CardContent className="relative pt-8 pb-8 text-center space-y-6">
          {/* Trophy Icon */}
          <motion.div
            initial={{ y: -50, rotate: -20 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-block"
            >
              <Icon className={`w-24 h-24 ${positionData.color} drop-shadow-lg`} />
            </motion.div>
          </motion.div>

          {/* Winner Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={`text-4xl font-black ${positionData.color} mb-2`}>
              {positionData.label}
            </h2>
            <p className="text-xl font-bold text-foreground">
              WINNER! 🎉
            </p>
          </motion.div>

          {/* Certificate-style card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl bg-background/50 border border-primary/20 space-y-4"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              This certifies that
            </p>
            <p className="text-2xl font-bold text-primary">
              @{twitterHandle}
            </p>
            <p className="text-sm text-muted-foreground">
              has successfully completed the<br />
              <span className="font-semibold text-foreground">TraderEdge Pro x @{partnerHandle}</span><br />
              Treasure Hunt Challenge
            </p>
            <div className="pt-4 border-t border-primary/10 space-y-2">
              <p className="text-lg font-bold text-amber-400">
                🏆 Prize: FREE Pro Account!
              </p>
              {discountCode && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-1">Your unique code:</p>
                  <code className="text-lg font-mono font-bold text-green-400">
                    {discountCode}
                  </code>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {/* Claim Prize Button - Primary CTA */}
            {discountCode && (
              <Button
                onClick={() => navigate(`/payment-flow?plan=pro&code=${discountCode}`)}
                className="w-full h-14 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-lg"
              >
                <Gift className="w-6 h-6" />
                Claim Your Free Pro Account
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              onClick={shareOnTwitter}
              className="w-full h-12 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <Twitter className="w-5 h-5" />
              Share Your Victory on X
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 gap-2"
              onClick={() => {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              }}
            >
              <Sparkles className="w-5 h-5" />
              Celebrate Again! 🎊
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground">
            Your code is valid for 30 days. One-time use only.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
