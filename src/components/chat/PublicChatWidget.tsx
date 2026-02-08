import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, User, Minimize2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentRole?: string;
  isTransfer?: boolean;
}

interface PublicChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
}

const AGENT_AVATARS: Record<string, string> = {
  'Zoe': '👩‍💼',
  'Alex': '👨‍💼',
  'Nova': '👋',
};

const AGENT_GREETINGS: Record<string, string> = {
  'zoe': "Hey there! 👋 I'm Zoe. What's going on - how can I help you today?",
  'nova': "Hi! Welcome to TraderEdge! I'm Nova. What brings you here today?",
};

const PublicChatWidget = ({ position = 'bottom-right' }: PublicChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('zoe');
  const [currentAgentName, setCurrentAgentName] = useState<string>('Zoe');
  const [currentAgentRole, setCurrentAgentRole] = useState<string>('Customer Support');
  const [isTransferring, setIsTransferring] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add greeting message when chat opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: AGENT_GREETINGS[currentAgent],
        timestamp: new Date(),
        agentName: currentAgentName,
        agentRole: currentAgentRole,
      };
      setMessages([greetingMessage]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, currentAgent, currentAgentName, currentAgentRole]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleTransfer = useCallback(async (toAgent: string, reason: string) => {
    setIsTransferring(true);
    
    // Add transfer message
    const transferMessage: ChatMessage = {
      id: `transfer-${Date.now()}`,
      role: 'assistant',
      content: toAgent === 'supervisor' 
        ? `One moment — I'm connecting you with Alex, our Senior Supervisor. They'll take it from here! 🔄`
        : `Let me get you connected with the right person...`,
      timestamp: new Date(),
      agentName: currentAgentName,
      isTransfer: true,
    };
    setMessages(prev => [...prev, transferMessage]);
    
    // Simulate transfer delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update agent
    const newAgentName = toAgent === 'supervisor' ? 'Alex' : 'Zoe';
    const newAgentRole = toAgent === 'supervisor' ? 'Senior Support Supervisor' : 'Customer Support';
    
    setCurrentAgent(toAgent);
    setCurrentAgentName(newAgentName);
    setCurrentAgentRole(newAgentRole);
    
    // Add new agent greeting
    const newAgentGreeting: ChatMessage = {
      id: `greeting-${Date.now()}`,
      role: 'assistant',
      content: toAgent === 'supervisor'
        ? `Hi there, Alex here. I understand you were chatting with Zoe — I've got the full context. Let me see how I can help sort this out for you.`
        : `Hey! I'm taking over from here. What can I do for you?`,
      timestamp: new Date(),
      agentName: newAgentName,
      agentRole: newAgentRole,
    };
    setMessages(prev => [...prev, newAgentGreeting]);
    setIsTransferring(false);
  }, [currentAgentName]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isTransferring) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationMessages = messages
        .filter(m => !m.isTransfer)
        .map(m => ({ role: m.role, content: m.content }));
      
      const { data, error } = await callEdgeFunction('public-ai-chat', {
        agentId: 'zoe',
        currentAgent,
        messages: [...conversationMessages, { role: 'user', content: userMessage.content }],
        escalationContext: currentAgent === 'supervisor' ? {
          fromAgent: 'Zoe',
          reason: 'Customer requested supervisor',
          summary: conversationMessages.slice(-5).map(m => m.content).join(' | ')
        } : undefined,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        agentName: data.agent || currentAgentName,
        agentRole: data.agentRole || currentAgentRole,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle escalation
      if (data.escalate && data.escalateTo) {
        await handleTransfer(data.escalateTo, data.escalateReason);
      }

      // Handle admin escalation notification
      if (data.escalateToAdmin && data.ticketCreated) {
        toast.success('Your issue has been escalated to our management team!', {
          description: 'You\'ll receive an email confirmation shortly.'
        });
      } else if (data.ticketCreated) {
        toast.success('Support ticket created!');
      }

    } catch (err: any) {
      console.error('Chat error:', err);

      // Provide a helpful fallback response
      const fallbackResponses = [
        "Hey, I'm having a little connection hiccup! Could you try that again? If it keeps happening, feel free to email us at support@traderedgepro.com 💬",
        "Oops, my wires got crossed for a sec! Give it another shot? You can also check our FAQ page for quick answers.",
        "Sorry about that! I'm experiencing some technical difficulties. Try again in a moment, or reach out to us at support@traderedgepro.com if you need immediate help!"
      ];
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: randomFallback,
        timestamp: new Date(),
        agentName: currentAgentName,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6 bottom-4 sm:bottom-6' 
    : 'left-4 sm:left-6 bottom-4 sm:bottom-6';

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed ${positionClasses} z-50 group`}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-accent/60 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
              
              {/* Button */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              
              {/* Online indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-foreground text-background text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                Chat with us
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 520
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${positionClasses} z-50 w-[360px] max-w-[calc(100vw-32px)] bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)' 
            }}
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary/80" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
              
              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-white/20">
                      <AvatarFallback className="bg-white/20 text-white text-lg">
                        {AGENT_AVATARS[currentAgentName] || '👤'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-1.5">
                      {currentAgentName}
                      {isTransferring && <Loader2 className="w-3 h-3 animate-spin" />}
                    </h3>
                    <p className="text-xs text-white/70">{currentAgentRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                              {AGENT_AVATARS[message.agentName || currentAgentName] || '👤'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[80%] ${message.role === 'user' ? '' : ''}`}>
                          {/* Transfer indicator */}
                          {message.isTransfer && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <ArrowRight className="w-3 h-3" />
                              <span>Transferring...</span>
                            </div>
                          )}
                          
                          <div className={`rounded-2xl px-3.5 py-2.5 ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-primary to-accent text-white ml-auto' 
                              : message.isTransfer
                                ? 'bg-muted/30 border border-dashed border-white/10 text-muted-foreground italic'
                                : 'bg-muted/50 border border-white/5'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          <p className={`text-[10px] text-muted-foreground mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {message.role === 'user' && (
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              <User className="w-3.5 h-3.5" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Typing indicator */}
                    {(isLoading || isTransferring) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5"
                      >
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                            {AGENT_AVATARS[currentAgentName] || '👤'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 border border-white/5 rounded-2xl px-4 py-3">
                          <div className="flex gap-1.5">
                            <motion.span 
                              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span 
                              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.span 
                              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-white/5 bg-muted/20">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isLoading || isTransferring}
                      className="bg-background/50 border-white/10 focus:border-primary/50 rounded-xl text-sm placeholder:text-muted-foreground/50"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={isLoading || isTransferring || !input.trim()}
                      size="icon"
                      className="bg-gradient-to-r from-primary to-teal-500 hover:opacity-90 rounded-xl shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Sparkles className="w-3 h-3 text-muted-foreground/50" />
                    <p className="text-[10px] text-muted-foreground/50">
                      Powered by TraderEdge • Available 24/7
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PublicChatWidget;
