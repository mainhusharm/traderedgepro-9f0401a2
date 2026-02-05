-- Create function to notify Discord when signal is sent to users
CREATE OR REPLACE FUNCTION notify_user_signal_discord()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Only trigger when send_to_users changes from false/null to true
  IF (NEW.send_to_users = true AND (OLD.send_to_users IS NULL OR OLD.send_to_users = false)) THEN
    -- Build the payload
    payload := jsonb_build_object(
      'id', NEW.id,
      'symbol', NEW.symbol,
      'direction', NEW.direction,
      'entry_price', NEW.entry_price,
      'stop_loss', NEW.stop_loss,
      'take_profit_1', NEW.take_profit_1,
      'take_profit_2', NEW.take_profit_2,
      'take_profit_3', NEW.take_profit_3,
      'confidence', NEW.confidence,
      'reasoning', NEW.reasoning,
      'timeframe', NEW.timeframe,
      'kill_zone', NEW.kill_zone,
      'confluence_score', NEW.confluence_score,
      'analysis_mode', NEW.analysis_mode
    );
    
    -- Call the edge function via pg_net (async HTTP request)
    PERFORM net.http_post(
      url := 'https://sjkmfmnczxumnfwxkyrc.supabase.co/functions/v1/send-user-signal-discord',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on institutional_signals table
DROP TRIGGER IF EXISTS trigger_user_signal_discord ON institutional_signals;
CREATE TRIGGER trigger_user_signal_discord
  AFTER UPDATE ON institutional_signals
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_signal_discord();

-- Also trigger on INSERT if send_to_users is already true
CREATE OR REPLACE FUNCTION notify_user_signal_discord_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Only trigger when send_to_users is true on insert
  IF NEW.send_to_users = true THEN
    -- Build the payload
    payload := jsonb_build_object(
      'id', NEW.id,
      'symbol', NEW.symbol,
      'direction', NEW.direction,
      'entry_price', NEW.entry_price,
      'stop_loss', NEW.stop_loss,
      'take_profit_1', NEW.take_profit_1,
      'take_profit_2', NEW.take_profit_2,
      'take_profit_3', NEW.take_profit_3,
      'confidence', NEW.confidence,
      'reasoning', NEW.reasoning,
      'timeframe', NEW.timeframe,
      'kill_zone', NEW.kill_zone,
      'confluence_score', NEW.confluence_score,
      'analysis_mode', NEW.analysis_mode
    );
    
    -- Call the edge function via pg_net (async HTTP request)
    PERFORM net.http_post(
      url := 'https://sjkmfmnczxumnfwxkyrc.supabase.co/functions/v1/send-user-signal-discord',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_signal_discord_insert ON institutional_signals;
CREATE TRIGGER trigger_user_signal_discord_insert
  AFTER INSERT ON institutional_signals
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_signal_discord_insert();