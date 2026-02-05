import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, FileText, Sparkles, Eye, Clock, User, Wand2, Plus, Trash2, Edit, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingBlogPosts, BlogPost } from '@/hooks/useMarketingData';
import { format } from 'date-fns';
import MarketingManagerBot from '@/components/marketing/MarketingManagerBot';

const AI_EMPLOYEE = { id: 'sage', name: 'SAGE', role: 'SEO & Content Writer', avatar: '✍️', color: 'from-amber-500 to-orange-600' };

const SEOBlogWriterTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { posts, addPost, updatePost, deletePost, isLoading: postsLoading } = useMarketingBlogPosts();
  const [input, setInput] = useState('');
  const [articleTopic, setArticleTopic] = useState('');
  const [articleType, setArticleType] = useState('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editedPost, setEditedPost] = useState<Partial<BlogPost>>({});
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', target_keyword: '', status: 'draft', content: '' });

  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const avgSeoScore = posts.length > 0 ? Math.round(posts.reduce((acc, p) => acc + (p.seo_score || 0), 0) / posts.length) : 0;

  const stats = [
    { label: 'Articles', value: posts.length, color: 'text-amber-400' },
    { label: 'Views', value: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews, color: 'text-green-400' },
    { label: 'Avg SEO', value: avgSeoScore, color: 'text-blue-400' },
    { label: 'Published', value: posts.filter(p => p.status === 'published').length, color: 'text-purple-400' },
  ];

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleGenerateArticle = async () => {
    if (!articleTopic.trim()) return;
    setIsGenerating(true);
    await sendMessage(`Generate a ${articleType} article about: ${articleTopic}. Please provide a catchy title, meta description, and key points to cover.`);
    setIsGenerating(false);
    setArticleTopic('');
  };

  const handleAddPost = async () => {
    if (!newPost.title.trim()) return;
    await addPost(newPost);
    setNewPost({ title: '', excerpt: '', target_keyword: '', status: 'draft', content: '' });
    setIsAddDialogOpen(false);
  };

  const handleOpenPost = (post: BlogPost) => {
    setSelectedPost(post);
    setEditedPost({
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt || '',
      target_keyword: post.target_keyword || '',
      status: post.status,
      meta_description: post.meta_description || ''
    });
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;
    await updatePost(selectedPost.id, {
      ...editedPost,
      published_at: editedPost.status === 'published' ? new Date().toISOString() : null
    });
    setSelectedPost(null);
  };

  const getStatusColor = (status: string) => ({ 
    published: 'bg-green-500/20 text-green-400', 
    draft: 'bg-amber-500/20 text-amber-400', 
    scheduled: 'bg-blue-500/20 text-blue-400' 
  }[status] || 'bg-gray-500/20 text-gray-400');

  const handleBotCreateContent = async (content: any) => {
    await addPost({
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      meta_description: content.meta_description,
      target_keyword: content.target_keyword,
      seo_score: content.seo_score || 75,
      status: content.status || 'draft',
      scheduled_at: content.scheduled_at || null
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Marketing Manager Bot */}
      <MarketingManagerBot 
        type="blog" 
        onCreateContent={handleBotCreateContent}
        existingContent={posts}
      />

      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2><Badge className="bg-green-500/20 text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge></div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role}</p>
            </div>
            <div className="hidden md:grid grid-cols-4 gap-4">
              {stats.map((stat) => (<div key={stat.label} className="text-center"><p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10"><CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-amber-400" />AI Content Generator</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Content Type</label>
                <Select value={articleType} onValueChange={setArticleType}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="guide">Complete Guide</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Target Keyword</label>
                <Input placeholder="e.g., prop trading strategies" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Article Topic</label>
              <Textarea placeholder="Describe what you want to write about..." value={articleTopic} onChange={(e) => setArticleTopic(e.target.value)} className="bg-white/5 border-white/10 min-h-[100px]" />
            </div>
            <Button onClick={handleGenerateArticle} disabled={isGenerating || !articleTopic.trim()} className="w-full bg-amber-600 hover:bg-amber-700">
              {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Article</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-amber-400" />Chat with {AI_EMPLOYEE.name}</CardTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-foreground text-xs">Clear</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px] p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Ask {AI_EMPLOYEE.name} about content</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8"><AvatarFallback className={msg.role === 'assistant' ? `bg-gradient-to-br ${AI_EMPLOYEE.color} text-white` : 'bg-primary/20'}>{msg.role === 'assistant' ? AI_EMPLOYEE.name[0] : <User className="w-4 h-4" />}</AvatarFallback></Avatar>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div>
                  </motion.div>
                ))}
                {isLoading && <div className="flex gap-3"><Avatar className="w-8 h-8"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback></Avatar><div className="bg-white/5 border border-white/10 rounded-2xl p-3"><div className="flex gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-100" /><span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-200" /></div></div></div>}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input placeholder="Ask about content..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" disabled={isLoading} />
              <Button onClick={handleSendMessage} className="bg-amber-600 hover:bg-amber-700" disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background/50 backdrop-blur border-white/10">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-400" />Blog Posts</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" /> New Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Title *" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />
                  <Textarea placeholder="Content" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} className="min-h-[200px]" />
                  <Textarea placeholder="Excerpt" value={newPost.excerpt || ''} onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })} />
                  <Input placeholder="Target Keyword" value={newPost.target_keyword || ''} onChange={(e) => setNewPost({ ...newPost, target_keyword: e.target.value })} />
                  <Select value={newPost.status} onValueChange={(value) => setNewPost({ ...newPost, status: value })}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddPost} className="w-full bg-amber-600 hover:bg-amber-700">Create Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {postsLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No posts yet. Create your first post!</div>
          ) : (
            posts.map((post) => (
              <div 
                key={post.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 group cursor-pointer transition-colors"
                onClick={() => handleOpenPost(post)}
              >
                <FileText className="w-8 h-8 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(post.created_at), 'MMM d')}</span>
                  </div>
                </div>
                {post.status === 'published' && (
                  <a 
                    href={`https://www.traderedgepro.com/blog/${post.id}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Button variant="ghost" size="sm" className="text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                <Edit className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100" 
                  onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Post Editor Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={editedPost.title || ''} 
                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea 
                value={editedPost.content || ''} 
                onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })} 
                className="min-h-[300px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Excerpt</label>
                <Textarea 
                  value={editedPost.excerpt || ''} 
                  onChange={(e) => setEditedPost({ ...editedPost, excerpt: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta Description</label>
                <Textarea 
                  value={editedPost.meta_description || ''} 
                  onChange={(e) => setEditedPost({ ...editedPost, meta_description: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Keyword</label>
                <Input 
                  value={editedPost.target_keyword || ''} 
                  onChange={(e) => setEditedPost({ ...editedPost, target_keyword: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editedPost.status || 'draft'} onValueChange={(value) => setEditedPost({ ...editedPost, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedPost(null)}>Cancel</Button>
              <Button onClick={handleSavePost} className="bg-amber-600 hover:bg-amber-700">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SEOBlogWriterTab;
