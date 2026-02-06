-- Drop the old bot_type constraint
ALTER TABLE public.bot_status DROP CONSTRAINT bot_status_bot_type_check;

-- Add new constraint that includes institutional_signal_bot
ALTER TABLE public.bot_status ADD CONSTRAINT bot_status_bot_type_check 
CHECK (bot_type = ANY (ARRAY['forex'::text, 'crypto'::text, 'futures'::text, 'institutional_signal_bot'::text]));

-- Now insert the institutional bot entry
INSERT INTO public.bot_status (bot_type, is_running, auto_broadcast, pairs, timeframes, strategy_config)
VALUES (
  'institutional_signal_bot',
  false,
  false,
  ARRAY['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'GBPJPY', 'EURJPY', 'XAUUSD'],
  ARRAY['1d', '4h', '1h', '15m'],
  '{
    "analysisMode": "hybrid",
    "minConfluenceScore": 6,
    "killZoneOnly": true,
    "killZones": ["london_open", "ny_open"],
    "priceActionEnabled": true,
    "smcEnabled": true
  }'::jsonb
);