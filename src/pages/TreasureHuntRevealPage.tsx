import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Award, Sparkles, PartyPopper, Twitter, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { CountdownTimer } from "@/components/treasure-hunt/CountdownTimer";

interface Winner {
  id: string;
  twitter_handle: string;
  winner_position: number;
  discount_code: string | null;
}

interface HuntConfig {
  reveal_date: string;
  winners_announced: boolean;
}

export default function TreasureHuntRevealPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<HuntConfig | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealStage, setRevealStage] = useState(0);
  const [showCountdown, setShowCountdown] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription for updates
    const channel = supabase
      .channel("treasure-hunt-reveal")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treasure_hunt_config" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treasure_hunt_entries" },
        () => fetchWinners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: configData } = await (supabase
      .from("treasure_hunt_config" as any)
      .select("reveal_date, winners_announced")
      .single() as any);
    
    if (configData && !configData.error) {
      setConfig(configData as HuntConfig);
      const revealDate = new Date(configData.reveal_date);
      const now = new Date();
      console.log("Reveal date:", revealDate.toISOString(), "Now:", now.toISOString());
      
      // Only hide countdown if winners have been announced
      if (configData.winners_announced) {
        setShowCountdown(false);
      } else {
        setShowCountdown(now < revealDate);
      }
    }
    
    await fetchWinners();
    setIsLoading(false);
  };

  const fetchWinners = async () => {
    const { data } = await (supabase
      .from("treasure_hunt_entries" as any)
      .select("id, twitter_handle, winner_position, discount_code")
      .eq("announcement_status", "announced")
      .not("winner_position", "is", null)
      .order("winner_position", { ascending: true }) as any);
    
    if (data && Array.isArray(data)) {
      setWinners(data as Winner[]);
    }
  };

  const startReveal = () => {
    setShowCountdown(false);
    if (winners.length > 0) {
      revealWinners();
    }
  };

  const revealWinners = async () => {
    for (let i = winners.length; i >= 1; i--) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setRevealStage(winners.length - i + 1);
      
      // Celebrate each reveal
      confetti({
        particleCount: 50 + i * 30,
        spread: 70 + i * 20,
        origin: { y: 0.6 },
        colors: i === 1 ? ['#FFD700', '#FFA500'] : undefined,
      });
    }
  };

  const getPositionData = (position: number) => {
    switch (position) {
      case 1:
        return {
          icon: Crown,
          color: "text-amber-400",
          bgColor: "from-amber-500/30 to-yellow-500/20",
          borderColor: "border-amber-500",
          label: "1ST PLACE",
        };
      case 2:
        return {
          icon: Medal,
          color: "text-gray-300",
          bgColor: "from-gray-400/30 to-gray-300/20",
          borderColor: "border-gray-400",
          label: "2ND PLACE",
        };
      case 3:
        return {
          icon: Award,
          color: "text-amber-600",
          bgColor: "from-amber-700/30 to-orange-600/20",
          borderColor: "border-amber-600",
          label: "3RD PLACE",
        };
      default:
        return {
          icon: Trophy,
          color: "text-primary",
          bgColor: "from-primary/30 to-primary/10",
          borderColor: "border-primary",
          label: "WINNER",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  const revealDate = config ? new Date(config.reveal_date) : new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 4 + Math.random() * 4,
              delay: Math.random() * 4,
            }}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/treasure-hunt")}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hunt
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600">
              🏆 Winner Reveal
            </span>
          </motion.h1>
          <p className="text-lg text-muted-foreground">
            The treasure hunt champions are about to be announced!
          </p>
        </motion.div>

        {/* Countdown or Winners */}
        <AnimatePresence mode="wait">
          {showCountdown && new Date() < revealDate ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="border-2 border-primary/30">
                <CardContent className="py-12 text-center">
                  <PartyPopper className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-8">Winners will be revealed in...</h2>
                  <CountdownTimer 
                    targetDate={revealDate} 
                    onComplete={startReveal}
                    size="lg"
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="winners"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {winners.length === 0 ? (
                <Card className="border-2 border-primary/30">
                  <CardContent className="py-12 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Winners Not Yet Announced</h2>
                    <p className="text-muted-foreground">
                      Check back soon! The admin will spin the wheel to select winners.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {/* Display in reverse order: 3rd, 2nd, 1st */}
                  {[...winners].reverse().map((winner, index) => {
                    const posData = getPositionData(winner.winner_position);
                    const Icon = posData.icon;
                    const shouldShow = revealStage >= winners.length - index;

                    return (
                      <AnimatePresence key={winner.id}>
                        {shouldShow && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                          >
                            <Card className={`border-2 ${posData.borderColor} bg-gradient-to-r ${posData.bgColor} overflow-hidden`}>
                              <CardContent className="py-6 flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${posData.color} bg-background/50`}>
                                  <Icon className="w-10 h-10" />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold ${posData.color} uppercase tracking-wider`}>
                                    {posData.label}
                                  </p>
                                  <p className="text-2xl font-bold text-foreground">
                                    @{winner.twitter_handle}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    🎁 Prize: 1 Month FREE Pro Account
                                  </p>
                                </div>
                                <a
                                  href={`https://x.com/${winner.twitter_handle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 rounded-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white transition-colors"
                                >
                                  <Twitter className="w-5 h-5" />
                                </a>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    );
                  })}
                </div>
              )}

              {/* Celebration button */}
              {winners.length > 0 && revealStage >= winners.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <Button
                    onClick={() => {
                      confetti({
                        particleCount: 200,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
                      });
                    }}
                    className="gap-2 h-14 px-8 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
                  >
                    <Sparkles className="w-5 h-5" />
                    Celebrate Winners! 🎊
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
