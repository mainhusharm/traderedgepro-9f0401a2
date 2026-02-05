import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePersonalAccounts, PersonalAccount } from '@/hooks/usePersonalAccounts';
import AddPersonalAccountModal from '@/components/dashboard/AddPersonalAccountModal';
import EditPersonalAccountModal from '@/components/dashboard/EditPersonalAccountModal';
import UpdateBalanceModal from '@/components/dashboard/UpdateBalanceModal';

const BROKER_LOGOS: Record<string, string> = {
  'IC Markets': '🏦',
  'Pepperstone': '🌶️',
  'Oanda': '🔵',
  'XM': '❌',
  'FTMO': '🎯',
  'The5ers': '5️⃣',
  'Funded Next': '🔥',
  'True Forex Funds': '✅',
  'MyForexFunds': '💰',
  'Other': '📊',
};

const PersonalAccountsTab = () => {
  const { accounts, isLoading, deleteAccount, updateAccount } = usePersonalAccounts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PersonalAccount | null>(null);
  const [updatingBalance, setUpdatingBalance] = useState<PersonalAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<PersonalAccount | null>(null);

  const handleSetPrimary = async (account: PersonalAccount) => {
    await updateAccount(account.id, { is_primary: true });
  };

  const handleDelete = async () => {
    if (deletingAccount) {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6 h-48" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Trading Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal trading accounts and track performance
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="btn-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No accounts added yet</p>
          <Button onClick={() => setShowAddModal(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Account
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {accounts.map((account, index) => {
              const profit = Number(account.current_balance) - Number(account.starting_balance);
              const returnPct = (profit / Number(account.starting_balance)) * 100;
              const drawdownFromPeak = account.highest_balance > 0 
                ? ((Number(account.highest_balance) - Number(account.current_balance)) / Number(account.highest_balance)) * 100
                : 0;
              
              const brokerEmoji = BROKER_LOGOS[account.broker_name] || BROKER_LOGOS['Other'];

              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`glass-card hover:border-primary/30 transition-all ${account.is_primary ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl">
                            {brokerEmoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {account.account_label || account.broker_name}
                              </h3>
                              {account.is_primary && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {account.broker_name} • {account.account_type}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setUpdatingBalance(account)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Update Balance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            {!account.is_primary && (
                              <DropdownMenuItem onClick={() => handleSetPrimary(account)}>
                                <Star className="w-4 h-4 mr-2" />
                                Set as Primary
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setDeletingAccount(account)}
                              className="text-risk focus:text-risk"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Balance */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                        <p className="text-2xl font-bold">
                          ${Number(account.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total P&L</p>
                          <div className="flex items-center gap-1">
                            {profit >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-risk" />
                            )}
                            <span className={`text-sm font-semibold ${profit >= 0 ? 'text-success' : 'text-risk'}`}>
                              {profit >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">From Peak</p>
                          <span className={`text-sm font-semibold ${drawdownFromPeak > 0 ? 'text-risk' : 'text-success'}`}>
                            {drawdownFromPeak > 0 ? `-${drawdownFromPeak.toFixed(1)}%` : 'At Peak'}
                          </span>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Leverage</p>
                          <span className="text-sm font-semibold">1:{account.leverage}</span>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Risk/Trade</p>
                          <span className="text-sm font-semibold">{account.risk_per_trade_pct}%</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          account.status === 'active' 
                            ? 'bg-success/10 text-success' 
                            : account.status === 'paused'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {account.currency}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AddPersonalAccountModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      <EditPersonalAccountModal 
        open={!!editingAccount} 
        onClose={() => setEditingAccount(null)}
        account={editingAccount}
      />

      <UpdateBalanceModal
        open={!!updatingBalance}
        onClose={() => setUpdatingBalance(null)}
        account={updatingBalance}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAccount?.account_label || deletingAccount?.broker_name}"? 
              This will also delete all associated withdrawals, deposits, and trading history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-risk hover:bg-risk/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonalAccountsTab;
