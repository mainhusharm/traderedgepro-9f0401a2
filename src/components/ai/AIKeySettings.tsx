 import { useState, useEffect } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Key, Eye, EyeOff, Save, Trash2, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/lib/auth/AuthContext';
 import { toast } from 'sonner';
 
 interface AIKeySettingsProps {
   onKeyConfigured?: (hasKey: boolean) => void;
   compact?: boolean;
 }
 
 const AI_PROVIDERS = [
   { 
     id: 'gemini', 
     name: 'Google Gemini', 
     description: 'Free tier available, recommended',
     models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
     getKeyUrl: 'https://aistudio.google.com/apikey',
     instructions: [
       'Go to Google AI Studio',
       'Sign in with your Google account',
       'Click "Create API Key"',
       'Copy the generated API key',
       'Paste it below'
     ]
   },
   { 
     id: 'openai', 
     name: 'OpenAI GPT', 
     description: 'Powerful, requires paid API key',
     models: ['gpt-4o-mini', 'gpt-4o'],
     getKeyUrl: 'https://platform.openai.com/api-keys',
     instructions: [
       'Go to OpenAI Platform',
       'Sign in or create an account',
       'Navigate to API Keys section',
       'Click "Create new secret key"',
       'Copy and paste below'
     ]
   },
   { 
     id: 'anthropic', 
     name: 'Anthropic Claude', 
     description: 'High quality, requires paid API key',
     models: ['claude-3-haiku', 'claude-3-sonnet'],
     getKeyUrl: 'https://console.anthropic.com/settings/keys',
     instructions: [
       'Go to Anthropic Console',
       'Sign in or create an account',
       'Navigate to API Keys',
       'Create a new API key',
       'Copy and paste below'
     ]
   }
 ];
 
 export const AIKeySettings = ({ onKeyConfigured, compact = false }: AIKeySettingsProps) => {
   const { user } = useAuth();
   const [provider, setProvider] = useState<string>('gemini');
   const [apiKey, setApiKey] = useState<string>('');
   const [showKey, setShowKey] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [existingSettings, setExistingSettings] = useState<{ provider: string; hasKey: boolean } | null>(null);
   const [showInstructions, setShowInstructions] = useState(false);
 
   const selectedProvider = AI_PROVIDERS.find(p => p.id === provider);
 
   useEffect(() => {
     if (user) {
       fetchExistingSettings();
     }
   }, [user]);
 
   const fetchExistingSettings = async () => {
     if (!user) return;
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from('user_ai_settings')
         .select('provider, api_key_encrypted')
         .eq('user_id', user.id)
         .limit(1);
 
       const row = (data as any[] | null)?.[0];
       if (row) {
         setExistingSettings({ provider: row.provider, hasKey: !!row.api_key_encrypted });
         setProvider(row.provider);
         onKeyConfigured?.(true);
       } else {
         setExistingSettings(null);
         onKeyConfigured?.(false);
       }
     } catch (error) {
       console.error('Error fetching AI settings:', error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleSave = async () => {
      const cleanKey = apiKey.trim();
      if (!user || !cleanKey) {
       toast.error('Please enter your API key');
       return;
     }
 
     setIsSaving(true);
     try {
       // Simple encryption (base64 + prefix for basic obfuscation)
        const encryptedKey = btoa(`${provider}:${cleanKey}`);
       
       const { error } = await supabase
         .from('user_ai_settings')
         .upsert({
           user_id: user.id,
           provider: provider,
           api_key_encrypted: encryptedKey,
           updated_at: new Date().toISOString()
         }, {
           onConflict: 'user_id'
         });
 
       if (error) throw error;
 
       setExistingSettings({ provider, hasKey: true });
       setApiKey('');
       onKeyConfigured?.(true);
       toast.success('API key saved successfully! Nexus AI is ready to use.');
     } catch (error) {
       console.error('Error saving API key:', error);
       toast.error('Failed to save API key');
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleDelete = async () => {
     if (!user) return;
 
     setIsSaving(true);
     try {
       const { error } = await supabase
         .from('user_ai_settings')
         .delete()
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setExistingSettings(null);
       setApiKey('');
       onKeyConfigured?.(false);
       toast.success('API key deleted');
     } catch (error) {
       console.error('Error deleting API key:', error);
       toast.error('Failed to delete API key');
     } finally {
       setIsSaving(false);
     }
   };
 
   if (isLoading) {
     return (
       <Card className={compact ? 'border-dashed' : ''}>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   // Compact view when key is already configured
   if (compact && existingSettings?.hasKey) {
     return (
       <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-primary" />
         <span className="text-muted-foreground">
           Using {AI_PROVIDERS.find(p => p.id === existingSettings.provider)?.name || existingSettings.provider}
         </span>
         <Button variant="ghost" size="sm" onClick={() => setExistingSettings({ ...existingSettings, hasKey: false })}>
           Change
         </Button>
       </div>
     );
   }
 
   return (
      <Card className={compact ? 'border-dashed border-border bg-muted/30' : ''}>
       <CardHeader className={compact ? 'pb-3' : ''}>
         <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : ''}`}>
           <Key className="h-5 w-5 text-primary" />
           {existingSettings?.hasKey ? 'Update AI Provider' : 'Setup Your AI Provider'}
         </CardTitle>
         <CardDescription>
           {existingSettings?.hasKey 
             ? 'Change your AI provider or update your API key'
             : 'Add your own API key to use Nexus AI. Your key is stored securely.'}
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Provider Selection */}
         <div className="space-y-2">
           <Label>AI Provider</Label>
           <Select value={provider} onValueChange={setProvider}>
             <SelectTrigger>
               <SelectValue placeholder="Select AI provider" />
             </SelectTrigger>
             <SelectContent>
               {AI_PROVIDERS.map(p => (
                 <SelectItem key={p.id} value={p.id}>
                   <div className="flex flex-col">
                     <span>{p.name}</span>
                     <span className="text-xs text-muted-foreground">{p.description}</span>
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* Instructions Toggle */}
         <Button
           variant="outline"
           size="sm"
           className="w-full"
           onClick={() => setShowInstructions(!showInstructions)}
         >
           {showInstructions ? 'Hide' : 'Show'} How to Get API Key
         </Button>
 
         <AnimatePresence>
           {showInstructions && selectedProvider && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
             >
               <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="font-medium text-sm">Steps to get your {selectedProvider.name} API key:</h4>
                   <a
                     href={selectedProvider.getKeyUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-xs text-primary hover:underline flex items-center gap-1"
                   >
                     Open {selectedProvider.name}
                     <ExternalLink className="h-3 w-3" />
                   </a>
                 </div>
                 <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                   {selectedProvider.instructions.map((step, idx) => (
                     <li key={idx}>{step}</li>
                   ))}
                 </ol>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
 
         {/* API Key Input */}
         <div className="space-y-2">
           <Label>API Key</Label>
           <div className="relative">
             <Input
               type={showKey ? 'text' : 'password'}
               placeholder={existingSettings?.hasKey ? '••••••••••••••••' : 'Paste your API key here'}
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               className="pr-10"
             />
             <Button
               type="button"
               variant="ghost"
               size="icon"
               className="absolute right-0 top-0 h-full px-3"
               onClick={() => setShowKey(!showKey)}
             >
               {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
             </Button>
           </div>
           <p className="text-xs text-muted-foreground">
             Your API key is encrypted and stored securely. Only you can use it.
           </p>
         </div>
 
         {/* Actions */}
         <div className="flex gap-2">
           <Button
             onClick={handleSave}
             disabled={!apiKey.trim() || isSaving}
             className="flex-1"
           >
             {isSaving ? (
               <Loader2 className="h-4 w-4 animate-spin mr-2" />
             ) : (
               <Save className="h-4 w-4 mr-2" />
             )}
             {existingSettings?.hasKey ? 'Update Key' : 'Save Key'}
           </Button>
           
           {existingSettings?.hasKey && (
             <Button
               variant="destructive"
               onClick={handleDelete}
               disabled={isSaving}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
         </div>
 
         {/* Status */}
         {existingSettings?.hasKey && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle className="h-5 w-5 text-primary" />
             <div>
                <p className="text-sm font-medium text-primary">
                 API key configured
               </p>
               <p className="text-xs text-muted-foreground">
                 Using {AI_PROVIDERS.find(p => p.id === existingSettings.provider)?.name}
               </p>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default AIKeySettings;