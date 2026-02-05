import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Timer } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, onComplete, size = "md" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const sizeClasses = {
    sm: { container: "gap-2", number: "text-2xl", label: "text-[10px]", box: "w-14 h-14" },
    md: { container: "gap-3", number: "text-3xl", label: "text-xs", box: "w-18 h-18" },
    lg: { container: "gap-4", number: "text-5xl", label: "text-sm", box: "w-24 h-24" },
  }[size];

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
      >
        <Timer className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-amber-400">Time's Up!</h3>
        <p className="text-muted-foreground">The reveal is now live!</p>
      </motion.div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm uppercase tracking-wider">Reveal Countdown</span>
      </div>
      
      <div className={`flex justify-center ${sizeClasses.container}`}>
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className={`${sizeClasses.box} flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30`}>
              <motion.span
                key={unit.value}
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${sizeClasses.number} font-black text-primary tabular-nums`}
              >
                {String(unit.value).padStart(2, "0")}
              </motion.span>
            </div>
            <span className={`${sizeClasses.label} mt-2 text-muted-foreground uppercase tracking-wider font-medium`}>
              {unit.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
