import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
 import { Bot, Send, User, Sparkles, Lightbulb, TrendingUp, Shield, Brain, Loader2, Plus, MessageSquare, Trash2, Search, Download, FileText, Pin, PinOff, Lock, Crown, PanelLeftClose, PanelLeft, Activity, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
 import { AIKeySettings } from '@/components/ai/AIKeySettings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
}

interface UserContext {
  propFirm?: string;
  accountSize?: number;
  accountType?: string;
  riskPercentage?: number;
  experience?: string;
}

interface OpenTrade {
  id: string;
  symbol: string;
  signal_type: string;
  unrealized_pnl: number;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your Nexus AI Trading Coach. I can help you with:\n\n• **Trade analysis and strategy** - Get feedback on your setups\n• **Risk management advice** - Optimize position sizing\n• **Psychology and mindset** - Overcome emotional challenges\n• **Prop firm rule compliance** - Stay within guidelines\n\nHow can I help you today?",
  timestamp: new Date()
};

type DateFilter = 'all' | 'today' | 'week' | 'month';

const AICoachTab = () => {
  const { user } = useAuth();
  const features = usePlanFeatures();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [userContext, setUserContext] = useState<UserContext>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [signalContext, setSignalContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
   const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
   const [showSettings, setShowSettings] = useState(false);

  // Check for signal context from navigation (user clicked "Ask AI about this signal")
  useEffect(() => {
    const storedSignal = localStorage.getItem('signalContext');
    if (storedSignal) {
      try {
        const signal = JSON.parse(storedSignal);
        setSignalContext(signal);
        // Pre-populate input with a question about the signal
        const direction = signal.direction || signal.signal_type || '';
        setInput(`I want to take this ${signal.symbol} ${direction} signal. Can you analyze it and tell me how to manage this trade?`);
        // Clear the stored context
        localStorage.removeItem('signalContext');
        toast.info(`Signal context loaded for ${signal.symbol}`);
      } catch (e) {
        console.error('Error parsing signal context:', e);
        localStorage.removeItem('signalContext');
      }
    }
  }, []);

  // Check if user has access to AI Coach (Pro+ plans)
  const hasAiCoachAccess = features.fullAiReasoning || features.advancedAiCoach;

  // Filter and sort conversations based on search, date, and pinned status
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter(conv => {
      // Search filter
      const matchesSearch = !searchTerm || 
        conv.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      const convDate = new Date(conv.updated_at);
      const now = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = convDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = convDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = convDate >= monthAgo;
      }
      
      return matchesSearch && matchesDate;
    });
    
    // Sort: pinned first, then by updated_at
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [conversations, searchTerm, dateFilter]);

  // Dynamic quick actions based on user's open trades
  const quickActions = useMemo(() => {
    const baseActions = [
      { label: 'Help with risk management', icon: Shield },
      { label: 'Trading psychology tips', icon: Brain },
      { label: 'Strategy optimization', icon: Lightbulb }
    ];

    // Add dynamic trade-specific actions
    const tradeActions = openTrades.slice(0, 2).map(trade => ({
      label: `How should I manage my ${trade.symbol} ${trade.signal_type} trade?`,
      icon: Activity
    }));

    if (openTrades.length > 0) {
      return [
        { label: 'Analyze all my open trades', icon: TrendingUp },
        ...tradeActions,
        ...baseActions
      ];
    }

    return [
      { label: 'Analyze my recent trades', icon: TrendingUp },
      ...baseActions
    ];
  }, [openTrades]);

  // Fetch user's open trades for dynamic quick actions
  useEffect(() => {
    const fetchOpenTrades = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_trade_allocations')
          .select(`
            id, unrealized_pnl, entry_price, stop_loss, take_profit_1,
              institutional_signals (symbol, direction)
          `)
          .eq('user_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (data) {
          const formattedTrades: OpenTrade[] = data.map((trade: any) => ({
            id: trade.id,
            symbol: trade.institutional_signals?.symbol || 'Unknown',
            // Keep field name for UI compatibility; value comes from institutional_signals.direction
            signal_type: trade.institutional_signals?.direction || 'Unknown',
            unrealized_pnl: trade.unrealized_pnl || 0,
            entry_price: trade.entry_price,
            stop_loss: trade.stop_loss,
            take_profit_1: trade.take_profit_1
          }));
          setOpenTrades(formattedTrades);
        }
      } catch (error) {
        console.error('Error fetching open trades:', error);
      }
    };

    fetchOpenTrades();
  }, [user]);

  // Fetch user context
  useEffect(() => {
    const fetchUserContext = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        ;

      if (error) {
        console.error('Error fetching questionnaire:', error);
        return;
      }

      const row = (data as any[] | null)?.[0];
      
      if (row) {
        setUserContext({
          propFirm: row.prop_firm,
          accountSize: row.account_size,
          accountType: row.account_type,
          riskPercentage: row.risk_percentage,
          experience: row.trading_experience
        });
      }
    };
    
    fetchUserContext();
  }, [user]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setConversations(data || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversationId || !user) {
        setMessages([WELCOME_MESSAGE]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at)
          })));
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([WELCOME_MESSAGE]);
      }
    };

    loadMessages();
  }, [currentConversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewConversation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    if (!user) return;

    try {
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role,
          content
        });

      // Update conversation title based on first user message
      if (role === 'user') {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('ai_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ));
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create or use existing conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (convId) {
        setCurrentConversationId(convId);
      }
    }

    // Save user message
    if (convId) {
      await saveMessage(convId, 'user', input);
    }

    try {
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: input });

      const { data, error } = await callEdgeFunction('ai-coach', {
        messages: conversationHistory,
        userContext,
        userId: user.id,
        signalContext: signalContext,
      });

      // Clear signal context after first message
      if (signalContext) setSignalContext(null);

      if (error) throw error;

      // Handle warning or blocked state
      if (data.blocked) {
        toast.error('Your Nexus AI access has been suspended. Contact support for assistance.');
      } else if (data.warning) {
        toast.warning(`Warning ${data.warningCount}/3: Please ask trading-related questions only.`);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response
      if (convId) {
        await saveMessage(convId, 'assistant', data.response);
      }
    } catch (error: unknown) {
      console.error('AI Coach error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      // Delete messages first
      await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        handleNewChat();
      }
      
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const handleTogglePin = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const newPinnedState = !conv.is_pinned;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_pinned: newPinnedState })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, is_pinned: newPinnedState } : c
      ));
      
      toast.success(newPinnedState ? 'Conversation pinned' : 'Conversation unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin status');
    }
  };

  const formatMessage = (content: string) => {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    // Sanitize HTML to prevent XSS attacks from AI-generated content
    return DOMPurify.sanitize(html, { 
      ALLOWED_TAGS: ['strong', 'em', 'br'],
      ALLOWED_ATTR: []
    });
  };

  const exportAsMarkdown = () => {
    if (messages.length <= 1) {
      toast.error('No conversation to export');
      return;
    }
    
    const conversation = filteredConversations.find(c => c.id === currentConversationId);
    const title = conversation?.title || 'AI Coach Conversation';
    
    let markdown = `# ${title}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
    
    messages.filter(m => m.id !== 'welcome').forEach((msg) => {
      const role = msg.role === 'user' ? '**You**' : '**AI Coach**';
      const time = msg.timestamp.toLocaleString();
      markdown += `### ${role}\n*${time}*\n\n${msg.content}\n\n---\n\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Conversation exported as Markdown');
  };

  const exportAsPDF = () => {
    if (messages.length <= 1) {
      toast.error('No conversation to export');
      return;
    }
    
    const conversation = filteredConversations.find(c => c.id === currentConversationId);
    const title = conversation?.title || 'AI Coach Conversation';
    
    // Create printable HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
          .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
          .user { background: #f0f0f0; margin-left: 50px; }
          .assistant { background: #f8f5ff; border-left: 3px solid #8b5cf6; }
          .role { font-weight: bold; color: #333; margin-bottom: 8px; }
          .time { font-size: 12px; color: #666; margin-bottom: 8px; }
          .content { line-height: 1.6; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="color: #666;">Exported on ${new Date().toLocaleDateString()}</p>
    `;
    
    messages.filter(m => m.id !== 'welcome').forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'AI Coach';
      html += `
        <div class="message ${msg.role}">
          <div class="role">${role}</div>
          <div class="time">${msg.timestamp.toLocaleString()}</div>
          <div class="content">${msg.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    });
    
    html += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast.success('Print dialog opened for PDF export');
  };

  // If user doesn't have AI Coach access, show upgrade prompt
  if (!hasAiCoachAccess) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="glass-card p-12 rounded-2xl text-center max-w-lg space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Unlock AI Trading Coach</h2>
            <p className="text-muted-foreground">
              Get personalized trading advice, strategy optimization, and psychology coaching 
              with our AI-powered trading assistant. Available on Pro and Enterprise plans.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/5">
              <Brain className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Personalized trade analysis & feedback</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/5">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Risk management optimization</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/5">
              <Lightbulb className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Trading psychology & mindset coaching</span>
            </div>
          </div>
          <Button onClick={() => navigate('/membership')} size="lg" className="btn-glow w-full">
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Pro or Enterprise
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4">
      {/* Toggle button for conversation sidebar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
        className="absolute left-2 top-2 z-10"
        title={isChatSidebarOpen ? 'Hide conversations' : 'Show conversations'}
      >
        {isChatSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </Button>

      {/* Conversation Sidebar */}
      <AnimatePresence>
        {isChatSidebarOpen && (
          <motion.div 
            className="w-72 shrink-0 glass-card rounded-xl flex flex-col overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-white/[0.05] space-y-3">
              <Button onClick={handleNewChat} className="w-full btn-glow" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white/5 border-white/10"
                />
              </div>
              
              {/* Date Filter */}
              <div className="flex items-center gap-1">
                {(['all', 'today', 'week', 'month'] as DateFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`flex-1 px-2 py-1 rounded text-xs capitalize transition-colors ${
                      dateFilter === filter 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoadingConversations ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-xs text-muted-foreground">
                    {searchTerm || dateFilter !== 'all' ? 'No matching conversations' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors group ${
                      currentConversationId === conv.id 
                        ? 'bg-primary/20 text-primary' 
                        : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {conv.is_pinned ? (
                      <Pin className="w-4 h-4 shrink-0 text-primary" />
                    ) : (
                      <MessageSquare className="w-4 h-4 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{conv.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleTogglePin(conv.id, e)}
                        className="p-1 hover:bg-white/10 rounded"
                        title={conv.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {conv.is_pinned ? (
                          <PinOff className="w-3 h-3 text-primary" />
                        ) : (
                          <Pin className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-risk" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Nexus AI Coach
                <Sparkles className="w-4 h-4 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground">Your personal trading advisor</p>
            </div>
          </div>
          
           {/* Action Buttons */}
           <div className="flex items-center gap-2">
             {/* API Key Status */}
             {hasApiKey === false && (
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Key className="w-3 h-3" />
                 <span>API key required</span>
               </div>
             )}
             
             {/* Settings Button */}
             <Dialog open={showSettings} onOpenChange={setShowSettings}>
               <DialogTrigger asChild>
                 <Button variant="outline" size="sm" className="gap-2">
                   <Settings className="w-4 h-4" />
                   {hasApiKey ? 'Settings' : 'Setup API Key'}
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-lg">
                 <DialogHeader>
                   <DialogTitle>Nexus AI Settings</DialogTitle>
                 </DialogHeader>
                 <AIKeySettings 
                   onKeyConfigured={(configured) => {
                     setHasApiKey(configured);
                     if (configured) {
                       setShowSettings(false);
                     }
                   }} 
                 />
               </DialogContent>
             </Dialog>
             
             {/* Export Button */}
             {currentConversationId && messages.length > 1 && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2">
                     <Download className="w-4 h-4" />
                     Export
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={exportAsMarkdown}>
                     <FileText className="w-4 h-4 mr-2" />
                     Export as Markdown
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={exportAsPDF}>
                     <Download className="w-4 h-4 mr-2" />
                     Export as PDF
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}
           </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden">
           {/* API Key Setup Banner */}
           {hasApiKey === false && (
             <div className="p-4 bg-muted/50 border-b border-border">
               <AIKeySettings compact onKeyConfigured={setHasApiKey} />
             </div>
           )}
           
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[70%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-white/5 border border-white/10 rounded-bl-none'
                }`}>
                  <p 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                  <p className="text-xs opacity-50 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/[0.05]">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about trading..."
                className="bg-white/5 border-white/10"
                disabled={isLoading}
              />
              <Button onClick={handleSend} className="btn-glow shrink-0" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoachTab;
