-- Fix timezone handling in daily conversation counts function
CREATE OR REPLACE FUNCTION get_daily_conversation_counts(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  date DATE,
  conversation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') as date,
    COUNT(*) as conversation_count
  FROM conversation_history ch
  WHERE ch.started_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    AND ch.started_at <= (CURRENT_DATE + INTERVAL '1 day')
  GROUP BY DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')
  ORDER BY DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York');
END;
$$ LANGUAGE plpgsql;