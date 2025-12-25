-- Order Journey Tracking: Notifications and Timeline
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'order_update', 'action_required', 'order_complete'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- URL to navigate to when clicked
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_timeline table to track status changes
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who made the change
  actor_role TEXT, -- Role of the person who made the change
  notes TEXT, -- Optional notes about the change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for order_timeline
CREATE POLICY "Users can view timeline for their orders"
  ON order_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_timeline.order_id
      AND (
        orders.customer_id = auth.uid()
        OR orders.runner_id = auth.uid()
        OR orders.tailor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
      )
    )
  );

CREATE POLICY "System can create timeline entries"
  ON order_timeline FOR INSERT
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_order_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, order_id, type, title, message, action_url)
  VALUES (p_user_id, p_order_id, p_type, p_title, p_message, p_action_url)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add timeline entry
CREATE OR REPLACE FUNCTION add_timeline_entry(
  p_order_id UUID,
  p_status TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_timeline_id UUID;
BEGIN
  INSERT INTO order_timeline (order_id, status, actor_id, actor_role, notes)
  VALUES (p_order_id, p_status, p_actor_id, p_actor_role, p_notes)
  RETURNING id INTO v_timeline_id;

  RETURN v_timeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on status change
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
  v_customer_id UUID;
  v_runner_id UUID;
  v_tailor_id UUID;
BEGIN
  -- Get order details
  SELECT order_number, customer_id, runner_id, tailor_id
  INTO v_order_number, v_customer_id, v_runner_id, v_tailor_id
  FROM orders WHERE id = NEW.id;

  -- Add timeline entry
  PERFORM add_timeline_entry(
    NEW.id,
    NEW.status,
    auth.uid(),
    (SELECT role FROM users WHERE id = auth.uid()),
    'Status changed to ' || NEW.status
  );

  -- Notify based on new status
  CASE NEW.status
    WHEN 'pickup_scheduled' THEN
      -- Notify customer that runner accepted
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Runner Assigned',
        'A runner has been assigned to collect your order ' || v_order_number,
        '/orders/' || NEW.id
      );

    WHEN 'collected' THEN
      -- Notify customer that items were collected
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Items Collected',
        'Your items for order ' || v_order_number || ' have been collected',
        '/orders/' || NEW.id
      );

    WHEN 'in_progress' THEN
      -- Notify tailor if just assigned
      IF v_tailor_id IS NOT NULL AND OLD.status = 'collected' THEN
        PERFORM create_notification(
          v_tailor_id,
          NEW.id,
          'action_required',
          'New Order Assigned',
          'You have been assigned order ' || v_order_number,
          '/tailor/orders/' || NEW.id
        );
      END IF;

      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Work Started',
        'Your tailor has started working on order ' || v_order_number,
        '/orders/' || NEW.id
      );

    WHEN 'ready' THEN
      -- Notify runner to deliver
      IF v_runner_id IS NOT NULL THEN
        PERFORM create_notification(
          v_runner_id,
          NEW.id,
          'action_required',
          'Ready for Delivery',
          'Order ' || v_order_number || ' is ready for delivery',
          '/runner/orders/' || NEW.id
        );
      END IF;

      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Order Ready',
        'Your order ' || v_order_number || ' is ready for delivery',
        '/orders/' || NEW.id
      );

    WHEN 'out_for_delivery' THEN
      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Out for Delivery',
        'Your order ' || v_order_number || ' is on its way',
        '/orders/' || NEW.id
      );

    WHEN 'delivered' THEN
      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Order Delivered',
        'Your order ' || v_order_number || ' has been delivered',
        '/orders/' || NEW.id
      );

    WHEN 'completed' THEN
      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_complete',
        'Order Complete',
        'Thank you! Order ' || v_order_number || ' is complete',
        '/orders/' || NEW.id
      );

  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_on_status_change ON orders;
CREATE TRIGGER trigger_notify_on_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_status_change();

-- Add initial timeline entries for existing orders
INSERT INTO order_timeline (order_id, status, notes, created_at)
SELECT id, status, 'Initial status', created_at
FROM orders
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications and Timeline system created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '- notifications (for in-app alerts)';
  RAISE NOTICE '- order_timeline (for status tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Automatic notifications will be sent when:';
  RAISE NOTICE '- Runner accepts job';
  RAISE NOTICE '- Items are collected';
  RAISE NOTICE '- Tailor is assigned';
  RAISE NOTICE '- Work is in progress';
  RAISE NOTICE '- Order is ready for delivery';
  RAISE NOTICE '- Items are out for delivery';
  RAISE NOTICE '- Items are delivered';
  RAISE NOTICE '- Order is completed';
END $$;
