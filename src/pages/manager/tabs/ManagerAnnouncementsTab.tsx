import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

const ManagerAnnouncementsTab = () => {
  const { callManagerApi } = useManagerApi();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const response = await callManagerApi('get_agents');
    if (response?.success) {
      setAgents(response.agents || []);
    }
    setIsLoading(false);
  };

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    setIsSending(true);
    const response = await callManagerApi('send_announcement', {
      title: title.trim(),
      message: message.trim(),
      priority,
      targetAgents: sendToAll ? [] : selectedAgents
    });

    if (response?.success) {
      toast.success('Announcement sent successfully');
      setTitle('');
      setMessage('');
      setPriority('normal');
      setSelectedAgents([]);
      setSendToAll(true);
    } else {
      toast.error('Failed to send announcement');
    }
    setIsSending(false);
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">Send Announcement</h2>
        <p className="text-sm text-muted-foreground">Broadcast messages to your team</p>
      </div>

      {/* Announcement Form */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement message..."
              className="bg-white/5 border-white/10 min-h-[120px]"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Low
                  </span>
                </SelectItem>
                <SelectItem value="normal">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Normal
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Urgent
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label>Recipients</Label>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendToAll"
                checked={sendToAll}
                onCheckedChange={(checked) => {
                  setSendToAll(!!checked);
                  if (checked) setSelectedAgents([]);
                }}
              />
              <label htmlFor="sendToAll" className="text-sm cursor-pointer">
                Send to all agents
              </label>
            </div>

            {!sendToAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground">Select specific agents:</p>
                <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-white/5 max-h-48 overflow-y-auto">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedAgents.includes(agent.id) ? 'bg-purple-500/20' : 'hover:bg-white/5'
                      }`}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <Checkbox checked={selectedAgents.includes(agent.id)} />
                      <span className="text-sm truncate">{agent.name || agent.email}</span>
                    </div>
                  ))}
                </div>
                {selectedAgents.length > 0 && (
                  <p className="text-xs text-purple-400">
                    {selectedAgents.length} agent(s) selected
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Preview */}
          {title && message && (
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${
                    priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                    priority === 'low' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {priority}
                  </Badge>
                  <p className="font-medium">{title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendAnnouncement}
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Announcement
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerAnnouncementsTab;
