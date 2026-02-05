import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Trash2, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMarketingAI } from '@/hooks/useMarketingAI';

interface AIChatInterfaceProps {
  employeeId: string;
  employeeName: string;
  employeeColor: string;
  placeholder?: string;
}

const AIChatInterface = ({ 
  employeeId, 
  employeeName, 
  employeeColor,
  placeholder = 'Type a message...'
}: AIChatInterfaceProps) => {
  const { messages, isLoading, isInitialized, sendMessage, clearHistory } = useMarketingAI(employeeId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const colorClass = employeeColor.includes('violet') ? 'bg-violet-600 hover:bg-violet-700' :
                     employeeColor.includes('emerald') ? 'bg-emerald-600 hover:bg-emerald-700' :
                     employeeColor.includes('pink') ? 'bg-pink-600 hover:bg-pink-700' :
                     employeeColor.includes('amber') ? 'bg-amber-600 hover:bg-amber-700' :
                     employeeColor.includes('cyan') ? 'bg-cyan-600 hover:bg-cyan-700' :
                     employeeColor.includes('indigo') ? 'bg-indigo-600 hover:bg-indigo-700' :
                     'bg-slate-600 hover:bg-slate-700';

  const dotColorClass = employeeColor.includes('violet') ? 'bg-violet-400' :
                        employeeColor.includes('emerald') ? 'bg-emerald-400' :
                        employeeColor.includes('pink') ? 'bg-pink-400' :
                        employeeColor.includes('amber') ? 'bg-amber-400' :
                        employeeColor.includes('cyan') ? 'bg-cyan-400' :
                        employeeColor.includes('indigo') ? 'bg-indigo-400' :
                        'bg-slate-400';

  return (
    <Card className="bg-background/50 backdrop-blur border-white/10 h-full flex flex-col">
      <CardHeader className="border-b border-white/10 flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="w-4 h-4 text-primary" />
          Chat with {employeeName}
        </CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearHistory} className="h-8 w-8">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {!isInitialized ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bot className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Start a conversation with {employeeName}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    {message.role === 'assistant' ? (
                      <AvatarFallback className={`bg-gradient-to-br ${employeeColor} text-white text-xs`}>
                        {employeeName[0]}
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-primary/20">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`bg-gradient-to-br ${employeeColor} text-white text-xs`}>
                      {employeeName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="flex gap-1">
                      <span className={`w-2 h-2 ${dotColorClass} rounded-full animate-bounce`} />
                      <span className={`w-2 h-2 ${dotColorClass} rounded-full animate-bounce [animation-delay:0.1s]`} />
                      <span className={`w-2 h-2 ${dotColorClass} rounded-full animate-bounce [animation-delay:0.2s]`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              className="bg-white/5 border-white/10"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className={colorClass}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatInterface;
