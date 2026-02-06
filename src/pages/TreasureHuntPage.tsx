import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Compass, Anchor, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { TreasureHuntEntry } from "@/components/treasure-hunt/TreasureHuntEntry";
import { TreasureHuntProgress } from "@/components/treasure-hunt/TreasureHuntProgress";
import { TreasureHuntStage1 } from "@/components/treasure-hunt/TreasureHuntStage1";
import { TreasureHuntStage2 } from "@/components/treasure-hunt/TreasureHuntStage2";
import { TreasureHuntStage3 } from "@/components/treasure-hunt/TreasureHuntStage3";
import { TreasureHuntWinner } from "@/components/treasure-hunt/TreasureHuntWinner";
import { TreasureHuntHonorableMention } from "@/components/treasure-hunt/TreasureHuntHonorableMention";
import { TreasureHuntLeaderboard } from "@/components/treasure-hunt/TreasureHuntLeaderboard";
import { TreasureHuntPrizeCounter } from "@/components/treasure-hunt/TreasureHuntPrizeCounter";
import { TreasureHuntAwaitingResults } from "@/components/treasure-hunt/TreasureHuntAwaitingResults";

const CONFIG = {
  partnerHandle: "PartnerHandle",
  prizes: ["1st Prize TBD", "2nd Prize TBD", "3rd Prize TBD"],
  totalPrizes: 3,
  discountCode: "TREASURE15",
};

type GameState = "entry" | "stage1" | "stage2" | "stage3" | "awaiting" | "winner" | "honorable";

interface EntryData {
  id: string;
  email: string;
  twitter_handle: string;
  current_stage: number;
  hints_used: number;
  is_winner: boolean;
  winner_position: number | null;
  announcement_status?: string;
  discount_code?: string;
  completed_at?: string;
}

interface LeaderboardEntry {
  position: number;
  twitterHandle: string;
  completedAt: string;
  isWinner: boolean;
}

export default function TreasureHuntPage() {
  const [gameState, setGameState] = useState<GameState>("entry");
  const [entryData, setEntryData] = useState<EntryData | null>(null);
  const [prizesRemaining, setPrizesRemaining] = useState(CONFIG.totalPrizes);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealDate, setRevealDate] = useState<Date>(new Date("2026-01-24T00:00:00Z"));

  useEffect(() => {
    checkExistingEntry();
    fetchLeaderboard();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("treasure_hunt_config")
      .select("reveal_date")
      .single();
    if (data) {
      setRevealDate(new Date(data.reveal_date));
    }
  };

  const checkExistingEntry = async () => {
    const savedEmail = localStorage.getItem("treasure_hunt_email");
    
    if (savedEmail) {
      const { data, error } = await supabase
        .from("treasure_hunt_entries")
        .select("*")
        .eq("email", savedEmail)
        .maybeSingle();
      
      if (data && !error) {
        setEntryData(data as EntryData);
        
        if (data.announcement_status === "announced" && data.is_winner) {
          setGameState("winner");
        } else if (data.completed_at) {
          setGameState("awaiting");
        } else if (data.current_stage === 1) {
          setGameState("stage1");
        } else if (data.current_stage === 2) {
          setGameState("stage2");
        } else if (data.current_stage === 3) {
          setGameState("stage3");
        }
      }
    }
    setIsLoading(false);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("treasure_hunt_entries")
      .select("twitter_handle, completed_at, is_winner, winner_position")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true })
      .limit(10);
    
    if (data) {
      setLeaderboard(data.map((entry, index) => ({
        position: index + 1,
        twitterHandle: entry.twitter_handle,
        completedAt: entry.completed_at!,
        isWinner: entry.is_winner || false,
      })));
    }
  };

  const handleStart = async (email: string, twitterHandle: string) => {
    try {
      const { data: existing } = await supabase
        .from("treasure_hunt_entries")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      
      if (existing) {
        toast.error("This email has already entered the hunt!");
        return;
      }

      const { data, error } = await supabase
        .from("treasure_hunt_entries")
        .insert({ email, twitter_handle: twitterHandle, partner_followed: true, traderedge_followed: true, current_stage: 1 })
        .select()
        .single();
      
      if (error) throw error;
      
      localStorage.setItem("treasure_hunt_email", email);
      setEntryData(data as EntryData);
      setGameState("stage1");
      toast.success("Let the hunt begin! 🏴‍☠️");
    } catch (err) {
      console.error("Error starting hunt:", err);
      toast.error("Failed to start. Please try again.");
    }
  };

  const updateEntry = async (updates: Partial<EntryData>) => {
    if (!entryData?.id) return;
    await supabase.from("treasure_hunt_entries").update(updates).eq("id", entryData.id);
    setEntryData(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleStage1Complete = async (answer: string) => {
    await updateEntry({ stage_1_answer: answer, current_stage: 2 } as any);
    setGameState("stage2");
  };

  const handleStage2Complete = async (score: number) => {
    await updateEntry({ stage_2_score: score, current_stage: 3 } as any);
    setGameState("stage3");
  };

  const handleStage3Complete = async (score: number, timeSpent: number) => {
    if (score < 3) {
      toast.error("You need at least 3/5 correct to pass. Try again!");
      return;
    }

    await supabase.from("treasure_hunt_entries").update({
      stage_3_score: score,
      stage_3_time: timeSpent,
      completed_at: new Date().toISOString(),
      current_stage: 4,
    }).eq("id", entryData?.id);
    
    setEntryData(prev => prev ? { ...prev, completed_at: new Date().toISOString(), current_stage: 4 } : null);
    setGameState("awaiting");
    fetchLeaderboard();
  };

  const handleUseHint = async () => {
    await updateEntry({ hints_used: (entryData?.hints_used || 0) + 1 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Compass className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute top-20 left-10 opacity-10">
          <Anchor className="w-40 h-40 text-primary" />
        </motion.div>
        <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute bottom-20 right-10 opacity-10">
          <MapPin className="w-32 h-32 text-primary" />
        </motion.div>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
          <Gem className="w-96 h-96 text-amber-400" />
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-12">
          <motion.h1 className="text-4xl md:text-6xl font-black mb-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600">🏴‍☠️ Treasure Hunt</span>
          </motion.h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete 3 trading challenges to claim the treasure!<br />
            <span className="text-primary font-semibold">@TraderEdgePro × @{CONFIG.partnerHandle}</span>
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <TreasureHuntPrizeCounter totalPrizes={CONFIG.totalPrizes} onCountChange={setPrizesRemaining} />
        </div>

        <AnimatePresence mode="wait">
          {gameState === "entry" && <TreasureHuntEntry key="entry" onStart={handleStart} prizesRemaining={prizesRemaining} partnerHandle={CONFIG.partnerHandle} />}

          {(gameState === "stage1" || gameState === "stage2" || gameState === "stage3") && (
            <div key="stages" className="space-y-8">
              <TreasureHuntProgress currentStage={gameState === "stage1" ? 1 : gameState === "stage2" ? 2 : 3} />
              {gameState === "stage1" && <TreasureHuntStage1 onComplete={handleStage1Complete} onUseHint={handleUseHint} hintsUsed={entryData?.hints_used || 0} />}
              {gameState === "stage2" && <TreasureHuntStage2 onComplete={handleStage2Complete} />}
              {gameState === "stage3" && <TreasureHuntStage3 onComplete={handleStage3Complete} />}
            </div>
          )}

          {gameState === "awaiting" && entryData && (
            <TreasureHuntAwaitingResults key="awaiting" twitterHandle={entryData.twitter_handle} partnerHandle={CONFIG.partnerHandle} revealDate={revealDate} onRevealComplete={() => checkExistingEntry()} />
          )}

          {gameState === "winner" && entryData && (
            <TreasureHuntWinner key="winner" position={entryData.winner_position || 1} twitterHandle={entryData.twitter_handle} partnerHandle={CONFIG.partnerHandle} prizes={CONFIG.prizes} discountCode={entryData.discount_code} />
          )}

          {gameState === "honorable" && entryData && (
            <TreasureHuntHonorableMention key="honorable" twitterHandle={entryData.twitter_handle} partnerHandle={CONFIG.partnerHandle} discountCode={CONFIG.discountCode} />
          )}
        </AnimatePresence>

        {gameState !== "entry" && leaderboard.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 max-w-lg mx-auto">
            <TreasureHuntLeaderboard entries={leaderboard} />
          </motion.div>
        )}

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16 text-center text-sm text-muted-foreground">
          <p>A collaboration between <a href="https://x.com/TraderEdgePro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@TraderEdgePro</a> × <a href={`https://x.com/${CONFIG.partnerHandle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@{CONFIG.partnerHandle}</a></p>
        </motion.footer>
      </div>
    </div>
  );
}
