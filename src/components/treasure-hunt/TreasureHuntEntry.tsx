import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Twitter, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TreasureHuntEntryProps {
  onStart: (email: string, twitterHandle: string) => void;
  prizesRemaining: number;
  partnerHandle?: string;
}

export function TreasureHuntEntry({ onStart, prizesRemaining, partnerHandle = "PartnerHandle" }: TreasureHuntEntryProps) {
  const [email, setEmail] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [partnerFollowed, setPartnerFollowed] = useState(false);
  const [traderEdgeFollowed, setTraderEdgeFollowed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !twitterHandle) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (!partnerFollowed || !traderEdgeFollowed) {
      toast.error("Please follow both accounts to continue");
      return;
    }
    
    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    setIsLoading(true);
    // Handle cleaned up in parent
    const handle = twitterHandle.startsWith("@") ? twitterHandle.slice(1) : twitterHandle;
    onStart(email, handle);
  };

  const openTwitter = (handle: string) => {
    window.open(`https://x.com/${handle}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Prize Counter */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-lg font-bold text-amber-400">
            {prizesRemaining} {prizesRemaining === 1 ? "Treasure" : "Treasures"} Remaining!
          </span>
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
      </motion.div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-background/50 border-primary/20 focus:border-primary"
              required
            />
          </div>
          
          <div>
            <Input
              type="text"
              placeholder="Your X/Twitter handle (e.g., @yourname)"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              className="h-12 bg-background/50 border-primary/20 focus:border-primary"
              required
            />
          </div>
        </div>

        {/* Follow Buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-primary/10">
            <Checkbox
              id="partner-follow"
              checked={partnerFollowed}
              onCheckedChange={(checked) => setPartnerFollowed(checked as boolean)}
            />
            <label htmlFor="partner-follow" className="flex-1 text-sm cursor-pointer">
              Follow @{partnerHandle} on X
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTwitter(partnerHandle)}
              className="gap-1"
            >
              <Twitter className="w-4 h-4" />
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-primary/10">
            <Checkbox
              id="traderedge-follow"
              checked={traderEdgeFollowed}
              onCheckedChange={(checked) => setTraderEdgeFollowed(checked as boolean)}
            />
            <label htmlFor="traderedge-follow" className="flex-1 text-sm cursor-pointer">
              Follow @TraderEdgePro on X
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openTwitter("TraderEdgePro")}
              className="gap-1"
            >
              <Twitter className="w-4 h-4" />
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            I agree to the terms and conditions of this giveaway
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || prizesRemaining === 0}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
        >
          {prizesRemaining === 0 ? (
            "All Treasures Claimed!"
          ) : isLoading ? (
            "Starting..."
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Begin the Hunt
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
