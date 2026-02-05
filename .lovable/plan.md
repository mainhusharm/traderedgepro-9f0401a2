
# Personal Capital Trading Dashboard - Feature Expansion Plan

## Overview

This plan introduces a **Real Capital Trading Mode** as a toggleable dashboard within the existing `UserDashboard`, allowing users to switch between "Prop Firm Challenge" mode and "Personal Capital" mode. The system will be fully functional with real-time data, database persistence, and tailored features for traders using their own money.

---

## Architecture: Dashboard Mode Toggle

### Toggle Implementation
A mode switcher will be added to the dashboard header/sidebar, allowing users to toggle between:
- **Prop Firm Mode** (existing): Challenge tracking, phase compliance, firm rules
- **Personal Capital Mode** (new): Portfolio growth, income tracking, capital preservation

The toggle will:
- Persist user preference in database
- Change sidebar navigation items based on mode
- Update header stats to show relevant metrics
- Maintain separate data contexts for each mode

---

## Phase 1: Database Schema

### New Tables Required

```
user_personal_accounts
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── broker_name (TEXT) - e.g., "IC Markets", "Pepperstone", "Oanda"
├── account_label (TEXT) - User-friendly name
├── account_number (TEXT) - Optional reference
├── currency (TEXT) - "USD", "EUR", "GBP"
├── starting_balance (DECIMAL)
├── current_balance (DECIMAL)
├── highest_balance (DECIMAL) - For drawdown tracking
├── leverage (INTEGER) - e.g., 30, 100, 500
├── account_type (TEXT) - "standard", "ecn", "raw"
├── is_primary (BOOLEAN) - Default account
├── risk_per_trade_pct (DECIMAL) - Personal risk tolerance
├── daily_loss_limit_pct (DECIMAL) - Personal circuit breaker
├── monthly_income_goal (DECIMAL) - For income tracking
├── capital_floor (DECIMAL) - Never go below this
├── status (TEXT) - "active", "paused", "closed"
├── created_at, updated_at

user_withdrawals
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── account_id (UUID, FK → user_personal_accounts)
├── amount (DECIMAL)
├── currency (TEXT)
├── withdrawal_date (DATE)
├── withdrawal_type (TEXT) - "profit_take", "regular", "emergency"
├── notes (TEXT)
├── created_at

user_deposits
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── account_id (UUID, FK → user_personal_accounts)
├── amount (DECIMAL)
├── deposit_date (DATE)
├── notes (TEXT)
├── created_at

personal_capital_daily_stats
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── account_id (UUID, FK → user_personal_accounts)
├── date (DATE)
├── opening_balance (DECIMAL)
├── closing_balance (DECIMAL)
├── realized_pnl (DECIMAL)
├── trades_taken (INTEGER)
├── winning_trades (INTEGER)
├── losing_trades (INTEGER)
├── created_at
```

### Schema Modifications

```sql
-- Add trading_mode to questionnaires
ALTER TABLE questionnaires ADD COLUMN trading_mode TEXT DEFAULT 'prop_firm';
-- Values: 'prop_firm', 'personal_capital', 'both'

-- Add trading_mode preference to profiles
ALTER TABLE profiles ADD COLUMN preferred_dashboard_mode TEXT DEFAULT 'prop_firm';
```

---

## Phase 2: Dashboard Mode Toggle Component

### New Files

```
src/components/dashboard/DashboardModeToggle.tsx
```

This component will:
- Display as a styled toggle/pill in the sidebar header
- Show icons for each mode (Building2 for Prop, Wallet for Personal)
- Animate transition between modes
- Persist preference to database on change

### Integration Points
- Added below the logo in `UserDashboard.tsx` sidebar
- Updates URL params: `?mode=prop` or `?mode=personal`
- Triggers re-render of sidebar navigation and main content

---

## Phase 3: Personal Capital Tab Components

### New Dashboard Tabs (for Personal Capital Mode)

```
src/pages/dashboard/tabs/personal/
├── PersonalOverviewTab.tsx      - Portfolio summary, daily stats
├── PersonalAccountsTab.tsx      - Multi-account management
├── IncomeTrackerTab.tsx         - Withdrawal/income tracking
├── CompoundingTab.tsx           - Growth projections
├── CapitalPreservationTab.tsx   - Risk management for real capital
├── PersonalPerformanceTab.tsx   - Adapted performance metrics
├── TaxReportsTab.tsx            - P&L reports for taxes
```

### Sidebar Navigation (Personal Capital Mode)

```javascript
const personalCapitalTabs = [
  { id: 'pc-overview', label: 'Portfolio Overview', icon: LayoutDashboard },
  { id: 'pc-accounts', label: 'My Accounts', icon: Wallet },
  { id: 'signals', label: 'Signals Feed', icon: Activity },  // Shared
  { id: 'pc-performance', label: 'Performance', icon: BarChart3 },
  { id: 'pc-income', label: 'Income Tracker', icon: TrendingUp },
  { id: 'pc-compounding', label: 'Compounding', icon: Calculator },
  { id: 'pc-preservation', label: 'Capital Protection', icon: Shield },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },  // Shared
  { id: 'pc-tax', label: 'Tax Reports', icon: FileText },
  { id: 'ai-coach', label: 'Nexus AI', icon: Bot },  // Shared
  { id: 'notifications', label: 'Notifications', icon: Bell },  // Shared
  { id: 'support', label: 'Support', icon: HelpCircle },  // Shared
  { id: 'settings', label: 'Settings', icon: Settings },  // Shared
];
```

---

## Phase 4: Feature Components

### 4.1 Personal Overview Tab
**File**: `src/pages/dashboard/tabs/personal/PersonalOverviewTab.tsx`

Features:
- Total portfolio value across all accounts
- Today's P&L ($ and %)
- Monthly P&L summary
- Account distribution pie chart
- Quick actions: Add deposit, Record withdrawal
- Recent activity feed
- Capital preservation alerts

### 4.2 My Accounts Tab
**File**: `src/pages/dashboard/tabs/personal/PersonalAccountsTab.tsx`

Features:
- List of personal trading accounts
- Add new account modal
- Account cards showing:
  - Broker name and logo
  - Current balance
  - Total return %
  - Unrealized P&L
  - Last updated timestamp
- Edit account settings
- Mark account as primary
- Archive/close account

### 4.3 Income Tracker Tab
**File**: `src/pages/dashboard/tabs/personal/IncomeTrackerTab.tsx`

Features:
- Monthly income goal progress bar
- Withdrawal history table
- Add withdrawal modal
- Income consistency chart
- "Available to Withdraw" calculation:
  - Current profit - Safety buffer
- Monthly/Yearly withdrawal totals
- Deposit history

### 4.4 Compounding Calculator Tab
**File**: `src/pages/dashboard/tabs/personal/CompoundingTab.tsx`

Features:
- Interactive compounding projections
- Sliders for:
  - Monthly return % (1-10%)
  - Time horizon (months/years)
  - Withdrawal rate
- Visual equity curve projection
- "Time to reach goal" calculator
- Comparison: Compound vs Withdraw profits
- Milestone markers ($25K, $50K, $100K, etc.)

### 4.5 Capital Preservation Tab
**File**: `src/pages/dashboard/tabs/personal/CapitalPreservationTab.tsx`

Features:
- Maximum drawdown alert threshold (user-configurable)
- "Capital Floor" setting - never trade below this
- Recovery mode detection (reduced position sizing after losses)
- Losing streak counter and warnings
- Daily loss limit for personal accounts
- Cool-off period configuration
- Risk level indicator (conservative/moderate/aggressive)

### 4.6 Tax Reports Tab
**File**: `src/pages/dashboard/tabs/personal/TaxReportsTab.tsx`

Features:
- Generate P&L report for date range
- Trade-by-trade breakdown
- Export as PDF/CSV
- Summary: Total realized gains/losses
- Tax estimation widget (configurable rate)
- Year-to-date summary
- Cost basis tracking

---

## Phase 5: Shared Component Adaptations

### Signals Feed Adaptation
Update `SignalsFeedTab.tsx` to:
- Show different position sizing based on mode
- For personal capital: Calculate based on account balance, not challenge rules
- Remove prop-firm-specific warnings (consistency rule, etc.)

### Risk Calculator Adaptation
Update `RiskCalculatorWidget.tsx` to:
- Detect dashboard mode
- For personal capital: No prop firm rules overlay
- Show compounding impact of risk level

### Trade Journal Adaptation
Update `JournalTab.tsx` to:
- Tag trades by account (prop vs personal)
- Filter by account type
- Different metrics display per mode

---

## Phase 6: UI/UX Implementation

### Dashboard Header Changes
When in Personal Capital mode, the header will show:
- Total Portfolio Value (instead of single account balance)
- Today's P&L across all personal accounts
- Monthly withdrawal progress
- Capital preservation status indicator

### Sidebar Visual Differentiation
- Different accent color for Personal Capital mode (e.g., blue/teal vs green)
- Mode indicator badge in sidebar header
- Smooth transition animation when switching modes

### Settings Tab Extension
Add new settings section for Personal Capital:
- Default risk per trade
- Daily loss limit preference
- Income goal settings
- Tax rate for estimations
- Preferred currency

---

## Phase 7: Real-Time Features

### Real-Time Balance Updates
- Subscription to `user_personal_accounts` changes
- Live P&L calculation based on trade journal entries
- WebSocket updates for connected broker accounts (future)

### Alert System
- Push notifications for:
  - Reaching daily loss limit
  - Approaching capital floor
  - Losing streak detected
  - Monthly income goal achieved

---

## Technical Implementation Details

### Files to Create

```
Database:
- Migration for new tables (user_personal_accounts, user_withdrawals, user_deposits, personal_capital_daily_stats)
- Migration for questionnaires.trading_mode column
- Migration for profiles.preferred_dashboard_mode column

Components:
- src/components/dashboard/DashboardModeToggle.tsx
- src/pages/dashboard/tabs/personal/PersonalOverviewTab.tsx
- src/pages/dashboard/tabs/personal/PersonalAccountsTab.tsx
- src/pages/dashboard/tabs/personal/IncomeTrackerTab.tsx
- src/pages/dashboard/tabs/personal/CompoundingTab.tsx
- src/pages/dashboard/tabs/personal/CapitalPreservationTab.tsx
- src/pages/dashboard/tabs/personal/TaxReportsTab.tsx
- src/components/dashboard/AddPersonalAccountModal.tsx
- src/components/dashboard/RecordWithdrawalModal.tsx
- src/components/dashboard/RecordDepositModal.tsx
- src/components/dashboard/CompoundingCalculatorWidget.tsx
- src/components/dashboard/IncomeGoalWidget.tsx
- src/components/dashboard/CapitalFloorWidget.tsx

Hooks:
- src/hooks/usePersonalAccounts.ts
- src/hooks/useWithdrawals.ts
- src/hooks/useDashboardMode.ts

Context:
- src/lib/context/DashboardModeContext.tsx
```

### Files to Modify

```
- src/pages/dashboard/UserDashboard.tsx - Add mode toggle, conditional navigation
- src/pages/questionnaire/QuestionnairePage.tsx - Add trading mode selection step
- src/components/dashboard/RiskCalculatorWidget.tsx - Mode-aware calculations
- src/pages/dashboard/tabs/SignalsFeedTab.tsx - Mode-aware position sizing
- src/pages/dashboard/tabs/JournalTab.tsx - Account type filtering
- src/lib/hooks/usePlanFeatures.ts - Add personal capital feature flags
- src/pages/dashboard/tabs/SettingsTab.tsx - Personal capital settings section
```

---

## Questionnaire Flow Update

Add a new step (Step 0) to the questionnaire:

```
"What type of trading account will you primarily use?"

[ ] Prop Firm Challenge - I'm trading to pass funded account challenges
[ ] Personal Capital - I'm trading with my own money
[ ] Both - I use both prop firm and personal accounts
```

Based on selection:
- Prop Firm: Existing flow unchanged
- Personal Capital: Skip prop firm selection, show broker selection instead
- Both: Complete both flows, enable mode toggle

---

## Expected Outcome

Users will have two fully-functional dashboard experiences:

| Feature | Prop Firm Mode | Personal Capital Mode |
|---------|---------------|----------------------|
| Overview | Challenge progress | Portfolio value |
| Accounts | Prop firm accounts | Personal broker accounts |
| Risk Rules | Firm-defined limits | Self-defined limits |
| Signals | Challenge-aware sizing | Account-based sizing |
| Goals | Pass challenge | Income/growth targets |
| Reports | Compliance reports | Tax reports |
| Tracking | Drawdown compliance | Capital preservation |

---

## Implementation Priority

**Phase 1 (Week 1)**: 
- Database migrations
- Dashboard mode toggle
- Basic Personal Overview Tab
- My Accounts Tab with CRUD

**Phase 2 (Week 2)**: 
- Income Tracker Tab
- Compounding Calculator Tab
- Questionnaire update for mode selection

**Phase 3 (Week 3)**: 
- Capital Preservation Tab
- Adapted shared components (signals, journal)
- Settings extensions

**Phase 4 (Week 4)**: 
- Tax Reports Tab
- Real-time alerts
- Polish and testing

---

## Other Page Changes

### Homepage (`AntimatterLanding.tsx`)
- Update hero section to mention both use cases
- Add "Personal Capital Trading" section to features
- Update FAQ with personal capital questions

### Pricing Page (`PricingSection.tsx`)
- Highlight that all plans support both modes
- Add personal capital feature bullet points

### Features Page (`FeaturesPage.tsx`)
- Add "Personal Capital Tools" feature section
- Compounding calculator preview
- Income tracking preview

### SEO Landing Page (New)
- Create `/personal-capital-trading` landing page
- Target keywords: "AI trading for personal accounts", "grow trading capital"
- Differentiate from prop firm messaging
