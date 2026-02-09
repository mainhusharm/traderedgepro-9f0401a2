import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Upload,
  Palette,
  Building2,
  Image,
  Save,
  Loader2,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface BrandingSettings {
  company_name: string;
  company_tagline: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  include_disclaimer: boolean;
  custom_disclaimer: string;
  show_powered_by: boolean;
  contact_email: string;
  website_url: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  company_name: '',
  company_tagline: 'Professional Trading Performance Report',
  logo_url: '',
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  include_disclaimer: true,
  custom_disclaimer: 'This report is for informational purposes only. Past performance does not guarantee future results.',
  show_powered_by: true,
  contact_email: '',
  website_url: '',
};

const WhiteLabelReports = () => {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('monthly');

  useEffect(() => {
    fetchBrandingSettings();
  }, [user]);

  const fetchBrandingSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBranding(data.settings as BrandingSettings);
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          settings: branding,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Branding settings saved successfully');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast.success('Branding settings saved successfully');
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = <K extends keyof BrandingSettings>(
    key: K,
    value: BrandingSettings[K]
  ) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        updateBranding('logo_url', reader.result as string);
        toast.success('Logo uploaded');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload logo');
    }
  };

  const generateReport = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header with branding
      doc.setFillColor(branding.primary_color);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Company name or logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(branding.company_name || 'Trading Performance Report', 14, 25);

      if (branding.company_tagline) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(branding.company_tagline, 14, 33);
      }

      // Report date
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Report Period: ${getReportPeriod()}`, 14, 55);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 62);

      // Performance Summary Section
      doc.setFillColor(245, 245, 250);
      doc.rect(14, 75, pageWidth - 28, 60, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Summary', 20, 88);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Mock data - in real implementation, fetch from user's trading data
      const stats = [
        { label: 'Total Trades', value: '45' },
        { label: 'Win Rate', value: '68.9%' },
        { label: 'Profit Factor', value: '2.14' },
        { label: 'Total P&L', value: '+$4,250' },
        { label: 'Average RR', value: '1:2.3' },
        { label: 'Max Drawdown', value: '-4.2%' },
      ];

      stats.forEach((stat, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 20 + col * 60;
        const y = 100 + row * 20;

        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, x, y);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x, y + 8);
        doc.setFont('helvetica', 'normal');
      });

      // Trading Journal Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Trades', 14, 155);

      // Table header
      doc.setFillColor(branding.primary_color);
      doc.rect(14, 160, pageWidth - 28, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Date', 20, 167);
      doc.text('Symbol', 50, 167);
      doc.text('Direction', 85, 167);
      doc.text('Entry', 115, 167);
      doc.text('Exit', 140, 167);
      doc.text('P&L', 165, 167);

      // Sample trade rows
      const trades = [
        { date: '2024-01-15', symbol: 'EURUSD', dir: 'LONG', entry: '1.0850', exit: '1.0920', pnl: '+$350' },
        { date: '2024-01-14', symbol: 'XAUUSD', dir: 'SHORT', entry: '2045.50', exit: '2028.00', pnl: '+$520' },
        { date: '2024-01-13', symbol: 'GBPJPY', dir: 'LONG', entry: '188.25', exit: '189.80', pnl: '+$280' },
      ];

      doc.setTextColor(0, 0, 0);
      trades.forEach((trade, idx) => {
        const y = 178 + idx * 10;
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(14, y - 5, pageWidth - 28, 10, 'F');
        }
        doc.text(trade.date, 20, y);
        doc.text(trade.symbol, 50, y);
        doc.text(trade.dir, 85, y);
        doc.text(trade.entry, 115, y);
        doc.text(trade.exit, 140, y);
        doc.setTextColor(trade.pnl.startsWith('+') ? 0 : 200, trade.pnl.startsWith('+') ? 150 : 0, 0);
        doc.text(trade.pnl, 165, y);
        doc.setTextColor(0, 0, 0);
      });

      // Disclaimer
      if (branding.include_disclaimer) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const disclaimer = branding.custom_disclaimer || DEFAULT_BRANDING.custom_disclaimer;
        const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 28);
        doc.text(disclaimerLines, 14, pageHeight - 30);
      }

      // Footer
      doc.setFillColor(branding.secondary_color);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);

      if (branding.contact_email) {
        doc.text(branding.contact_email, 14, pageHeight - 6);
      }
      if (branding.website_url) {
        doc.text(branding.website_url, pageWidth - 14 - doc.getTextWidth(branding.website_url), pageHeight - 6);
      }

      if (branding.show_powered_by) {
        doc.setFontSize(7);
        doc.text('Powered by TraderEdgePro', pageWidth / 2, pageHeight - 6, { align: 'center' });
      }

      // Save PDF
      const filename = `${branding.company_name || 'Trading'}_Report_${getReportPeriod().replace(/\s/g, '_')}.pdf`;
      doc.save(filename);

      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const getReportPeriod = () => {
    const now = new Date();
    switch (selectedReportType) {
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        return `${weekStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      case 'monthly':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'yearly':
        return now.getFullYear().toString();
      default:
        return now.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-purple-500" />
              White-Label Reports
            </CardTitle>
            <CardDescription>
              Generate professional branded reports for your clients
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branding">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Your Trading Company"
                  value={branding.company_name}
                  onChange={(e) => updateBranding('company_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Professional Trading Performance Report"
                  value={branding.company_tagline}
                  onChange={(e) => updateBranding('company_tagline', e.target.value)}
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {branding.logo_url ? (
                  <div className="w-16 h-16 rounded-lg border border-white/10 overflow-hidden">
                    <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => updateBranding('primary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => updateBranding('primary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => updateBranding('secondary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={branding.secondary_color}
                    onChange={(e) => updateBranding('secondary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@company.com"
                  value={branding.contact_email}
                  onChange={(e) => updateBranding('contact_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://yourcompany.com"
                  value={branding.website_url}
                  onChange={(e) => updateBranding('website_url', e.target.value)}
                />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Include Disclaimer</Label>
                <Switch
                  checked={branding.include_disclaimer}
                  onCheckedChange={(checked) => updateBranding('include_disclaimer', checked)}
                />
              </div>
              {branding.include_disclaimer && (
                <Textarea
                  placeholder="Custom disclaimer text..."
                  value={branding.custom_disclaimer}
                  onChange={(e) => updateBranding('custom_disclaimer', e.target.value)}
                  rows={3}
                />
              )}
            </div>

            {/* Powered By */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <Label>Show "Powered by TraderEdgePro"</Label>
                <p className="text-xs text-muted-foreground">Display attribution in report footer</p>
              </div>
              <Switch
                checked={branding.show_powered_by}
                onCheckedChange={(checked) => updateBranding('show_powered_by', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label>Report Period</Label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'weekly', label: 'Weekly', icon: Calendar },
                  { id: 'monthly', label: 'Monthly', icon: Calendar },
                  { id: 'quarterly', label: 'Quarterly', icon: BarChart3 },
                  { id: 'yearly', label: 'Yearly', icon: BarChart3 },
                ].map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors text-center ${
                      selectedReportType === type.id
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedReportType(type.id)}
                  >
                    <type.icon className="w-5 h-5 mx-auto mb-2" />
                    <div className="text-sm font-medium">{type.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Report Preview</h4>
                <Badge variant="outline">{getReportPeriod()}</Badge>
              </div>

              <div className="aspect-[8.5/11] bg-white rounded-lg p-4 text-black text-xs overflow-hidden">
                <div
                  className="h-8 rounded mb-4 flex items-center px-3"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  <span className="text-white font-bold text-sm">
                    {branding.company_name || 'Your Company'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-16 bg-gray-100 rounded mt-4"></div>
                  <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WhiteLabelReports;
