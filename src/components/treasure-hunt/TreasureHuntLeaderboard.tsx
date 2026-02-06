import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, Crown, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  position: number;
  twitterHandle: string;
  completedAt: string;
  isWinner: boolean;
}

interface TreasureHuntLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function TreasureHuntLeaderboard({ entries }: TreasureHuntLeaderboardProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{position}</span>;
    }
  };

  const getPositionStyle = (position: number, isWinner: boolean) => {
    if (!isWinner) return "bg-background/30";
    
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-700/20 to-orange-600/10 border-amber-600/30";
      default:
        return "bg-background/30";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Fastest Hunters
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No completions yet. Be the first! 🏴‍☠️
          </p>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.position}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getPositionStyle(entry.position, entry.isWinner)}`}
            >
              <div className="flex-shrink-0">
                {getPositionIcon(entry.position)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${entry.isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                  @{entry.twitterHandle}
                </p>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(entry.completedAt)}
              </div>
              
              {entry.isWinner && (
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-primary/20 text-primary">
                  WINNER
                </span>
              )}
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
