import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, Circle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Agent {
  id: string;
  name: string | null;
  email: string;
  is_online: boolean;
}

interface Message {
  id: string;
  manager_id: string;
  agent_id: string;
  sender_type: 'manager' | 'agent';
  content: string;
  is_read: boolean;
  created_at: string;
}

const ManagerMessagesTab = () => {
  const { callManagerApi } = useManagerApi();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchMessages(selectedAgent.id);
    }
  }, [selectedAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAgents = async () => {
    const response = await callManagerApi('get_agents');
    if (response?.success) {
      setAgents(response.agents || []);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (agentId: string) => {
    const response = await callManagerApi('get_messages', { agentId });
    if (response?.success) {
      setMessages(response.messages || []);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAgent) return;

    setIsSending(true);
    const response = await callManagerApi('send_message', {
      agentId: selectedAgent.id,
      content: newMessage.trim()
    });

    if (response?.success) {
      setNewMessage('');
      fetchMessages(selectedAgent.id);
    } else {
      toast.error('Failed to send message');
    }
    setIsSending(false);
  };

  const filteredAgents = agents.filter(agent =>
    (agent.name || agent.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
      {/* Agent List */}
      <Card className="bg-card/50 border-white/5 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-purple-400" />
            Agents
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-24rem)]">
            <div className="space-y-1 p-2">
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedAgent?.id === agent.id
                      ? 'bg-purple-500/10 border border-purple-500/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
                        agent.is_online ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{agent.name || 'Agent'}</p>
                    <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="bg-card/50 border-white/5 lg:col-span-2 flex flex-col">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
                      selectedAgent.is_online ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">{selectedAgent.name || 'Agent'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAgent.is_online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender_type === 'manager' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_type === 'manager'
                          ? 'bg-purple-500/20 text-purple-50'
                          : 'bg-white/5'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(message.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-white/5 border-white/10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-500"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an agent to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerMessagesTab;
