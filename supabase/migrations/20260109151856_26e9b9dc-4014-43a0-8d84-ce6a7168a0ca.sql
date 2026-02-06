-- Create user activity notifications table
CREATE TABLE public.user_activity_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL, -- 'signup', 'purchase', 'mt5_signup', 'mt5_purchase'
  portal TEXT NOT NULL, -- 'main', 'mt5'
  user_id UUID,
  user_email TEXT NOT NULL,
  user_name TEXT,
  plan_name TEXT,
  amount NUMERIC,
  coupon_code TEXT,
  is_trial BOOLEAN DEFAULT false,
  details JSONB DEFAULT '{}'::jsonb,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_activity_notifications_created_at ON public.user_activity_notifications(created_at DESC);
CREATE INDEX idx_user_activity_notifications_portal ON public.user_activity_notifications(portal);
CREATE INDEX idx_user_activity_notifications_activity_type ON public.user_activity_notifications(activity_type);

-- Enable RLS
ALTER TABLE public.user_activity_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can view all notifications
CREATE POLICY "Admins can view all activity notifications"
ON public.user_activity_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert notifications
CREATE POLICY "Service role can insert activity notifications"
ON public.user_activity_notifications
FOR INSERT
WITH CHECK (true);

-- Service role can update notifications
CREATE POLICY "Service role can update activity notifications"
ON public.user_activity_notifications
FOR UPDATE
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_notifications;

-- Function to notify on new profile (main website signup)
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  
  INSERT INTO public.user_activity_notifications (
    activity_type,
    portal,
    user_id,
    user_email,
    user_name,
    details
  ) VALUES (
    'signup',
    COALESCE(NEW.portal_type, 'main'),
    NEW.user_id,
    COALESCE(v_email, 'unknown'),
    COALESCE(NEW.first_name || ' ' || COALESCE(NEW.last_name, ''), 'Unknown'),
    jsonb_build_object(
      'country', NEW.country,
      'referred_by', NEW.referred_by
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new profile creation
CREATE TRIGGER on_new_profile_notify
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_user_signup();

-- Function to notify on main website payment
CREATE OR REPLACE FUNCTION public.notify_new_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
BEGIN
  -- Only notify on completed payments
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Get user info
    SELECT u.email, COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), 'Unknown')
    INTO v_email, v_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = NEW.user_id;
    
    INSERT INTO public.user_activity_notifications (
      activity_type,
      portal,
      user_id,
      user_email,
      user_name,
      plan_name,
      amount,
      coupon_code,
      details
    ) VALUES (
      'purchase',
      'main',
      NEW.user_id,
      COALESCE(v_email, 'unknown'),
      COALESCE(v_name, 'Unknown'),
      NEW.plan_name,
      NEW.final_price,
      NEW.coupon_code,
      jsonb_build_object(
        'original_price', NEW.original_price,
        'discount_amount', NEW.discount_amount,
        'payment_method', NEW.payment_method,
        'affiliate_code', NEW.affiliate_code
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for payments
CREATE TRIGGER on_payment_completed_notify
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_payment();

-- Function to notify on membership with trial coupon
CREATE OR REPLACE FUNCTION public.notify_trial_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
BEGIN
  -- Only notify on trial memberships
  IF NEW.is_trial = true AND NEW.trial_coupon_code IS NOT NULL THEN
    -- Get user info
    SELECT u.email, COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), 'Unknown')
    INTO v_email, v_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = NEW.user_id;
    
    INSERT INTO public.user_activity_notifications (
      activity_type,
      portal,
      user_id,
      user_email,
      user_name,
      plan_name,
      coupon_code,
      is_trial,
      details
    ) VALUES (
      'trial_activation',
      'main',
      NEW.user_id,
      COALESCE(v_email, 'unknown'),
      COALESCE(v_name, 'Unknown'),
      NEW.plan_name,
      NEW.trial_coupon_code,
      true,
      jsonb_build_object(
        'expires_at', NEW.expires_at,
        'billing_period', NEW.billing_period
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for trial memberships
CREATE TRIGGER on_trial_membership_notify
AFTER INSERT ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.notify_trial_membership();

-- Function to notify on MT5 user signup
CREATE OR REPLACE FUNCTION public.notify_mt5_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_notifications (
    activity_type,
    portal,
    user_id,
    user_email,
    user_name,
    plan_name,
    coupon_code,
    is_trial,
    details
  ) VALUES (
    CASE WHEN NEW.is_trial = true THEN 'mt5_trial' ELSE 'mt5_signup' END,
    'mt5',
    NEW.user_id,
    COALESCE(NEW.email, 'unknown'),
    'MT5 User',
    NEW.plan_type,
    NEW.trial_coupon_code,
    COALESCE(NEW.is_trial, false),
    jsonb_build_object(
      'trial_expires_at', NEW.trial_expires_at,
      'license_key', NEW.license_key
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for MT5 user signup
CREATE TRIGGER on_mt5_user_signup_notify
AFTER INSERT ON public.mt5_users
FOR EACH ROW
EXECUTE FUNCTION public.notify_mt5_signup();

-- Function to notify on MT5 payment
CREATE OR REPLACE FUNCTION public.notify_mt5_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only notify on verified payments
  IF NEW.status = 'verified' AND (OLD IS NULL OR OLD.status != 'verified') THEN
    -- Get user email
    SELECT email INTO v_email FROM public.mt5_users WHERE user_id = NEW.user_id;
    
    INSERT INTO public.user_activity_notifications (
      activity_type,
      portal,
      user_id,
      user_email,
      user_name,
      plan_name,
      amount,
      details
    ) VALUES (
      'mt5_purchase',
      'mt5',
      NEW.user_id,
      COALESCE(v_email, 'unknown'),
      'MT5 User',
      NEW.plan_type,
      NEW.amount,
      jsonb_build_object(
        'payment_method', NEW.payment_method,
        'transaction_id', NEW.transaction_id,
        'order_id', NEW.order_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for MT5 payments
CREATE TRIGGER on_mt5_payment_verified_notify
AFTER INSERT OR UPDATE ON public.mt5_payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_mt5_payment();