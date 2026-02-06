import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Twitter, PartyPopper, Clock, CheckCircle2 } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

interface TreasureHuntAwaitingResultsProps {
  twitterHandle: string;
  partnerHandle: string;
  revealDate: Date;
  onRevealComplete: () => void;
}

export function TreasureHuntAwaitingResults({
  twitterHandle,
  partnerHandle,
  revealDate,
  onRevealComplete,
}: TreasureHuntAwaitingResultsProps) {
  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `🏴‍☠️ I just completed the @TraderEdgePro × @${partnerHandle} Treasure Hunt! 🎉\n\n` +
      `Now waiting for the winner reveal... Fingers crossed! 🤞\n\n` +
      `#TreasureHunt #Trading #Giveaway`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="w-8 h-8 text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Congratulations */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Hunt Complete! 🎉
            </h2>
            <p className="text-muted-foreground">
              Well done, <span className="text-primary font-semibold">@{twitterHandle}</span>!
              <br />
              You've conquered all 3 challenges!
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="py-4 px-6 rounded-xl bg-background/50 border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-4 text-amber-400">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Winners Announced In:</span>
            </div>
            <CountdownTimer 
              targetDate={revealDate} 
              onComplete={onRevealComplete}
              size="md"
            />
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p>
              <strong>3 winners</strong> will be selected via live spin wheel!
              <br />
              Each winner gets a <span className="text-amber-400 font-semibold">FREE Pro Account</span>
            </p>
          </div>

          {/* Share Button */}
          <Button
            onClick={shareOnTwitter}
            className="w-full h-12 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
          >
            <Twitter className="w-5 h-5" />
            Share Your Completion on X
          </Button>

          <p className="text-xs text-muted-foreground">
            Stay tuned for the live reveal! Winners will be notified via email and X.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
