-- Enable realtime for payments table to support auto-activation
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;