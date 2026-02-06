import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface RiskReportExportProps {
  accountId: string;
  userId: string;
}

export default function RiskReportExport({ accountId, userId }: RiskReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch account data
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!account) {
        toast.error('Account not found');
        return;
      }

      // Fetch recent trades
      const { data: trades } = await supabase
        .from('trade_journal')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(20);

      // Fetch dashboard stats
      const { data: dashboard } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Trading Risk Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });

      // Account Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Account Summary', 14, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const accountData = [
        ['Prop Firm', account.prop_firm_name || 'N/A'],
        ['Account Type', account.account_type || 'N/A'],
        ['Account Size', `$${(account.account_size || 0).toLocaleString()}`],
        ['Current Equity', `$${(account.current_equity || 0).toLocaleString()}`],
        ['Starting Balance', `$${(account.starting_balance || 0).toLocaleString()}`],
        ['Net Profit/Loss', `$${((account.current_equity || 0) - (account.starting_balance || 0)).toLocaleString()}`],
        ['Status', account.status || 'Active'],
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: accountData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Risk Metrics Section
      const riskY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Metrics', 14, riskY);

      const riskData = [
        ['Daily DD Limit', `${account.daily_dd_limit_pct || 5}%`],
        ['Daily DD Used', `${(account.daily_drawdown_used_pct || 0).toFixed(2)}%`],
        ['Max DD Limit', `${account.max_dd_limit_pct || 10}%`],
        ['Max DD Used', `${(account.max_drawdown_used_pct || 0).toFixed(2)}%`],
        ['Profit Target', `${account.profit_target || 8}%`],
        ['Current Progress', `${(((account.current_profit || 0) / (account.starting_balance || 100000) * 100)).toFixed(2)}%`],
      ];

      autoTable(doc, {
        startY: riskY + 5,
        head: [['Risk Metric', 'Value']],
        body: riskData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });

      // Trading Statistics Section
      const statsY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Trading Statistics', 14, statsY);

      const statsData = [
        ['Total Trades', `${dashboard?.total_trades || 0}`],
        ['Winning Trades', `${dashboard?.winning_trades || 0}`],
        ['Losing Trades', `${dashboard?.losing_trades || 0}`],
        ['Win Rate', `${(dashboard?.win_rate || 0).toFixed(1)}%`],
        ['Profit Factor', `${(dashboard?.profit_factor || 0).toFixed(2)}`],
        ['Average Win', `$${(dashboard?.average_win || 0).toFixed(2)}`],
        ['Average Loss', `$${(dashboard?.average_loss || 0).toFixed(2)}`],
        ['Total P&L', `$${(dashboard?.total_pnl || 0).toFixed(2)}`],
      ];

      autoTable(doc, {
        startY: statsY + 5,
        head: [['Statistic', 'Value']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });

      // Recent Trades Section (new page if needed)
      if (trades && trades.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Trade History', 14, 20);

        const tradeRows = trades.slice(0, 15).map((t: any) => [
          format(new Date(t.entry_date), 'MM/dd/yy'),
          t.symbol,
          t.trade_type,
          `$${(t.pnl || 0).toFixed(2)}`,
          t.status,
        ]);

        autoTable(doc, {
          startY: 25,
          head: [['Date', 'Symbol', 'Type', 'P&L', 'Status']],
          body: tradeRows,
          theme: 'striped',
          headStyles: { fillColor: [107, 114, 128] },
        });
      }

      // Compliance Statement
      const compY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('This report is generated for informational purposes.', 14, compY);
      doc.text('Please verify all data with your prop firm dashboard.', 14, compY + 5);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Download
      const fileName = `Risk_Report_${account.prop_firm_name || 'Trading'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report', { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Risk Report
        </CardTitle>
        <CardDescription>
          Export PDF for payout requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={generateReport} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Includes account summary, risk metrics & trade history
        </p>
      </CardContent>
    </Card>
  );
}
