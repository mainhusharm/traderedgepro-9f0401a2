-- Add experts_count column to signals table for VIP signals
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS experts_count INTEGER DEFAULT NULL;