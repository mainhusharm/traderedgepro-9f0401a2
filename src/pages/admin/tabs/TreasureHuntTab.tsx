import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Play, CheckCircle, Download, RefreshCw, Search, Crown, Sparkles, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SpinWheel } from "@/components/treasure-hunt/SpinWheel";
import { CountdownTimer } from "@/components/treasure-hunt/CountdownTimer";

interface TreasureHuntEntry {
  id: string;
  email: string;
  twitter_handle: string;
  current_stage: number;
  started_at: string;
  completed_at: string | null;
  is_winner: boolean;
  winner_position: number | null;
  hints_used: number;
  discount_code?: string;
  announcement_status?: string;
  pending_winner?: boolean;
}

interface HuntConfig {
  id: string;
  reveal_date: string;
  spins_remaining: number;
  winners_announced: boolean;
}

export default function TreasureHuntTab() {
  const [entries, setEntries] = useState<TreasureHuntEntry[]>([]);
  const [config, setConfig] = useState<HuntConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed" | "winners">("all");
  const [search, setSearch] = useState("");
  const [selectedWinners, setSelectedWinners] = useState<TreasureHuntEntry[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const stats = {
    total: entries.length,
    inProgress: entries.filter(e => !e.completed_at).length,
    completed: entries.filter(e => e.completed_at).length,
    winners: entries.filter(e => e.is_winner).length,
  };

  useEffect(() => {
    fetchEntries();
    fetchConfig();
    
    const channel = supabase
      .channel("treasure-hunt-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "treasure_hunt_entries" }, () => fetchEntries())
      .on("postgres_changes", { event: "*", schema: "public", table: "treasure_hunt_config" }, () => fetchConfig())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("treasure_hunt_entries").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data as unknown as TreasureHuntEntry[]);
    setIsLoading(false);
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from("treasure_hunt_config").select("*").single();
    if (data) setConfig(data as unknown as HuntConfig);
  };

  const handleSpinComplete = async (winnerId: string, winnerHandle: string) => {
    const position = 3 - (config?.spins_remaining || 0) + 1;
    const discountCode = `TREASURE-WINNER-${position}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Update entry as winner
    await supabase.from("treasure_hunt_entries").update({
      is_winner: true,
      winner_position: position,
      pending_winner: true,
      discount_code: discountCode,
    }).eq("id", winnerId);

    // Create coupon
    await supabase.from("coupons").insert({
      code: discountCode,
      discount_type: "percentage",
      discount_value: 100,
      max_uses: 1,
      is_active: true,
      is_private: true,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Update spins remaining
    await (supabase.from("treasure_hunt_config" as any).update({ spins_remaining: (config?.spins_remaining || 3) - 1 } as any).eq("id", config?.id) as any);

    toast.success(`🎉 ${winnerHandle} selected as ${position === 1 ? "1st" : position === 2 ? "2nd" : "3rd"} place winner!`);
    fetchEntries();
    fetchConfig();
  };

  const announceWinners = async () => {
    const winners = entries.filter(e => e.is_winner && e.pending_winner);
    if (winners.length === 0) {
      toast.error("No winners selected yet!");
      return;
    }

    setIsAnnouncing(true);
    try {
      const { error } = await supabase.functions.invoke("announce-treasure-hunt-winners", {
        body: { winners: winners.map(w => ({ id: w.id, email: w.email, twitter_handle: w.twitter_handle, winner_position: w.winner_position, discount_code: w.discount_code })) },
      });

      if (error) throw error;
      toast.success("🎉 Winners announced via email and Twitter!");
      fetchEntries();
      fetchConfig();
    } catch (err: any) {
      toast.error(`Failed to announce: ${err.message}`);
    } finally {
      setIsAnnouncing(false);
    }
  };

  const completedParticipants = entries.filter(e => e.completed_at && !e.is_winner);
  const revealDate = config ? new Date(config.reveal_date) : new Date();

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === "all" || (filter === "in_progress" && !entry.completed_at) || (filter === "completed" && entry.completed_at) || (filter === "winners" && entry.is_winner);
    const matchesSearch = !search || entry.email.toLowerCase().includes(search.toLowerCase()) || entry.twitter_handle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Entries</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle><Play className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.completed}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Winners</CardTitle><Trophy className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{stats.winners}/3</div></CardContent></Card>
      </div>

      {/* Spin Wheel Section */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" />Winner Selection - Spin Wheel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-primary" /><span>Reveal Date:</span></div>
            <div className="text-right">
              <p className="font-bold text-lg">{format(revealDate, "MMMM d, yyyy")}</p>
              <p className="text-sm text-muted-foreground">{format(revealDate, "h:mm a")}</p>
            </div>
          </div>

          {completedParticipants.length > 0 && (config?.spins_remaining || 0) > 0 ? (
            <SpinWheel participants={completedParticipants.map(p => ({ id: p.id, twitter_handle: p.twitter_handle }))} onSpinComplete={handleSpinComplete} spinsRemaining={config?.spins_remaining || 0} disabled={config?.winners_announced} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {(config?.spins_remaining || 0) === 0 ? "All 3 winners have been selected!" : "No completed participants available to spin."}
            </div>
          )}

          {stats.winners === 3 && !config?.winners_announced && (
            <Button onClick={announceWinners} disabled={isAnnouncing} className="w-full h-14 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-lg">
              <Send className="w-5 h-5" />{isAnnouncing ? "Announcing..." : "Announce All Winners (Email + Twitter)"}
            </Button>
          )}
          {config?.winners_announced && <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-500">✓ Winners Announced</Badge>}
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" />Treasure Hunt Participants</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchEntries}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const csv = [["Email", "Twitter", "Stage", "Started", "Completed", "Winner", "Position"], ...entries.map(e => [e.email, e.twitter_handle, e.current_stage, e.started_at, e.completed_at || "", e.is_winner ? "Yes" : "No", e.winner_position || ""])].map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `treasure-hunt-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
              }}><Download className="w-4 h-4 mr-2" />Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="winners">Winners</SelectItem></SelectContent></Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Progress</TableHead><TableHead>Started</TableHead><TableHead>Completed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : filteredEntries.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No entries</TableCell></TableRow> : filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell><div><p className="font-medium">{entry.email}</p><p className="text-sm text-muted-foreground">@{entry.twitter_handle}</p></div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="flex gap-1">{[1,2,3].map(s => <div key={s} className={`w-2 h-2 rounded-full ${entry.current_stage > s ? "bg-green-500" : entry.current_stage === s ? "bg-blue-500" : "bg-muted"}`} />)}</div><span className="text-sm text-muted-foreground">Stage {entry.current_stage}</span></div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(entry.started_at), "MMM d, HH:mm")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.completed_at ? format(new Date(entry.completed_at), "MMM d, HH:mm") : "-"}</TableCell>
                    <TableCell>{entry.is_winner ? <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Crown className="w-3 h-3 mr-1" />{entry.winner_position === 1 ? "1st" : entry.winner_position === 2 ? "2nd" : "3rd"}</Badge> : entry.completed_at ? <Badge variant="secondary">Completed</Badge> : <Badge variant="outline">In Progress</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
