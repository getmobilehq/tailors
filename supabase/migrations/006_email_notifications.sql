-- Email Notifications via Status Changes
-- Run this in Supabase SQL Editor

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the notify_on_status_change function to also send emails
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
  v_customer_id UUID;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_runner_id UUID;
  v_tailor_id UUID;
  v_app_url TEXT := current_setting('app.settings.app_url', true);
  v_api_secret TEXT := current_setting('app.settings.api_secret', true);
BEGIN
  -- Get order and customer details
  SELECT
    o.order_number,
    o.customer_id,
    o.runner_id,
    o.tailor_id,
    u.email,
    u.full_name
  INTO
    v_order_number,
    v_customer_id,
    v_runner_id,
    v_tailor_id,
    v_customer_email,
    v_customer_name
  FROM orders o
  JOIN users u ON u.id = o.customer_id
  WHERE o.id = NEW.id;

  -- Set defaults if not configured
  IF v_app_url IS NULL THEN
    v_app_url := 'http://localhost:3000';
  END IF;

  -- Add timeline entry
  PERFORM add_timeline_entry(
    NEW.id,
    NEW.status,
    auth.uid(),
    (SELECT role FROM users WHERE id = auth.uid()),
    'Status changed to ' || NEW.status
  );

  -- Notify and send emails based on new status
  CASE NEW.status
    WHEN 'pickup_scheduled' THEN
      -- Notify customer
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Runner Assigned',
        'A runner has been assigned to collect your order ' || v_order_number,
        '/orders/' || NEW.id
      );

      -- Send email (only if we have config)
      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'pickup_scheduled'
            )
          )
        );
      END IF;

    WHEN 'collected' THEN
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Items Collected',
        'Your items for order ' || v_order_number || ' have been collected',
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'collected'
            )
          )
        );
      END IF;

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

      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Work Started',
        'Your tailor has started working on order ' || v_order_number,
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'in_progress'
            )
          )
        );
      END IF;

    WHEN 'ready' THEN
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

      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Order Ready',
        'Your order ' || v_order_number || ' is ready for delivery',
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'ready'
            )
          )
        );
      END IF;

    WHEN 'out_for_delivery' THEN
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Out for Delivery',
        'Your order ' || v_order_number || ' is on its way',
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'out_for_delivery'
            )
          )
        );
      END IF;

    WHEN 'delivered' THEN
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Order Delivered',
        'Your order ' || v_order_number || ' has been delivered',
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'delivered'
            )
          )
        );
      END IF;

    WHEN 'completed' THEN
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_complete',
        'Order Complete',
        'Thank you! Order ' || v_order_number || ' is complete',
        '/orders/' || NEW.id
      );

      IF v_api_secret IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_app_url || '/api/emails/send',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_secret
          ),
          body := jsonb_build_object(
            'type', 'order_status_update',
            'data', jsonb_build_object(
              'to', v_customer_email,
              'customerName', v_customer_name,
              'orderNumber', v_order_number,
              'status', 'completed'
            )
          )
        );
      END IF;

  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the app URL and API secret (update these with your values)
-- For local development:
ALTER DATABASE postgres SET app.settings.app_url TO 'http://localhost:3000';
-- For production, update to your actual domain:
-- ALTER DATABASE postgres SET app.settings.app_url TO 'https://yourdomain.com';

-- Set API secret (use your SUPABASE_SERVICE_ROLE_KEY or EMAIL_API_SECRET)
-- Replace 'your_api_secret_here' with your actual secret
-- ALTER DATABASE postgres SET app.settings.api_secret TO 'your_api_secret_here';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Email notifications enabled!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You need to set the API secret for emails to send:';
  RAISE NOTICE 'Run this command with your actual API secret:';
  RAISE NOTICE 'ALTER DATABASE postgres SET app.settings.api_secret TO ''your_supabase_service_role_key'';';
  RAISE NOTICE '';
  RAISE NOTICE 'For production, also update the app URL:';
  RAISE NOTICE 'ALTER DATABASE postgres SET app.settings.app_url TO ''https://yourdomain.com'';';
END $$;
