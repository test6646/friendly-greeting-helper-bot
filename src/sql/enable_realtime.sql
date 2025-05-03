
-- Enable realtime functionality for notifications, orders, and deliveries
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
