-- Remove default 'United States' from profiles.country column
ALTER TABLE public.profiles ALTER COLUMN country DROP DEFAULT;

-- Update existing profiles with 'United States' to NULL so they can be updated
-- (only if they haven't been explicitly set)
-- Actually, let's keep existing data but just remove the default for new users

-- Update the handle_new_user function to accept country from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', NULL)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;