import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Timer, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TreasureHuntStage3Props {
  onComplete: (score: number, timeSpent: number) => void;
}

const TRIVIA_QUESTIONS = [
  {
    id: 1,
    question: "What does RSI stand for?",
    options: ["Relative Strength Index", "Real Stock Indicator", "Risk-Safe Investment", "Rapid Signal Index"],
    correctIndex: 0,
  },
  {
    id: 2,
    question: "A green candle means the price went ___?",
    options: ["Down", "Up", "Sideways", "Unchanged"],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "What's the term for your maximum acceptable loss?",
    options: ["Take Profit", "Stop Loss", "Break Even", "Margin Call"],
    correctIndex: 1,
  },
  {
    id: 4,
    question: "FOMO in trading stands for?",
    options: ["First Order Market Open", "Fear Of Missing Out", "Fast Order Management Option", "Fund Over Market Order"],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "What tool helps identify support & resistance levels using ratios?",
    options: ["Moving Average", "Fibonacci", "Bollinger Bands", "MACD"],
    correctIndex: 1,
  },
];

export function TreasureHuntStage3({ onComplete }: TreasureHuntStage3Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [totalTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isGameOver) {
      handleGameOver();
    }
  }, [timeLeft, isGameOver]);

  const handleGameOver = () => {
    setIsGameOver(true);
    const timeSpent = totalTime - timeLeft;
    
    if (score >= 3) {
      toast.success(`Speed Trivia Complete! Score: ${score}/${TRIVIA_QUESTIONS.length}`);
    } else {
      toast.info(`You got ${score}/${TRIVIA_QUESTIONS.length}. Needed 3 to pass.`);
    }
    
    onComplete(score, timeSpent);
  };

  const handleAnswer = (optionIndex: number) => {
    if (showResult || isGameOver) return;
    
    const question = TRIVIA_QUESTIONS[currentQuestion];
    const correct = optionIndex === question.correctIndex;
    
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion < TRIVIA_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        handleGameOver();
      }
    }, 800);
  };

  const question = TRIVIA_QUESTIONS[currentQuestion];
  const timerColor = timeLeft <= 15 ? "text-red-400" : timeLeft <= 30 ? "text-amber-400" : "text-green-400";
  const timerProgress = (timeLeft / totalTime) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 overflow-hidden">
        {/* Timer bar */}
        <div className="h-2 bg-muted">
          <motion.div 
            className={`h-full ${timeLeft <= 15 ? "bg-red-500" : timeLeft <= 30 ? "bg-amber-500" : "bg-green-500"}`}
            initial={{ width: "100%" }}
            animate={{ width: `${timerProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1}/{TRIVIA_QUESTIONS.length}
            </span>
            <motion.div 
              className={`flex items-center gap-1 ${timerColor} font-mono text-xl font-bold`}
              animate={timeLeft <= 15 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Timer className="w-5 h-5" />
              {timeLeft}s
            </motion.div>
          </div>
          
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-7 h-7 text-amber-400" />
            Speed Trivia Sprint!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="p-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <p className="text-xl font-medium text-center">
                {question.question}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Options */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctIndex;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;
                
                return (
                  <motion.div
                    key={`${currentQuestion}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => handleAnswer(index)}
                      disabled={showResult}
                      className={`w-full h-auto py-4 px-6 text-left flex items-center justify-between text-base transition-all ${
                        showCorrect 
                          ? "border-green-500 bg-green-500/20 text-green-400" 
                          : showWrong 
                            ? "border-red-500 bg-red-500/20 text-red-400"
                            : "hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <span>{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Score tracker */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {TRIVIA_QUESTIONS.map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: i === currentQuestion ? 1.2 : 1,
                  backgroundColor: i < currentQuestion 
                    ? (i < score ? "hsl(var(--primary))" : "hsl(var(--destructive))")
                    : "hsl(var(--muted))"
                }}
                className="w-3 h-3 rounded-full"
              />
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Score: <span className="font-bold text-primary">{score}</span> • Need 3/5 to pass
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
