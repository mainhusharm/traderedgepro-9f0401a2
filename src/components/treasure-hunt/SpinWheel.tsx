import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface SpinWheelProps {
  participants: { id: string; twitter_handle: string }[];
  onSpinComplete: (winnerId: string, winnerHandle: string) => void;
  disabled?: boolean;
  spinsRemaining: number;
}

export function SpinWheel({ participants, onSpinComplete, disabled, spinsRemaining }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const segmentAngle = 360 / participants.length;

  const spin = () => {
    if (isSpinning || disabled || participants.length === 0) return;

    setIsSpinning(true);
    setSelectedWinner(null);

    // Random number of full rotations (3-6) plus random segment
    const fullRotations = 3 + Math.floor(Math.random() * 4);
    const randomSegment = Math.floor(Math.random() * participants.length);
    const extraDegrees = randomSegment * segmentAngle + segmentAngle / 2;
    const totalRotation = rotation + (fullRotations * 360) + extraDegrees;

    setRotation(totalRotation);

    // Calculate winner based on where pointer lands
    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const winnerIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) % 360 / segmentAngle) % participants.length;
      const winner = participants[winnerIndex];
      
      setSelectedWinner(winner.twitter_handle);
      setIsSpinning(false);
      
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      onSpinComplete(winner.id, winner.twitter_handle);
    }, 4000);
  };

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <p>No participants available for spinning</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative w-80 h-80">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-amber-500 drop-shadow-lg" />
        </div>

        {/* Spinning Wheel */}
        <motion.div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-primary/30 overflow-hidden relative shadow-2xl"
          style={{ transformOrigin: "center center" }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {participants.map((participant, index) => {
            const startAngle = index * segmentAngle;
            const midAngle = startAngle + segmentAngle / 2;
            const color = colors[index % colors.length];
            
            return (
              <div
                key={participant.id}
                className="absolute w-full h-full"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startAngle + segmentAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle + segmentAngle - 90) * Math.PI / 180)}%)`,
                  backgroundColor: color,
                }}
              >
                <div
                  className="absolute text-xs font-bold text-white truncate max-w-[80px]"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `rotate(${midAngle}deg) translateY(-100px) rotate(90deg)`,
                    transformOrigin: "0 0",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  @{participant.twitter_handle.length > 10 
                    ? participant.twitter_handle.substring(0, 10) + "..." 
                    : participant.twitter_handle}
                </div>
              </div>
            );
          })}
          
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Winner Display */}
      {selectedWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 rounded-xl bg-amber-500/20 border border-amber-500/30"
        >
          <p className="text-sm text-muted-foreground mb-1">Selected Winner:</p>
          <p className="text-2xl font-bold text-amber-400">@{selectedWinner}</p>
        </motion.div>
      )}

      {/* Spin Button */}
      <Button
        onClick={spin}
        disabled={isSpinning || disabled || spinsRemaining <= 0}
        size="lg"
        className="gap-2 h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
      >
        {isSpinning ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            Spinning...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            SPIN THE WHEEL ({spinsRemaining} left)
          </>
        )}
      </Button>
    </div>
  );
}
