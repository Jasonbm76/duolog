-- Seed file for initial development data
-- This file is run when using `supabase db reset --local`

-- Note: This seed data is for local development only
-- Production data should never be seeded this way

-- Insert some sample analytics data for dashboard testing
INSERT INTO public.usage_analytics (
  date_tracked,
  hour_tracked,
  conversations_started,
  conversations_completed,
  total_rounds_processed,
  total_credits_consumed,
  total_tokens_processed,
  chatgpt_requests,
  claude_requests,
  avg_response_time_ms,
  avg_user_rating,
  collaboration_mode_usage
) VALUES 
-- Today's data
(CURRENT_DATE, 9, 5, 3, 15, 45, 12500, 8, 7, 1250.5, 4.2, '{"debate": 3, "consensus": 2}'),
(CURRENT_DATE, 10, 8, 6, 24, 72, 18000, 12, 12, 1180.3, 4.5, '{"debate": 4, "consensus": 2, "creative": 2}'),
(CURRENT_DATE, 11, 12, 9, 36, 108, 25000, 18, 18, 1320.7, 4.3, '{"debate": 6, "consensus": 3, "creative": 3}'),

-- Yesterday's data
(CURRENT_DATE - INTERVAL '1 day', 9, 7, 5, 20, 60, 15000, 10, 10, 1200.0, 4.1, '{"debate": 4, "consensus": 3}'),
(CURRENT_DATE - INTERVAL '1 day', 10, 10, 8, 32, 96, 22000, 16, 16, 1150.5, 4.4, '{"debate": 5, "consensus": 3, "creative": 2}'),
(CURRENT_DATE - INTERVAL '1 day', 11, 15, 12, 45, 135, 30000, 23, 22, 1280.3, 4.6, '{"debate": 8, "consensus": 4, "creative": 3}'),

-- Week ago data
(CURRENT_DATE - INTERVAL '7 days', 9, 3, 2, 8, 24, 8000, 4, 4, 1400.2, 3.9, '{"debate": 2, "consensus": 1}'),
(CURRENT_DATE - INTERVAL '7 days', 10, 6, 4, 16, 48, 12000, 8, 8, 1350.8, 4.0, '{"debate": 3, "consensus": 2, "creative": 1}'),
(CURRENT_DATE - INTERVAL '7 days', 11, 9, 7, 28, 84, 18000, 14, 14, 1290.5, 4.2, '{"debate": 5, "consensus": 2, "creative": 2}');

-- Note: User-specific data will be created when users sign up via the trigger
-- Conversation and round data will be created during actual app usage