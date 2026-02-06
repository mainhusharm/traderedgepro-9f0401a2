import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Share2, Calendar, Image, Hash, Sparkles, Play, Loader2, Clock, FileText, Settings, MessageCircle, Trash2, Eye, Plus, ChevronLeft, ChevronRight, ImageIcon, Type, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingSocialPosts } from '@/hooks/useMarketingData';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import SocialPlatformSetup from '@/components/marketing/SocialPlatformSetup';

const AI_EMPLOYEE = { id: 'maya', name: 'MAYA', role: 'Social Media Manager', avatar: '📱', color: 'from-cyan-500 to-blue-600' };

type Step = 'idle' | 'platform' | 'content-type' | 'format' | 'creating' | 'ready';
type ActiveView = 'create' | 'calendar' | 'setup';
type PostFormat = 'single' | 'carousel' | 'thread';
type PostMode = 'both' | 'text-only' | 'image-only';

interface Slide {
  id: string;
  text: string;
  imageUrl: string | null;
  isGeneratingImage: boolean;
}

const SocialMediaTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { posts, addPost, deletePost } = useMarketingSocialPosts();
  
  const [activeView, setActiveView] = useState<ActiveView>('create');
  const [step, setStep] = useState<Step>('idle');
  
  // Flow state
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [postFormat, setPostFormat] = useState<PostFormat>('single');
  const [postMode, setPostMode] = useState<PostMode>('both');
  
  // Post builder state
  const [slides, setSlides] = useState<Slide[]>([{ id: '1', text: '', imageUrl: null, isGeneratingImage: false }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hashtags, setHashtags] = useState('');
  const [hook, setHook] = useState('');
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const platforms = [
    { id: 'twitter', name: 'Twitter/X', icon: '𝕏', formats: ['single', 'thread'] },
    { id: 'instagram', name: 'Instagram', icon: '📸', formats: ['single', 'carousel'] },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', formats: ['single', 'carousel'] },
    { id: 'facebook', name: 'Facebook', icon: '📘', formats: ['single', 'carousel'] },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', formats: ['single'] },
  ];

  const contentTypes = [
    { id: 'educational', label: '📚 Educational', description: 'Tips and knowledge' },
    { id: 'motivational', label: '🔥 Motivational', description: 'Inspire traders' },
    { id: 'engagement', label: '💬 Engagement', description: 'Questions & polls' },
    { id: 'news', label: '📰 Market News', description: 'Updates & analysis' },
    { id: 'success', label: '🏆 Success Story', description: 'Wins & milestones' },
    { id: 'custom', label: '✍️ Custom', description: 'Write your own' },
  ];

  const postModes = [
    { id: 'both', label: 'Text + Image', icon: Layers },
    { id: 'text-only', label: 'Text Only', icon: Type },
    { id: 'image-only', label: 'Image Only', icon: ImageIcon },
  ];

  const currentSlide = slides[currentSlideIndex];
  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  const handleStartBot = () => {
    setStep('platform');
  };

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    setStep('content-type');
  };

  const handleSelectContentType = (typeId: string) => {
    setSelectedContentType(typeId);
    const platform = platforms.find(p => p.id === selectedPlatform);
    
    if (platform && platform.formats.length > 1) {
      setStep('format');
    } else {
      setPostFormat('single');
      if (typeId === 'custom') {
        setStep('ready');
      } else {
        generateContent(typeId, 'single');
      }
    }
  };

  const handleSelectFormat = (format: PostFormat) => {
    setPostFormat(format);
    
    if (format === 'carousel') {
      setSlides([
        { id: '1', text: '', imageUrl: null, isGeneratingImage: false },
        { id: '2', text: '', imageUrl: null, isGeneratingImage: false },
        { id: '3', text: '', imageUrl: null, isGeneratingImage: false },
      ]);
    } else if (format === 'thread') {
      setSlides([
        { id: '1', text: '', imageUrl: null, isGeneratingImage: false },
        { id: '2', text: '', imageUrl: null, isGeneratingImage: false },
        { id: '3', text: '', imageUrl: null, isGeneratingImage: false },
      ]);
    } else {
      setSlides([{ id: '1', text: '', imageUrl: null, isGeneratingImage: false }]);
    }
    
    if (selectedContentType === 'custom') {
      setStep('ready');
    } else {
      generateContent(selectedContentType!, format);
    }
  };

  const generateContent = async (contentType: string, format: PostFormat) => {
    setStep('creating');
    setIsGeneratingContent(true);

    const platformName = selectedPlatformData?.name || 'social media';
    const formatName = format === 'carousel' ? 'carousel (3-5 slides)' : format === 'thread' ? 'thread (3-5 tweets)' : 'single post';

    const prompts: Record<string, string> = {
      educational: `Write a ${formatName} for ${platformName} about forex/prop trading education. ${format !== 'single' ? 'Create separate content for each slide/tweet. Format as SLIDE 1:, SLIDE 2:, etc.' : ''} Just the content, no intro or explanation.`,
      motivational: `Write a ${formatName} for ${platformName} to motivate traders. ${format !== 'single' ? 'Create separate content for each slide/tweet. Format as SLIDE 1:, SLIDE 2:, etc.' : ''} Just the content, no intro.`,
      engagement: `Write a ${formatName} for ${platformName} to boost engagement with trading community. ${format !== 'single' ? 'Create separate content for each slide/tweet. Format as SLIDE 1:, SLIDE 2:, etc.' : ''} Just the content, no intro.`,
      news: `Write a ${formatName} for ${platformName} about current market conditions. ${format !== 'single' ? 'Create separate content for each slide/tweet. Format as SLIDE 1:, SLIDE 2:, etc.' : ''} Just the content, no intro.`,
      success: `Write a ${formatName} for ${platformName} celebrating trading success. ${format !== 'single' ? 'Create separate content for each slide/tweet. Format as SLIDE 1:, SLIDE 2:, etc.' : ''} Just the content, no intro.`,
    };

    try {
      await sendMessage(prompts[contentType] || prompts.educational);
    } catch (err) {
      toast.error('Failed to generate content');
      setStep('content-type');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Parse AI response into slides
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant' || step !== 'creating') return;

    const content = lastMessage.content;
    
    if (postFormat === 'carousel' || postFormat === 'thread') {
      // Parse slides from response
      const slideMatches = content.match(/(?:SLIDE|TWEET|Post)\s*\d+[:\s-]*([\s\S]*?)(?=(?:SLIDE|TWEET|Post)\s*\d+|$)/gi);
      
      if (slideMatches && slideMatches.length > 0) {
        const newSlides = slideMatches.map((match, idx) => ({
          id: String(idx + 1),
          text: match.replace(/^(?:SLIDE|TWEET|Post)\s*\d+[:\s-]*/i, '').trim(),
          imageUrl: null,
          isGeneratingImage: false,
        }));
        setSlides(newSlides.length > 0 ? newSlides : [{ id: '1', text: content.trim(), imageUrl: null, isGeneratingImage: false }]);
      } else {
        // Fallback: split by double newlines
        const parts = content.split(/\n\n+/).filter(p => p.trim().length > 20);
        if (parts.length > 1) {
          setSlides(parts.slice(0, 5).map((text, idx) => ({
            id: String(idx + 1),
            text: text.trim(),
            imageUrl: null,
            isGeneratingImage: false,
          })));
        } else {
          setSlides([{ id: '1', text: content.trim(), imageUrl: null, isGeneratingImage: false }]);
        }
      }
    } else {
      setSlides([{ id: '1', text: content.replace(/\*\*/g, '').trim(), imageUrl: null, isGeneratingImage: false }]);
    }
    
    setCurrentSlideIndex(0);
    setStep('ready');
  }, [messages, isLoading, step, postFormat]);

  const updateSlideText = (text: string) => {
    setSlides(prev => prev.map((s, i) => i === currentSlideIndex ? { ...s, text } : s));
  };

  const addSlide = () => {
    if (slides.length >= 10) return;
    const newSlide: Slide = { id: String(Date.now()), text: '', imageUrl: null, isGeneratingImage: false };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1));
  };

  const generateImageForSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide.text.trim()) {
      toast.error('Add text first');
      return;
    }

    setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, isGeneratingImage: true } : s));

    try {
      const { data, error } = await callEdgeFunction('generate-social-image', {
        prompt: `Professional ${selectedPlatformData?.name || 'social media'} image for: ${slide.text.slice(0, 200)}`,
      });
      
      if (error) throw error;
      const imageUrl = data?.imageUrl || data?.image;
      
      if (imageUrl) {
        setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, imageUrl, isGeneratingImage: false } : s));
        toast.success(`Image generated for slide ${slideIndex + 1}!`);
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      toast.error(err?.message || 'Failed to generate image');
      setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, isGeneratingImage: false } : s));
    }
  };

  const generateAllImages = async () => {
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].text.trim() && !slides[i].imageUrl) {
        await generateImageForSlide(i);
      }
    }
  };

  const handleGenerateHashtags = async () => {
    const allText = slides.map(s => s.text).join(' ');
    if (!allText.trim()) return;
    
    setIsGeneratingHashtags(true);
    try {
      await sendMessage(`Generate 8 relevant hashtags for ${selectedPlatformData?.name || 'social media'}. ONLY output the hashtags: ${allText.slice(0, 300)}`);
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const handleGenerateHook = async () => {
    if (!slides[0]?.text.trim()) return;
    
    setIsGeneratingHook(true);
    try {
      await sendMessage(`Write a viral hook for ${selectedPlatformData?.name || 'social media'}. ONLY output the hook in quotes: ${slides[0].text.slice(0, 200)}`);
    } finally {
      setIsGeneratingHook(false);
    }
  };

  // Extract hashtags/hooks from chat
  useEffect(() => {
    if (messages.length === 0 || isLoading || step !== 'ready') return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant') return;
    
    const content = lastMessage.content;
    
    // Extract hashtags
    const hashtagMatches = content.match(/#\w+/g);
    if (hashtagMatches && hashtagMatches.length >= 3 && isGeneratingHashtags) {
      setHashtags(hashtagMatches.join(' '));
    }
    
    // Extract hook
    const quotedMatch = content.match(/"([^"]+)"/);
    if (quotedMatch && isGeneratingHook) {
      setHook(quotedMatch[1]);
    }
  }, [messages, isLoading, step]);

  const handlePostNow = async () => {
    if (isPostingNow || !selectedPlatform) return;

    const hasText = slides.some(s => s.text.trim());
    const hasImages = slides.some(s => s.imageUrl);
    
    if (postMode === 'text-only' && !hasText) {
      toast.error('Add text to your post');
      return;
    }
    if (postMode === 'image-only' && !hasImages) {
      toast.error('Generate images first');
      return;
    }
    if (postMode === 'both' && !hasText) {
      toast.error('Add content to your post');
      return;
    }

    setIsPostingNow(true);

    try {
      const fullContent = postMode !== 'image-only' 
        ? `${hook ? hook + '\n\n' : ''}${slides.map(s => s.text).join('\n\n')}${hashtags ? '\n\n' + hashtags : ''}`
        : '';
      
      const images = postMode !== 'text-only' ? slides.filter(s => s.imageUrl).map(s => s.imageUrl) : [];

      const { data: created, error: insertError } = await (supabase
        .from('marketing_social_posts' as any)
        .insert([{ 
          content: fullContent || `[${slides.length} images]`, 
          platform: selectedPlatform,
          platforms: [selectedPlatform], 
          status: 'draft' 
        } as any])
        .select('id')
        .single() as any);

      if (insertError) throw insertError;

      const { data, error } = await callEdgeFunction('post-to-social', {
        content: fullContent,
        imageUrl: images[0] || null,
        images: images,
        platforms: [selectedPlatform],
        postId: created.id,
        postMode,
        format: postFormat,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const successful = data?.summary?.successful ?? 0;
      if (successful > 0) {
        toast.success('Posted successfully!');
        resetForm();
      } else {
        toast.error(data?.summary?.message || 'Failed to post');
      }
    } catch (err: any) {
      console.error('Post error:', err);
      toast.error(err?.message || 'Failed to post');
    } finally {
      setIsPostingNow(false);
    }
  };

  const handleSaveDraft = async () => {
    const fullContent = `${hook ? hook + '\n\n' : ''}${slides.map(s => s.text).join('\n\n')}${hashtags ? '\n\n' + hashtags : ''}`;
    
    await addPost({
      content: fullContent || '[Draft]',
      platforms: selectedPlatform ? [selectedPlatform] : [],
      status: 'draft'
    });
    toast.success('Saved as draft!');
    resetForm();
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error('Select a date');
      return;
    }
    
    const fullContent = `${hook ? hook + '\n\n' : ''}${slides.map(s => s.text).join('\n\n')}${hashtags ? '\n\n' + hashtags : ''}`;
    
    await addPost({
      content: fullContent,
      platforms: selectedPlatform ? [selectedPlatform] : [],
      status: 'scheduled',
      scheduled_at: new Date(scheduleDate).toISOString()
    });
    toast.success('Scheduled!');
    resetForm();
  };

  const resetForm = () => {
    setStep('idle');
    setSelectedPlatform(null);
    setSelectedContentType(null);
    setPostFormat('single');
    setPostMode('both');
    setSlides([{ id: '1', text: '', imageUrl: null, isGeneratingImage: false }]);
    setCurrentSlideIndex(0);
    setHashtags('');
    setHook('');
    setScheduleDate('');
  };

  const handleChatSend = () => {
    if (!chatInput.trim() || isLoading) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 13) });

  const getPostsForDate = (date: Date) => posts.filter(p => {
    const postDate = p.scheduled_at ? new Date(p.scheduled_at) : new Date(p.created_at);
    return format(postDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  const getStatusColor = (status: string) => ({
    published: 'bg-green-500/20 text-green-400',
    scheduled: 'bg-blue-500/20 text-blue-400',
    draft: 'bg-amber-500/20 text-amber-400',
  }[status] || 'bg-gray-500/20');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-2xl shadow-lg`}>
              {AI_EMPLOYEE.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {AI_EMPLOYEE.name}
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />Online
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">{AI_EMPLOYEE.role}</p>
            </div>
            <div className="flex gap-2">
              {(['create', 'calendar', 'setup'] as ActiveView[]).map(view => (
                <Button
                  key={view}
                  variant={activeView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView(view)}
                  className={activeView === view ? 'bg-cyan-600' : ''}
                >
                  {view === 'create' && <Sparkles className="w-4 h-4 mr-1" />}
                  {view === 'calendar' && <Calendar className="w-4 h-4 mr-1" />}
                  {view === 'setup' && <Settings className="w-4 h-4 mr-1" />}
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {activeView === 'create' && (
              <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="bg-background/50 backdrop-blur border-white/10">
                  <CardContent className="p-6">
                    
                    {/* Step: Idle */}
                    {step === 'idle' && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <Bot className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Ready to Create Content?</h3>
                        <p className="text-muted-foreground mb-6">Let MAYA help you create platform-specific posts</p>
                        <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600" onClick={handleStartBot}>
                          <Play className="w-5 h-5 mr-2" />Start Content Manager
                        </Button>
                      </div>
                    )}

                    {/* Step: Platform Selection */}
                    {step === 'platform' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Which platform?</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {platforms.map(p => (
                            <Card
                              key={p.id}
                              className="cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 border-white/10"
                              onClick={() => handleSelectPlatform(p.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <span className="text-3xl mb-2 block">{p.icon}</span>
                                <p className="font-medium">{p.name}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('idle')}>← Back</Button>
                      </div>
                    )}

                    {/* Step: Content Type */}
                    {step === 'content-type' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{selectedPlatformData?.icon}</span>
                          <span className="font-medium">{selectedPlatformData?.name}</span>
                        </div>
                        <h3 className="text-lg font-semibold">What type of content?</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {contentTypes.map(ct => (
                            <Card
                              key={ct.id}
                              className="cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 border-white/10"
                              onClick={() => handleSelectContentType(ct.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <span className="text-xl mb-1 block">{ct.label.split(' ')[0]}</span>
                                <p className="font-medium text-sm">{ct.label.split(' ').slice(1).join(' ')}</p>
                                <p className="text-xs text-muted-foreground">{ct.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('platform')}>← Back</Button>
                      </div>
                    )}

                    {/* Step: Format Selection */}
                    {step === 'format' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{selectedPlatformData?.icon}</span>
                          <span className="font-medium">{selectedPlatformData?.name}</span>
                        </div>
                        <h3 className="text-lg font-semibold">Post format?</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedPlatformData?.formats.map(f => (
                            <Card
                              key={f}
                              className="cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 border-white/10"
                              onClick={() => handleSelectFormat(f as PostFormat)}
                            >
                              <CardContent className="p-4 text-center">
                                <span className="text-2xl mb-2 block">
                                  {f === 'single' ? '📝' : f === 'carousel' ? '🎠' : '🧵'}
                                </span>
                                <p className="font-medium capitalize">{f}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('content-type')}>← Back</Button>
                      </div>
                    )}

                    {/* Step: Creating */}
                    {step === 'creating' && (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
                        <h3 className="text-lg font-semibold">MAYA is creating your {postFormat} content...</h3>
                      </div>
                    )}

                    {/* Step: Ready - Post Builder */}
                    {step === 'ready' && (
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{selectedPlatformData?.icon}</span>
                            <span className="font-medium">{selectedPlatformData?.name}</span>
                            <Badge variant="outline" className="capitalize">{postFormat}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={resetForm}>Start Over</Button>
                        </div>

                        {/* Post Mode Selection */}
                        <div className="flex gap-2">
                          {postModes.map(mode => (
                            <Button
                              key={mode.id}
                              variant={postMode === mode.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPostMode(mode.id as PostMode)}
                              className={postMode === mode.id ? 'bg-cyan-600' : ''}
                            >
                              <mode.icon className="w-4 h-4 mr-1" />{mode.label}
                            </Button>
                          ))}
                        </div>

                        {/* Slide Navigation (for carousel/thread) */}
                        {(postFormat === 'carousel' || postFormat === 'thread') && (
                          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                            <Button variant="outline" size="icon" onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex gap-1 flex-1 justify-center">
                              {slides.map((s, i) => (
                                <Button
                                  key={s.id}
                                  variant={i === currentSlideIndex ? 'default' : 'outline'}
                                  size="sm"
                                  className={`w-8 h-8 p-0 ${i === currentSlideIndex ? 'bg-cyan-600' : ''}`}
                                  onClick={() => setCurrentSlideIndex(i)}
                                >
                                  {i + 1}
                                </Button>
                              ))}
                              {slides.length < 10 && (
                                <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={addSlide}>
                                  <Plus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === slides.length - 1}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {/* Hook (first slide only) */}
                        {currentSlideIndex === 0 && postMode !== 'image-only' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Hook</label>
                              <Button variant="ghost" size="sm" onClick={handleGenerateHook} disabled={isGeneratingHook || isLoading}>
                                {isGeneratingHook ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                <span className="ml-1">Generate</span>
                              </Button>
                            </div>
                            <Input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Attention-grabbing opener..." className="bg-white/5 border-white/10" />
                          </div>
                        )}

                        {/* Current Slide Content */}
                        {postMode !== 'image-only' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">
                                {postFormat === 'single' ? 'Content' : `Slide ${currentSlideIndex + 1} Text`}
                              </label>
                              {slides.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => removeSlide(currentSlideIndex)} className="text-destructive">
                                  <Trash2 className="w-3 h-3 mr-1" />Remove
                                </Button>
                              )}
                            </div>
                            <Textarea
                              value={currentSlide?.text || ''}
                              onChange={(e) => updateSlideText(e.target.value)}
                              placeholder="Your content..."
                              className="bg-white/5 border-white/10 min-h-[100px]"
                            />
                          </div>
                        )}

                        {/* Current Slide Image */}
                        {postMode !== 'text-only' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">
                                {postFormat === 'single' ? 'Image' : `Slide ${currentSlideIndex + 1} Image`}
                              </label>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => generateImageForSlide(currentSlideIndex)} disabled={currentSlide?.isGeneratingImage}>
                                  {currentSlide?.isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
                                  <span className="ml-1">Generate</span>
                                </Button>
                                {slides.length > 1 && (
                                  <Button variant="ghost" size="sm" onClick={generateAllImages}>
                                    <Layers className="w-3 h-3 mr-1" />All
                                  </Button>
                                )}
                              </div>
                            </div>
                            {currentSlide?.imageUrl ? (
                              <div className="relative rounded-lg overflow-hidden border border-white/10">
                                <img src={currentSlide.imageUrl} alt="Generated" className="w-full h-48 object-cover" />
                                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setSlides(prev => prev.map((s, i) => i === currentSlideIndex ? { ...s, imageUrl: null } : s))}>
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="h-32 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-muted-foreground">
                                <Image className="w-6 h-6 mr-2" />No image
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hashtags */}
                        {postMode !== 'image-only' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Hashtags</label>
                              <Button variant="ghost" size="sm" onClick={handleGenerateHashtags} disabled={isGeneratingHashtags || isLoading}>
                                {isGeneratingHashtags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Hash className="w-3 h-3" />}
                                <span className="ml-1">Generate</span>
                              </Button>
                            </div>
                            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#trading #forex..." className="bg-white/5 border-white/10" />
                          </div>
                        )}

                        {/* Schedule */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
                          <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="bg-white/5 border-white/10" />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                          <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={handlePostNow} disabled={isPostingNow}>
                            {isPostingNow ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</> : <><Share2 className="w-4 h-4 mr-2" />Post Now</>}
                          </Button>
                          <Button variant="outline" onClick={handleSaveDraft}><FileText className="w-4 h-4 mr-2" />Draft</Button>
                          <Button variant="outline" onClick={handleSchedule} disabled={!scheduleDate}><Clock className="w-4 h-4 mr-2" />Schedule</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeView === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="bg-background/50 backdrop-blur border-white/10">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400" />Content Calendar</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map(date => {
                        const dayPosts = getPostsForDate(date);
                        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        return (
                          <div
                            key={date.toISOString()}
                            className={`p-2 rounded-lg border cursor-pointer transition-all min-h-[80px] ${isToday ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-white/30'}`}
                            onClick={() => { setScheduleDate(format(date, "yyyy-MM-dd'T'12:00")); setActiveView('create'); if (step === 'idle') handleStartBot(); }}
                          >
                            <div className="text-sm font-medium mb-1">{format(date, 'd')}</div>
                            {dayPosts.slice(0, 2).map(post => (
                              <div key={post.id} className={`text-xs truncate rounded px-1 mb-1 ${getStatusColor(post.status)}`}>{post.content.slice(0, 15)}...</div>
                            ))}
                            {dayPosts.length > 2 && <div className="text-xs text-muted-foreground">+{dayPosts.length - 2}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeView === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SocialPlatformSetup onStartBot={() => {}} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Post History */}
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="py-3 border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4 text-cyan-400" />Post History ({posts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No posts yet</p></div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {posts.slice().reverse().map(post => (
                      <div key={post.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${getStatusColor(post.status)}`}>{post.status}</Badge>
                              <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
                              {post.platforms?.map((p: string) => <span key={p} className="text-xs">{platforms.find(pl => pl.id === p)?.icon}</span>)}
                            </div>
                            <p className="text-sm line-clamp-2">{post.content}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSlides([{ id: '1', text: post.content, imageUrl: null, isGeneratingImage: false }]); setSelectedPlatform(post.platforms?.[0] || 'twitter'); setStep('ready'); setActiveView('create'); toast.success('Loaded'); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => { deletePost(post.id); toast.success('Deleted'); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat with MAYA */}
        <Card className="bg-background/50 backdrop-blur border-white/10 h-fit">
          <CardHeader className="border-b border-white/10 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="w-4 h-4 text-cyan-400" />Chat with MAYA</CardTitle>
              {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs h-7">Clear</Button>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-3">
                {messages.length === 0 && <div className="text-center py-8 text-muted-foreground"><Bot className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Ask MAYA anything</p></div>}
                {messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-7 h-7"><AvatarFallback className={msg.role === 'assistant' ? `bg-gradient-to-br ${AI_EMPLOYEE.color} text-white text-xs` : 'bg-primary/20 text-xs'}>{msg.role === 'assistant' ? 'M' : 'U'}</AvatarFallback></Avatar>
                    <div className={`max-w-[85%] rounded-xl p-2.5 text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-white/5 border border-white/10'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <Avatar className="w-7 h-7"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white text-xs`}>M</AvatarFallback></Avatar>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <Input placeholder="Ask MAYA..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChatSend()} className="bg-white/5 border-white/10 text-sm" disabled={isLoading} />
              <Button size="icon" onClick={handleChatSend} disabled={!chatInput.trim() || isLoading} className="bg-cyan-600 hover:bg-cyan-700"><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialMediaTab;
