import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TreasureHuntStage1Props {
  onComplete: (answer: string) => void;
  onUseHint: () => void;
  hintsUsed: number;
}

const RIDDLE = {
  question: "I rise and fall but never touch the ground. Bulls love me when I'm high, bears want me down. Traders watch me every day, in red or green I sway. What am I?",
  answers: ["price", "market", "the price", "the market", "stock price", "market price"],
  hint: "Think about what every trader watches on their screen... 📈"
};

export function TreasureHuntStage1({ onComplete, onUseHint, hintsUsed }: TreasureHuntStage1Props) {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedAnswer = answer.toLowerCase().trim();
    const isCorrect = RIDDLE.answers.some(a => normalizedAnswer.includes(a));
    
    if (isCorrect) {
      toast.success("Correct! You solved the riddle! 🎉");
      onComplete(answer);
    } else {
      setAttempts(prev => prev + 1);
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500);
      
      if (attempts >= 1) {
        toast.error("Not quite right. Need a hint?");
      } else {
        toast.error("That's not it. Try again!");
      }
    }
  };

  const handleHint = () => {
    setShowHint(true);
    onUseHint();
    toast.info("Hint revealed!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <CardHeader className="text-center">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
            className="inline-block mb-4"
          >
            <HelpCircle className="w-12 h-12 text-primary mx-auto" />
          </motion.div>
          <CardTitle className="text-2xl">The Trading Riddle</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Riddle */}
          <motion.div
            className={`p-6 rounded-lg bg-primary/10 border border-primary/20 ${isWrong ? "animate-shake" : ""}`}
            style={{
              animation: isWrong ? "shake 0.5s ease-in-out" : undefined
            }}
          >
            <p className="text-lg italic text-center leading-relaxed">
              "{RIDDLE.question}"
            </p>
          </motion.div>

          {/* Hint */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
            >
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">{RIDDLE.hint}</p>
            </motion.div>
          )}

          {/* Answer form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="h-12 text-center text-lg bg-background/50"
              autoFocus
            />
            
            <div className="flex gap-3">
              {attempts >= 2 && !showHint && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHint}
                  className="flex-1 gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Use Hint
                </Button>
              )}
              
              <Button
                type="submit"
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                <Sparkles className="w-4 h-4" />
                Submit Answer
              </Button>
            </div>
          </form>

          {/* Attempts counter */}
          {attempts > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Attempts: {attempts} {attempts >= 2 && !showHint && "• Hint available!"}
            </p>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </motion.div>
  );
}
