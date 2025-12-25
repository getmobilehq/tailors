-- Update Messages Table for Group Chat
-- Run this in Supabase SQL Editor

-- Drop existing messages table and recreate with better schema
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create improved messages table for group messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}', -- Array of file URLs
  read_by UUID[] DEFAULT '{}', -- Array of user IDs who have read the message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages for orders they're involved in
CREATE POLICY "Users can view messages for their orders"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.messages.order_id
      AND (
        public.orders.customer_id = auth.uid()
        OR public.orders.runner_id = auth.uid()
        OR public.orders.tailor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
      )
    )
  );

-- RLS Policy: Users can send messages for orders they're involved in
CREATE POLICY "Users can send messages for their orders"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = order_id
      AND (
        public.orders.customer_id = auth.uid()
        OR public.orders.runner_id = auth.uid()
        OR public.orders.tailor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
      )
    )
  );

-- RLS Policy: Users can update messages (for read receipts)
CREATE POLICY "Users can update read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.messages.order_id
      AND (
        public.orders.customer_id = auth.uid()
        OR public.orders.runner_id = auth.uid()
        OR public.orders.tailor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
      )
    )
  );

-- Function to mark message as read by user
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE id = p_message_id
  AND NOT (p_user_id = ANY(read_by)); -- Only add if not already in array
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for user on an order
CREATE OR REPLACE FUNCTION get_unread_message_count(p_order_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages
  WHERE order_id = p_order_id
  AND sender_id != p_user_id
  AND NOT (p_user_id = ANY(read_by));

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when message is sent
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
  v_customer_id UUID;
  v_runner_id UUID;
  v_tailor_id UUID;
  v_sender_name TEXT;
  v_recipient_id UUID;
BEGIN
  -- Get order details
  SELECT order_number, customer_id, runner_id, tailor_id
  INTO v_order_number, v_customer_id, v_runner_id, v_tailor_id
  FROM public.orders WHERE id = NEW.order_id;

  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM public.users WHERE id = NEW.sender_id;

  -- Notify all participants except the sender
  -- Notify customer if not sender
  IF v_customer_id IS NOT NULL AND v_customer_id != NEW.sender_id THEN
    PERFORM create_notification(
      v_customer_id,
      NEW.order_id,
      'order_update',
      'New Message',
      v_sender_name || ' sent a message about order ' || v_order_number,
      '/orders/' || NEW.order_id
    );
  END IF;

  -- Notify runner if not sender
  IF v_runner_id IS NOT NULL AND v_runner_id != NEW.sender_id THEN
    PERFORM create_notification(
      v_runner_id,
      NEW.order_id,
      'order_update',
      'New Message',
      v_sender_name || ' sent a message about order ' || v_order_number,
      '/runner/orders/' || NEW.order_id
    );
  END IF;

  -- Notify tailor if not sender
  IF v_tailor_id IS NOT NULL AND v_tailor_id != NEW.sender_id THEN
    PERFORM create_notification(
      v_tailor_id,
      NEW.order_id,
      'order_update',
      'New Message',
      v_sender_name || ' sent a message about order ' || v_order_number,
      '/tailor/orders/' || NEW.order_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_on_new_message ON public.messages;
CREATE TRIGGER trigger_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Messages system updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '- Removed recipient_id (now group messaging)';
  RAISE NOTICE '- Added attachments support';
  RAISE NOTICE '- Added read_by array for read receipts';
  RAISE NOTICE '- Created notification trigger for new messages';
  RAISE NOTICE '- Added helper functions for read status';
  RAISE NOTICE '';
  RAISE NOTICE 'All users on an order can now see all messages!';
END $$;
