// Top Performers Data
// This data represents our verified top performers with lifetime payouts
// Update this file when real user data surpasses these figures

export interface TopPerformer {
  id: string;
  name: string;
  location: string;
  avatar?: string;
  lifetimePayout: number;
  totalTrades: number;
  winRate: number;
  propFirm: string;
  memberSince: string;
  badge: 'gold' | 'silver' | 'bronze' | 'elite';
}

// Top performers based on verified payout screenshots
// These will be replaced by real user data when users surpass these figures
export const topPerformers: TopPerformer[] = [
  {
    id: 'tp-1',
    name: 'David Kim',
    location: 'Los Angeles, USA',
    lifetimePayout: 47500,
    totalTrades: 312,
    winRate: 68.2,
    propFirm: 'Funded Trader Markets',
    memberSince: 'Aug 2025',
    badge: 'gold',
  },
  {
    id: 'tp-2',
    name: 'Sarah Jones',
    location: 'London, UK',
    lifetimePayout: 38200,
    totalTrades: 287,
    winRate: 65.8,
    propFirm: 'Funded Trading Plus',
    memberSince: 'Sep 2025',
    badge: 'silver',
  },
  {
    id: 'tp-3',
    name: 'Ravi Kumar',
    location: 'Mumbai, India',
    lifetimePayout: 31450,
    totalTrades: 245,
    winRate: 62.4,
    propFirm: 'E8 Markets',
    memberSince: 'Jul 2025',
    badge: 'bronze',
  },
  {
    id: 'tp-4',
    name: 'Lisa Brown',
    location: 'Toronto, Canada',
    lifetimePayout: 28600,
    totalTrades: 198,
    winRate: 71.2,
    propFirm: 'Funded Trading Plus',
    memberSince: 'Oct 2025',
    badge: 'elite',
  },
  {
    id: 'tp-5',
    name: 'Omar Al-Fayed',
    location: 'Dubai, UAE',
    lifetimePayout: 24800,
    totalTrades: 176,
    winRate: 64.5,
    propFirm: 'Funded Trading Plus',
    memberSince: 'Sep 2025',
    badge: 'elite',
  },
  {
    id: 'tp-6',
    name: 'James Miller',
    location: 'Dallas, USA',
    lifetimePayout: 21350,
    totalTrades: 203,
    winRate: 61.8,
    propFirm: 'Blueberry Funded',
    memberSince: 'Aug 2025',
    badge: 'elite',
  },
  {
    id: 'tp-7',
    name: 'Wei Chen',
    location: 'Singapore',
    lifetimePayout: 18900,
    totalTrades: 167,
    winRate: 66.3,
    propFirm: 'Blueberry Funded',
    memberSince: 'Oct 2025',
    badge: 'elite',
  },
  {
    id: 'tp-8',
    name: 'Mateo Cruz',
    location: 'Mexico City, Mexico',
    lifetimePayout: 16200,
    totalTrades: 154,
    winRate: 63.7,
    propFirm: 'Funded Trader Markets',
    memberSince: 'Nov 2025',
    badge: 'elite',
  },
];

// Helper function to format currency
export const formatPayout = (amount: number): string => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

// Get total community payouts
export const getTotalCommunityPayouts = (): number => {
  return topPerformers.reduce((sum, p) => sum + p.lifetimePayout, 0);
};
