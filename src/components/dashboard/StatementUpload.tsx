import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PropAccount {
  id: string;
  account_name: string;
  prop_firm: string;
}

interface UploadRecord {
  id: string;
  file_url: string;
  file_type: string;
  parsing_status: string;
  equity_extracted: number | null;
  created_at: string;
}

interface StatementUploadProps {
  className?: string;
}

export default function StatementUpload({ className }: StatementUploadProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PropAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useState(() => {
    if (user) {
      fetchAccounts();
      fetchUploads();
    }
  });

  const fetchAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_prop_accounts')
      .select('id, account_label, prop_firm_name')
      .eq('user_id', user.id)
      .in('status', ['active', 'evaluation', 'funded']);

    const mapped = (data || []).map(d => ({
      id: d.id,
      account_name: d.account_label || 'Account',
      prop_firm: d.prop_firm_name || ''
    }));
    setAccounts(mapped);
    if (mapped.length === 1) {
      setSelectedAccountId(mapped[0].id);
    }
  };

  const fetchUploads = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('account_statement_uploads')
      .select('id, file_url, file_type, parsing_status, equity_extracted, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setUploads(data || []);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [selectedAccountId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('Please log in to upload statements');
      return;
    }

    if (!selectedAccountId) {
      toast.error('Please select an account first');
      return;
    }

    // Validate file type
    const validTypes = ['text/html', 'text/csv', 'image/png', 'image/jpeg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload HTML, CSV, PDF, or image files.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedAccountId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('statements')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, create it
        if (uploadError.message.includes('not found')) {
          // Try to continue without storage, just create the record
          toast.warning('Storage bucket not configured. Statement will be recorded without file.');
        } else {
          throw uploadError;
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('statements')
        .getPublicUrl(fileName);

      const fileUrl = urlData?.publicUrl || `placeholder://${fileName}`;

      // Determine file type
      let fileType: 'html' | 'csv' | 'screenshot' | 'pdf' = 'html';
      if (file.type.includes('csv')) fileType = 'csv';
      else if (file.type.includes('image')) fileType = 'screenshot';
      else if (file.type.includes('pdf')) fileType = 'pdf';

      // Create upload record
      const { data: uploadRecord, error: recordError } = await supabase
        .from('account_statement_uploads')
        .insert({
          user_id: user.id,
          account_id: selectedAccountId,
          file_url: fileUrl,
          file_type: fileType,
          parsing_status: 'pending'
        })
        .select()
        .single();

      if (recordError) throw recordError;

      toast.success('Statement uploaded! Parsing...', {
        description: 'Your statement is being analyzed.'
      });

      // Trigger parsing
      await supabase.functions.invoke('parse-trading-statement', {
        body: {
          uploadId: uploadRecord.id,
          fileUrl: fileUrl,
          fileType: fileType,
          userId: user.id,
          accountId: selectedAccountId
        }
      });

      fetchUploads();
    } catch (error) {
      console.error('Error uploading statement:', error);
      toast.error('Failed to upload statement');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" /> Parsed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Statement Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Selection */}
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name} ({account.prop_firm})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            id="statement-upload"
            className="hidden"
            accept=".html,.csv,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <label htmlFor="statement-upload" className="cursor-pointer">
            {isUploading ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Drop your statement here</p>
                <p className="text-xs text-muted-foreground">
                  HTML, CSV, PDF, or screenshot
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Recent Uploads */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{upload.file_type.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(upload.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {upload.equity_extracted && (
                    <span className="text-emerald-400 font-medium">
                      ${upload.equity_extracted.toLocaleString()}
                    </span>
                  )}
                  {getStatusBadge(upload.parsing_status)}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Upload your MT4/MT5 statements to automatically sync equity and trade data.
          Supports HTML statements, CSV exports, and screenshots.
        </p>
      </CardContent>
    </Card>
  );
}
