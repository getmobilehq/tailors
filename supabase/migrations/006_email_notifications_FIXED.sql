-- Email Notifications via Status Changes (Supabase Compatible Version)
-- Run this in Supabase SQL Editor

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the notify_on_status_change function to send emails
-- Note: Database settings (app.settings.*) are not available in Supabase hosted instances
-- The function will use hardcoded values or skip email sending if not configured
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
  v_customer_id UUID;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_runner_id UUID;
  v_tailor_id UUID;
  v_app_url TEXT;
  v_api_secret TEXT;
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

  -- Set app URL and API secret
  -- IMPORTANT: Update these values for your production environment
  -- You can set these as Supabase secrets or modify this function after deployment
  v_app_url := 'https://tailorspace.uk';
  v_api_secret := NULL; -- Set this to your EMAIL_API_SECRET from environment variables

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

      -- Send email (only if API secret is configured)
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Email notifications function updated!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: To enable email sending from database triggers:';
  RAISE NOTICE '1. Open this function in Supabase SQL Editor';
  RAISE NOTICE '2. Update the v_api_secret variable with your EMAIL_API_SECRET';
  RAISE NOTICE '3. The v_app_url is already set to: https://tailorspace.uk';
  RAISE NOTICE '';
  RAISE NOTICE '📧 In-app notifications will work immediately.';
  RAISE NOTICE '📧 Email notifications will be skipped until v_api_secret is configured.';
END $$;
