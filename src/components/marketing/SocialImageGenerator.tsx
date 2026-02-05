import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Download, Copy, Loader2, ImageIcon, Sparkles, 
  Instagram, Twitter, Linkedin, Youtube, Facebook
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const styles = [
  { id: 'modern', name: 'Modern & Clean', icon: '✨' },
  { id: 'bold', name: 'Bold & Vibrant', icon: '🔥' },
  { id: 'elegant', name: 'Elegant & Premium', icon: '💎' },
  { id: 'tech', name: 'Tech & Futuristic', icon: '🚀' },
  { id: 'trading', name: 'Trading & Finance', icon: '📈' },
];

const platforms = [
  { id: 'instagram', name: 'Instagram Post', icon: '📸' },
  { id: 'story', name: 'Story (9:16)', icon: '📱' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'youtube', name: 'YouTube Thumbnail', icon: '▶️' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
];

interface SocialImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const SocialImageGenerator = ({ onImageGenerated }: SocialImageGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [platform, setPlatform] = useState('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your image');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-social-image', {
        body: { prompt, style, platform }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      setImageDescription(data.description);
      onImageGenerated?.(data.imageUrl);
      toast.success('Image generated successfully!');
    } catch (err: any) {
      console.error('Image generation error:', err);
      toast.error(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  const handleCopyUrl = () => {
    if (!generatedImage) return;
    navigator.clipboard.writeText(generatedImage);
    toast.success('Image URL copied to clipboard!');
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          AI Image Generator
          <Badge className="bg-green-500/20 text-green-400 ml-2">Pro Quality</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>What do you want to create?</Label>
          <Input
            placeholder="E.g., A motivational quote about trading discipline with gold accents..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-white/5 border-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform Format</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Pro-Quality Image...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img
                  src={generatedImage}
                  alt="Generated social media image"
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCopyUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {imageDescription && (
                <p className="text-sm text-muted-foreground">{imageDescription}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            ✨ Powered by AI • Creates professional After Effects-quality graphics
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialImageGenerator;
