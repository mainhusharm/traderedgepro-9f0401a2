import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TreasureHuntPrizeCounterProps {
  totalPrizes?: number;
  onCountChange?: (remaining: number) => void;
}

export function TreasureHuntPrizeCounter({ 
  totalPrizes = 3,
  onCountChange 
}: TreasureHuntPrizeCounterProps) {
  const [winnersCount, setWinnersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchWinnersCount();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('treasure-hunt-winners')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treasure_hunt_entries',
          filter: 'is_winner=eq.true'
        },
        () => {
          fetchWinnersCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWinnersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('treasure_hunt_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_winner', true);
      
      if (!error && count !== null) {
        setWinnersCount(count);
        onCountChange?.(totalPrizes - count);
      }
    } catch (err) {
      console.error('Error fetching winners count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = Math.max(0, totalPrizes - winnersCount);
  const isAllClaimed = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={remaining}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border ${
            isAllClaimed 
              ? "bg-muted/50 border-muted-foreground/30" 
              : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : isAllClaimed ? (
            <>
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="text-lg font-bold text-muted-foreground">
                All Treasures Claimed!
              </span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
              <span className="text-lg font-bold text-amber-400">
                {remaining} {remaining === 1 ? "Treasure" : "Treasures"} Remaining!
              </span>
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Prize indicators */}
      {!isLoading && (
        <div className="flex justify-center gap-2 mt-3">
          {[...Array(totalPrizes)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-3 h-3 rounded-full ${
                i < winnersCount 
                  ? "bg-muted-foreground/30" 
                  : "bg-amber-400"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
