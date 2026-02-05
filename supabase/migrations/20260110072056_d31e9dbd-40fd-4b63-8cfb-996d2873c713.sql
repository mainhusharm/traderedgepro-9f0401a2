-- Add columns for custom trading assets
ALTER TABLE public.questionnaires 
ADD COLUMN IF NOT EXISTS custom_crypto_assets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS futures_assets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_futures_assets TEXT[] DEFAULT '{}';