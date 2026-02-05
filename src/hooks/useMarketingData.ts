import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number | null;
  source: string | null;
  notes: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  status: string;
  seo_score: number | null;
  target_keyword: string | null;
  meta_description: string | null;
  views: number | null;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
}

export interface SocialPost {
  id: string;
  content: string;
  platforms: string[] | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  likes: number | null;
  shares: number | null;
  comments: number | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string | null;
  subject: string;
  priority: string;
  status: string;
  ai_confidence: number | null;
  messages: any[];
  resolved_at: string | null;
  created_at: string;
}

export interface ComplianceReview {
  id: string;
  content_type: string;
  content_title: string;
  status: string;
  issues: string[] | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

// Leads Hook
export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_leads_v2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } else {
      setLeads(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_leads_v2' }, fetchLeads)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const addLead = async (lead: { company_name: string } & Partial<Omit<Lead, 'id' | 'created_at' | 'company_name'>>) => {
    const { error } = await supabase.from('marketing_leads_v2').insert([lead]);
    if (error) {
      toast.error('Failed to add lead');
      return false;
    }
    toast.success('Lead added');
    return true;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase.from('marketing_leads_v2').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update lead');
      return false;
    }
    return true;
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('marketing_leads_v2').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete lead');
      return false;
    }
    toast.success('Lead deleted');
    return true;
  };

  return { leads, isLoading, fetchLeads, addLead, updateLead, deleteLead };
};

// Blog Posts Hook
export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_blog_posts_v2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_blog_posts_v2' }, fetchPosts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const addPost = async (post: { title: string } & Partial<Omit<BlogPost, 'id' | 'created_at' | 'title'>>) => {
    const { error } = await supabase.from('marketing_blog_posts_v2').insert([post]);
    if (error) {
      toast.error('Failed to create post');
      return false;
    }
    toast.success('Post created');
    return true;
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    const { error } = await supabase.from('marketing_blog_posts_v2').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update post');
      return false;
    }
    return true;
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('marketing_blog_posts_v2').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete post');
      return false;
    }
    toast.success('Post deleted');
    return true;
  };

  return { posts, isLoading, fetchPosts, addPost, updatePost, deletePost };
};

// Social Posts Hook
export const useSocialPosts = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_social_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching social posts:', error);
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    
    const channel = supabase
      .channel('social-posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_social_posts' }, fetchPosts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const addPost = async (post: { content: string; platform?: string } & Partial<Omit<SocialPost, 'id' | 'created_at' | 'content'>>) => {
    const { error } = await supabase.from('marketing_social_posts').insert([{ platform: 'twitter', ...post }] as any);
    if (error) {
      toast.error('Failed to create post');
      return false;
    }
    toast.success('Post created');
    return true;
  };

  const updatePost = async (id: string, updates: Partial<SocialPost>) => {
    const { error } = await supabase.from('marketing_social_posts').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update post');
      return false;
    }
    return true;
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('marketing_social_posts').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete post');
      return false;
    }
    toast.success('Post deleted');
    return true;
  };

  return { posts, isLoading, fetchPosts, addPost, updatePost, deletePost };
};

// Support Tickets Hook
export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      const mappedTickets: SupportTicket[] = (data || []).map(t => ({
        ...t,
        messages: Array.isArray(t.messages) ? t.messages : []
      }));
      setTickets(mappedTickets);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
    
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_support_tickets' }, fetchTickets)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const addTicket = async (ticket: { customer_name: string; subject: string; ticket_number: string } & Partial<Omit<SupportTicket, 'id' | 'created_at' | 'customer_name' | 'subject' | 'ticket_number'>>) => {
    const { error } = await supabase.from('marketing_support_tickets').insert([ticket]);
    if (error) {
      toast.error('Failed to create ticket');
      return false;
    }
    toast.success('Ticket created');
    return true;
  };

  const updateTicket = async (id: string, updates: Partial<SupportTicket>) => {
    const { error } = await supabase.from('marketing_support_tickets').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update ticket');
      return false;
    }
    return true;
  };

  const deleteTicket = async (id: string) => {
    const { error } = await supabase.from('marketing_support_tickets').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete ticket');
      return false;
    }
    toast.success('Ticket deleted');
    return true;
  };

  return { tickets, isLoading, fetchTickets, addTicket, updateTicket, deleteTicket };
};

// Compliance Reviews Hook
export const useComplianceReviews = () => {
  const [reviews, setReviews] = useState<ComplianceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_compliance_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      // Map issues from Json to string[] for type compatibility
      const mappedReviews = (data || []).map((r: any) => ({
        ...r,
        issues: Array.isArray(r.issues) ? r.issues : r.issues ? [r.issues] : null
      }));
      setReviews(mappedReviews as ComplianceReview[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
    
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_compliance_reviews' }, fetchReviews)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReviews]);

  const addReview = async (review: { content_title: string; content_type: string } & Partial<Omit<ComplianceReview, 'id' | 'created_at' | 'content_title' | 'content_type'>>) => {
    const { error } = await supabase.from('marketing_compliance_reviews').insert([review]);
    if (error) {
      toast.error('Failed to create review');
      return false;
    }
    toast.success('Review submitted');
    return true;
  };

  const updateReview = async (id: string, updates: Partial<ComplianceReview>) => {
    const { error } = await supabase.from('marketing_compliance_reviews').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update review');
      return false;
    }
    return true;
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('marketing_compliance_reviews').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete review');
      return false;
    }
    toast.success('Review deleted');
    return true;
  };

  return { reviews, isLoading, fetchReviews, addReview, updateReview, deleteReview };
};

// Tasks Hook
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_tasks_v2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_tasks_v2' }, fetchTasks)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const addTask = async (task: { title: string } & Partial<Omit<Task, 'id' | 'created_at' | 'title'>>) => {
    const { error } = await supabase.from('marketing_tasks_v2').insert([task]);
    if (error) {
      toast.error('Failed to create task');
      return false;
    }
    toast.success('Task created');
    return true;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('marketing_tasks_v2').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update task');
      return false;
    }
    return true;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('marketing_tasks_v2').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete task');
      return false;
    }
    toast.success('Task deleted');
    return true;
  };

  return { tasks, isLoading, fetchTasks, addTask, updateTask, deleteTask };
};

// Marketing Stats Hook
export const useMarketingStats = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    totalPosts: 0,
    publishedPosts: 0,
    openTickets: 0,
    resolvedTickets: 0,
    pendingReviews: 0,
    tasksCompleted: 0,
    totalSocialPosts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [leadsRes, postsRes, ticketsRes, reviewsRes, tasksRes, socialRes] = await Promise.all([
        supabase.from('marketing_leads_v2').select('status'),
        supabase.from('marketing_blog_posts_v2').select('status'),
        supabase.from('marketing_support_tickets').select('status'),
        supabase.from('marketing_compliance_reviews').select('status'),
        supabase.from('marketing_tasks_v2').select('status'),
        supabase.from('marketing_social_posts').select('status')
      ]);

      const leads = leadsRes.data || [];
      const posts = postsRes.data || [];
      const tickets = ticketsRes.data || [];
      const reviews = reviewsRes.data || [];
      const tasks = tasksRes.data || [];
      const social = socialRes.data || [];

      setStats({
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.status === 'qualified' || l.status === 'negotiating').length,
        totalPosts: posts.length,
        publishedPosts: posts.filter(p => p.status === 'published').length,
        openTickets: tickets.filter(t => t.status !== 'resolved').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        pendingReviews: reviews.filter(r => r.status === 'pending').length,
        tasksCompleted: tasks.filter(t => t.status === 'completed').length,
        totalSocialPosts: social.length
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, isLoading, fetchStats, refetch: fetchStats };
};

// Aliases for component imports
export const useMarketingLeads = useLeads;
export const useMarketingBlogPosts = useBlogPosts;
export const useMarketingSocialPosts = useSocialPosts;
export const useMarketingSupportTickets = useSupportTickets;
export const useMarketingComplianceReviews = useComplianceReviews;
export const useMarketingTasks = useTasks;
