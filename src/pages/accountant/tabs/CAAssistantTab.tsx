import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Sparkles, AlertTriangle, BookOpen, Scale, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: AlertTriangle, label: 'GST Updates', prompt: 'What are the latest GST updates and compliance requirements for online digital services in India?' },
  { icon: BookOpen, label: 'TDS Rules', prompt: 'Explain TDS rules for payments to international affiliates and contractors from India.' },
  { icon: Scale, label: 'Tax Planning', prompt: 'What tax-saving strategies should a partnership firm consider for digital services business?' },
  { icon: Sparkles, label: 'Compliance Check', prompt: 'What are the key financial compliance requirements for a SaaS business operating in India?' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ca-assistant`;

const CAAssistantTab = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `# Welcome to Your CA Assistant! 🧮

I'm your AI-powered Chartered Accountant assistant, here to help you with:

- **Indian Tax Laws** - Income tax, GST, TDS, and more
- **Compliance Requirements** - Filing deadlines and regulations
- **Financial Planning** - Tax optimization strategies
- **Latest Updates** - Recent changes in tax laws and policies
- **Business Accounting** - Partnership profit sharing, expenses

**Note:** While I provide helpful guidance, always consult a qualified CA for official advice and filings.

How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.role !== 'assistant' || m.id !== '1'), userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      // Add empty assistant message first
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      if (reader) {
        let textBuffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                ));
              }
            } catch {
              // Incomplete JSON, put it back
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('CA Assistant error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `# Welcome to Your CA Assistant! 🧮

I'm your AI-powered Chartered Accountant assistant. How can I help you today?`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="space-y-6">
      {/* Quick Prompts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_PROMPTS.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => sendMessage(prompt.prompt)}
            disabled={isLoading}
            className="p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left group"
          >
            <prompt.icon className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-foreground">{prompt.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Chat Interface */}
      <Card className="border-white/[0.08] h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.08] py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">CA Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">AI-Powered Financial Advisor</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 border border-white/[0.08]'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/[0.08]">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about taxes, compliance, financial planning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-emerald-500 hover:bg-emerald-600">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            ⚠️ This AI provides general guidance only. Consult a qualified CA for official advice.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CAAssistantTab;
