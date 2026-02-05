import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface TreasureHuntStage2Props {
  onComplete: (score: number) => void;
}

const PATTERNS = [
  {
    id: 1,
    question: "Which candlestick pattern signals a potential BULLISH reversal?",
    options: [
      { id: "a", name: "Hammer", isCorrect: true },
      { id: "b", name: "Shooting Star", isCorrect: false },
      { id: "c", name: "Hanging Man", isCorrect: false },
      { id: "d", name: "Gravestone Doji", isCorrect: false },
    ],
  },
  {
    id: 2,
    question: "What does a long upper wick typically indicate?",
    options: [
      { id: "a", name: "Strong buying pressure", isCorrect: false },
      { id: "b", name: "Strong selling pressure", isCorrect: true },
      { id: "c", name: "Market indecision", isCorrect: false },
      { id: "d", name: "Low volume", isCorrect: false },
    ],
  },
  {
    id: 3,
    question: "Which pattern is formed when the closing price equals the opening price?",
    options: [
      { id: "a", name: "Marubozu", isCorrect: false },
      { id: "b", name: "Engulfing", isCorrect: false },
      { id: "c", name: "Doji", isCorrect: true },
      { id: "d", name: "Hammer", isCorrect: false },
    ],
  },
];

export function TreasureHuntStage2({ onComplete }: TreasureHuntStage2Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeout();
    }
  }, [timeLeft, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    setIsCorrect(false);
    toast.error("Time's up!");
    
    setTimeout(() => {
      moveToNext();
    }, 1500);
  };

  const handleAnswer = (optionId: string) => {
    if (showResult) return;
    
    const pattern = PATTERNS[currentQuestion];
    const selected = pattern.options.find(o => o.id === optionId);
    const correct = selected?.isCorrect || false;
    
    setSelectedAnswer(optionId);
    setShowResult(true);
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      toast.success("Correct! 🎯");
    } else {
      toast.error("Wrong answer!");
    }
    
    setTimeout(() => {
      moveToNext();
    }, 1500);
  };

  const moveToNext = () => {
    if (currentQuestion < PATTERNS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(30);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Completed all questions
      const finalScore = score + (isCorrect ? 0 : 0); // Score already updated
      onComplete(finalScore);
    }
  };

  const pattern = PATTERNS[currentQuestion];
  const timerColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-amber-400" : "text-green-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1}/{PATTERNS.length}
            </span>
            <motion.div 
              className={`flex items-center gap-1 ${timerColor}`}
              animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Timer className="w-4 h-4" />
              <span className="font-mono font-bold">{timeLeft}s</span>
            </motion.div>
          </div>
          
          <div className="flex gap-1 mb-4">
            {PATTERNS.map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < currentQuestion ? "bg-primary" : 
                  i === currentQuestion ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
          
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-primary" />
            Pattern Recognition
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Question */}
          <motion.p 
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-medium text-center"
          >
            {pattern.question}
          </motion.p>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="wait">
              {pattern.options.map((option, index) => {
                const isSelected = selectedAnswer === option.id;
                const showCorrect = showResult && option.isCorrect;
                const showWrong = showResult && isSelected && !option.isCorrect;
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => handleAnswer(option.id)}
                      disabled={showResult}
                      className={`w-full h-auto py-4 px-4 text-left flex items-center justify-between transition-all ${
                        showCorrect 
                          ? "border-green-500 bg-green-500/20 text-green-400" 
                          : showWrong 
                            ? "border-red-500 bg-red-500/20 text-red-400"
                            : isSelected
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/50"
                      }`}
                    >
                      <span>{option.name}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-400" />}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Score */}
          <div className="text-center pt-4 border-t border-primary/10">
            <p className="text-sm text-muted-foreground">
              Current Score: <span className="font-bold text-primary">{score}/{PATTERNS.length}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
