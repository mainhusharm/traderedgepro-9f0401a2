import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useMarketingAI = (employeeId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('marketing_ai_chats')
          .select('messages')
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (error) {
          console.error('Error loading chat history:', error);
          return;
        }

        if (data?.messages && Array.isArray(data.messages)) {
          const loadedMessages = (data.messages as any[]).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    loadChatHistory();
  }, [employeeId]);

  // Save messages to database
  const saveMessages = useCallback(async (newMessages: ChatMessage[]) => {
    try {
      const messagesForDb = newMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      const { data: existing } = await supabase
        .from('marketing_ai_chats')
        .select('id')
        .eq('employee_id', employeeId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('marketing_ai_chats')
          .update({ messages: messagesForDb })
          .eq('employee_id', employeeId);
      } else {
        await supabase
          .from('marketing_ai_chats')
          .insert({ employee_id: employeeId, messages: messagesForDb });
      }
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }, [employeeId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data, error } = await callEdgeFunction('marketing-ai-chat', {
        employeeId,
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error(err.message || 'Failed to get AI response');
      
      // Remove the user message if AI failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, employeeId, saveMessages]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    try {
      await supabase
        .from('marketing_ai_chats')
        .delete()
        .eq('employee_id', employeeId);
      toast.success('Chat history cleared');
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, [employeeId]);

  return {
    messages,
    isLoading,
    isInitialized,
    sendMessage,
    clearHistory
  };
};
