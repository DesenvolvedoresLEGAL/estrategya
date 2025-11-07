-- Enable realtime for ai_insights table to support notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;