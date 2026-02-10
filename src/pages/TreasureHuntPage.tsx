import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Compass, Anchor, Gem, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
      toast.success("Let the hunt begin!");
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Compass className="w-12 h-12 text-amber-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="absolute top-40 left-10 opacity-5"
        >
          <Anchor className="w-32 h-32 text-amber-400" />
        </motion.div>
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="absolute bottom-40 right-10 opacity-5"
        >
          <MapPin className="w-24 h-24 text-amber-400" />
        </motion.div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]"
        >
          <Gem className="w-[600px] h-[600px] text-amber-400" />
        </motion.div>
      </div>

      <Header />

      {/* Hero - Left aligned like FAQ */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Limited Time Event
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">The</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Treasure</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Hunt</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                Complete 3 trading challenges to claim the treasure.
                <br />
                <span className="text-amber-400/80">@TraderEdgePro × @{CONFIG.partnerHandle}</span>
              </p>
            </motion.div>

            {/* Prize Counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TreasureHuntPrizeCounter totalPrizes={CONFIG.totalPrizes} onCountChange={setPrizesRemaining} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Content - Two column layout */}
      <section className="relative py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {gameState === "entry" && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
              >
                <div>
                  <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                    Enter Hunt
                  </h2>
                </div>
                <div>
                  <TreasureHuntEntry
                    onStart={handleStart}
                    prizesRemaining={prizesRemaining}
                    partnerHandle={CONFIG.partnerHandle}
                  />
                </div>
              </motion.div>
            )}

            {(gameState === "stage1" || gameState === "stage2" || gameState === "stage3") && (
              <motion.div
                key="stages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
              >
                <div>
                  <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                    Stage {gameState === "stage1" ? 1 : gameState === "stage2" ? 2 : 3}
                  </h2>
                </div>
                <div className="space-y-8">
                  <TreasureHuntProgress currentStage={gameState === "stage1" ? 1 : gameState === "stage2" ? 2 : 3} />
                  {gameState === "stage1" && (
                    <TreasureHuntStage1
                      onComplete={handleStage1Complete}
                      onUseHint={handleUseHint}
                      hintsUsed={entryData?.hints_used || 0}
                    />
                  )}
                  {gameState === "stage2" && <TreasureHuntStage2 onComplete={handleStage2Complete} />}
                  {gameState === "stage3" && <TreasureHuntStage3 onComplete={handleStage3Complete} />}
                </div>
              </motion.div>
            )}

            {gameState === "awaiting" && entryData && (
              <motion.div
                key="awaiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
              >
                <div>
                  <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                    Results
                  </h2>
                </div>
                <div>
                  <TreasureHuntAwaitingResults
                    twitterHandle={entryData.twitter_handle}
                    partnerHandle={CONFIG.partnerHandle}
                    revealDate={revealDate}
                    onRevealComplete={() => checkExistingEntry()}
                  />
                </div>
              </motion.div>
            )}

            {gameState === "winner" && entryData && (
              <motion.div
                key="winner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
              >
                <div>
                  <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                    Winner
                  </h2>
                </div>
                <div>
                  <TreasureHuntWinner
                    position={entryData.winner_position || 1}
                    twitterHandle={entryData.twitter_handle}
                    partnerHandle={CONFIG.partnerHandle}
                    prizes={CONFIG.prizes}
                    discountCode={entryData.discount_code}
                  />
                </div>
              </motion.div>
            )}

            {gameState === "honorable" && entryData && (
              <motion.div
                key="honorable"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
              >
                <div>
                  <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                    Thank You
                  </h2>
                </div>
                <div>
                  <TreasureHuntHonorableMention
                    twitterHandle={entryData.twitter_handle}
                    partnerHandle={CONFIG.partnerHandle}
                    discountCode={CONFIG.discountCode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Leaderboard - Two column layout */}
      {gameState !== "entry" && leaderboard.length > 0 && (
        <section className="relative py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
            >
              <div>
                <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                  Leaderboard
                </h2>
              </div>
              <div>
                <TreasureHuntLeaderboard entries={leaderboard} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="relative py-16 md:py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-white/30 font-light">
              A collaboration between{" "}
              <a
                href="https://x.com/TraderEdgePro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/80 hover:text-amber-400 transition-colors"
              >
                @TraderEdgePro
              </a>{" "}
              ×{" "}
              <a
                href={`https://x.com/${CONFIG.partnerHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/80 hover:text-amber-400 transition-colors"
              >
                @{CONFIG.partnerHandle}
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
