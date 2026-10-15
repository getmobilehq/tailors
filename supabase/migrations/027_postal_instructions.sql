-- Separate instructions for postal customers.
--
-- The drop-off note ("phone before coming") is aimed at someone standing at
-- the door and makes no sense to a customer posting a parcel, so each route
-- now carries its own wording. Seeded blank: nothing is shown until an admin
-- writes something in Admin -> Settings.

UPDATE public.site_settings
SET value = value || '{"postalInstructions": ""}'::jsonb
WHERE key = 'dropoff_location'
  AND NOT (value ? 'postalInstructions');
