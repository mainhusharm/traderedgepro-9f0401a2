import { motion } from 'framer-motion';
import { Info, Target, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ManualTradeNotice = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-semibold text-lg">Manual Trade Execution Required</h3>
                <p className="text-muted-foreground mt-1">
                  All trades must be executed manually on your broker platform. Our system provides signals, trade management guidance, and risk calculations - you execute the trades yourself.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <Target className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Follow Our Signals</p>
                    <p className="text-xs text-muted-foreground">
                      Get precise entry, stop loss, and take profit levels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Use Risk Management</p>
                    <p className="text-xs text-muted-foreground">
                      Our calculator tells you exact lot sizes to use
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Execute Manually</p>
                    <p className="text-xs text-muted-foreground">
                      Place trades on your own MT4/MT5/broker platform
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2 border-t border-white/[0.08]">
                💡 <strong>Why manual trading?</strong> It gives you full control, prevents over-reliance on automation, and helps you develop real trading skills. You're always in charge of your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ManualTradeNotice;
