-- Add bot configuration for automated signal broadcasting
alter table public.bot_status add column if not exists auto_broadcast boolean default false;
alter table public.bot_status add column if not exists strategy_config jsonb default '{}';
alter table public.bot_status add column if not exists timeframes text[] default array['M15', 'H1', 'H4', 'D1'];
alter table public.bot_status add column if not exists pairs text[];

-- Add signal generation details columns
alter table public.signals add column if not exists trade_type text; -- scalp, intraday, swing
alter table public.signals add column if not exists timeframe text;
alter table public.signals add column if not exists risk_reward_ratio numeric(5,2);
alter table public.signals add column if not exists lot_size_suggestion numeric(10,4);
alter table public.signals add column if not exists operator_analysis jsonb; -- supply/demand, liquidity, traps info
alter table public.signals add column if not exists generated_by text default 'manual'; -- 'manual' or 'bot'
alter table public.signals add column if not exists sent_to_users boolean default false;
alter table public.signals add column if not exists matched_user_ids uuid[];

-- Add trading style to questionnaires for matching
alter table public.questionnaires add column if not exists trading_style text; -- scalp, intraday, swing
alter table public.questionnaires add column if not exists preferred_pairs text[];
alter table public.questionnaires add column if not exists preferred_timeframes text[];

-- Update bot_status with default pairs if empty
update public.bot_status 
set pairs = array['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'GBPJPY', 'EURJPY']
where bot_type = 'forex' and (pairs is null or pairs = '{}');

update public.bot_status 
set pairs = array['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD']
where bot_type = 'crypto' and (pairs is null or pairs = '{}');

update public.bot_status 
set pairs = array['NQ', 'ES', 'YM', 'GC', 'CL']
where bot_type = 'futures' and (pairs is null or pairs = '{}');