import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, Trash2, RefreshCw, DollarSign, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAccountantApi } from '@/hooks/useAccountantApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  notes: string;
  created_by: string;
  created_at: string;
}

const USD_TO_INR = 83.5;

const CATEGORIES = [
  'Software & Tools',
  'Marketing',
  'Server & Hosting',
  'Legal',
  'Affiliate Payouts',
  'Salaries',
  'Office',
  'Travel',
  'Other'
];

const ExpensesTab = () => {
  const { callAccountantApi, isLoading } = useAccountantApi();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    currency: 'USD',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
    created_by: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await callAccountantApi('get_expenses');
      setExpenses(result.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await callAccountantApi('add_expense', {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      toast({
        title: 'Expense added',
        description: 'The expense has been recorded successfully'
      });
      setNewExpense({
        description: '',
        amount: '',
        currency: 'USD',
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
        created_by: ''
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await callAccountantApi('delete_expense', { id });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been removed'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive'
      });
    }
  };

  const totalUSD = expenses
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalINR = expenses
    .filter(e => e.currency === 'INR')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalInUSD = totalUSD + (totalINR / USD_TO_INR);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    const amountInUSD = expense.currency === 'INR' ? expense.amount / USD_TO_INR : expense.amount;
    acc[category] = (acc[category] || 0) + amountInUSD;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <Receipt className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">${totalInUSD.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(totalInUSD * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">USD Expenses</CardTitle>
              <DollarSign className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totalUSD.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{expenses.filter(e => e.currency === 'USD').length} items</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">INR Expenses</CardTitle>
              <IndianRupee className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">₹{totalINR.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">{expenses.filter(e => e.currency === 'INR').length} items</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card className="border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="p-4 rounded-lg bg-white/5 border border-white/[0.08]">
                    <p className="text-sm text-muted-foreground">{category}</p>
                    <p className="text-lg font-bold text-foreground">${amount.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card className="border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Expenses</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Description *</Label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="e.g., Server hosting"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={newExpense.currency}
                        onValueChange={(value) => setNewExpense({ ...newExpense, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Added By</Label>
                    <Select
                      value={newExpense.created_by}
                      onValueChange={(value) => setNewExpense({ ...newExpense, created_by: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Anchal">Anchal</SelectItem>
                        <SelectItem value="Sahil">Sahil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full bg-emerald-500 hover:bg-emerald-600">
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Expense" to record your first expense</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08]">
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="border-white/[0.08]">
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        {expense.notes && <p className="text-xs text-muted-foreground">{expense.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-red-400">
                        {expense.currency === 'USD' ? '$' : '₹'}{expense.amount?.toLocaleString()}
                      </p>
                      {expense.currency === 'INR' && (
                        <p className="text-xs text-muted-foreground">
                          ≈ ${(expense.amount / USD_TO_INR).toFixed(2)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{expense.category}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.created_by || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesTab;
