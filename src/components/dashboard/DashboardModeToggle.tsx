import { motion } from 'framer-motion';
import { Building2, Wallet } from 'lucide-react';
import { useDashboardMode, DashboardMode } from '@/lib/context/DashboardModeContext';
import { cn } from '@/lib/utils';

const DashboardModeToggle = () => {
  const { mode, setMode, isLoading } = useDashboardMode();

  if (isLoading) {
    return (
      <div className="w-full h-12 bg-muted/50 rounded-xl animate-pulse" />
    );
  }

  const modes: { id: DashboardMode; label: string; icon: typeof Building2; description: string }[] = [
    { 
      id: 'prop_firm', 
      label: 'Prop Firm', 
      icon: Building2,
      description: 'Challenge Mode'
    },
    { 
      id: 'personal_capital', 
      label: 'Personal', 
      icon: Wallet,
      description: 'Real Capital'
    },
  ];

  return (
    <div className="w-full p-1 bg-muted/30 rounded-xl border border-white/[0.08]">
      <div className="relative flex">
        {/* Animated background */}
        <motion.div
          className={cn(
            "absolute inset-y-0 rounded-lg",
            mode === 'prop_firm' 
              ? "bg-primary/20 border border-primary/30" 
              : "bg-accent/20 border border-accent/30"
          )}
          initial={false}
          animate={{
            left: mode === 'prop_firm' ? '0%' : '50%',
            width: '50%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {modes.map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-colors z-10",
              mode === item.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <item.icon className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium leading-none">{item.label}</span>
              <span className="text-[10px] opacity-60 leading-tight mt-0.5">{item.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardModeToggle;
