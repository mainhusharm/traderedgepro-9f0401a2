import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Twitter, Gift, Star, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

interface TreasureHuntHonorableMentionProps {
  twitterHandle: string;
  partnerHandle?: string;
  discountCode?: string;
}

export function TreasureHuntHonorableMention({ 
  twitterHandle, 
  partnerHandle = "PartnerHandle",
  discountCode = "TREASURE15"
}: TreasureHuntHonorableMentionProps) {
  useEffect(() => {
    // Smaller celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#9B59B6', '#3498DB', '#1ABC9C'],
    });
  }, []);

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `🏴‍☠️ I completed the @TraderEdgePro x @${partnerHandle} Treasure Hunt! 💪\n\n` +
      `All prizes were claimed, but I still finished the challenge!\n\n` +
      `Can you beat my time? 🏆\n\n` +
      `#TreasureHunt #Trading`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 overflow-hidden">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div className="relative inline-block">
              <Trophy className="w-20 h-20 text-muted-foreground/50" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <PartyPopper className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              All Treasures Claimed!
            </h2>
            <p className="text-muted-foreground">
              But you're still a true trader! 💪
            </p>
          </motion.div>

          {/* Completion badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
          >
            <Star className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Challenge Completed</span>
          </motion.div>

          {/* Congratulations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-lg bg-background/50 border border-primary/10"
          >
            <p className="text-sm text-muted-foreground mb-2">
              Congratulations, @{twitterHandle}!
            </p>
            <p className="text-sm text-muted-foreground">
              You completed all stages of the treasure hunt. While the main prizes were claimed by faster hunters, here's something for your effort:
            </p>
          </motion.div>

          {/* Discount code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30"
          >
            <Gift className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Consolation Prize
            </p>
            <p className="text-2xl font-bold text-amber-400 mb-2">
              15% OFF
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Your first month with TraderEdge Pro
            </p>
            <div className="inline-block px-4 py-2 rounded-lg bg-background border border-amber-500/50">
              <code className="text-lg font-mono font-bold text-amber-400">
                {discountCode}
              </code>
            </div>
          </motion.div>

          {/* Share button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              onClick={shareOnTwitter}
              className="w-full h-12 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <Twitter className="w-5 h-5" />
              Share Your Achievement
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
