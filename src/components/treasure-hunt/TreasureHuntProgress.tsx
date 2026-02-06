import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface TreasureHuntProgressProps {
  currentStage: number;
  totalStages?: number;
}

export function TreasureHuntProgress({ currentStage, totalStages = 3 }: TreasureHuntProgressProps) {
  const stages = [
    { id: 1, name: "The Riddle" },
    { id: 2, name: "Pattern Challenge" },
    { id: 3, name: "Speed Trivia" },
  ];

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {stages.slice(0, totalStages).map((stage, index) => {
          const isCompleted = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;
          
          return (
            <div key={stage.id} className="flex items-center">
              {/* Stage indicator */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted 
                    ? "hsl(var(--primary))" 
                    : isCurrent 
                      ? "hsl(var(--primary) / 0.3)" 
                      : "hsl(var(--muted))",
                }}
                className="relative flex items-center justify-center w-10 h-10 rounded-full border-2"
                style={{
                  borderColor: isCompleted || isCurrent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <span className={`text-sm font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {stage.id}
                  </span>
                )}
                
                {/* Current stage glow */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                  />
                )}
              </motion.div>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className="w-12 sm:w-20 h-0.5 mx-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary origin-left"
                  />
                  <div 
                    className="h-full bg-muted-foreground/20 -mt-0.5"
                    style={{ display: isCompleted ? 'none' : 'block' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Stage name */}
      <motion.p
        key={currentStage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-4 text-sm text-muted-foreground"
      >
        Stage {currentStage}: {stages[currentStage - 1]?.name}
      </motion.p>
    </div>
  );
}
