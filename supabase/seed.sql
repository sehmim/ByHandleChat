-- Handle Revenue OS - Seed Data
-- Migrates existing in-memory config to database
-- Run this after schema.sql to populate initial test data

-- ============================================
-- 1. Create Test User
-- ============================================
insert into public.users (id, email, name, avatar_url)
values (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'demo@handlesalon.com',
  'Handle Demo Owner',
  'https://kleknnxdnspllqliaong.supabase.co/storage/v1/object/public/handle/maya.png'
)
on conflict (email) do nothing;

-- ============================================
-- 2. Create Business with JSON Data
-- ============================================
insert into public.businesses (
  id,
  owner_id,
  name,
  website,
  address,
  timezone,
  hours_json,
  policies_json,
  faqs_json,
  about_json
)
values (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Handle Salon & Spa',
  'https://handlesalon.com',
  '123 Main Street, Downtown',
  'America/New_York',

  -- hours_json
  jsonb_build_array(
    jsonb_build_object('day', 'Monday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Tuesday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Wednesday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Thursday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Friday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Saturday', 'open', '09:00', 'close', '19:00', 'closed', false),
    jsonb_build_object('day', 'Sunday', 'open', '10:00', 'close', '17:00', 'closed', false)
  ),

  -- policies_json
  jsonb_build_object(
    'cancellation', '24-hour notice required for cancellations to avoid fees',
    'lateness', 'Please arrive 10 minutes early. Late arrivals may result in shortened service time',
    'payment', 'We accept all major credit cards, debit cards, and digital wallets'
  ),

  -- faqs_json
  jsonb_build_array(
    jsonb_build_object(
      'question', 'Do I need to arrive early for my appointment?',
      'answer', 'Yes, please arrive 10 minutes before your scheduled time to complete any necessary paperwork and prepare for your service.'
    ),
    jsonb_build_object(
      'question', 'What is your cancellation policy?',
      'answer', 'We require 24-hour notice for cancellations. Cancellations made with less than 24 hours notice may be subject to a cancellation fee.'
    ),
    jsonb_build_object(
      'question', 'What payment methods do you accept?',
      'answer', 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, and digital wallets like Apple Pay and Google Pay.'
    )
  ),

  -- about_json
  jsonb_build_object(
    'description', 'A premium beauty and wellness center offering hair styling, spa treatments, and beauty services',
    'businessType', 'salon/spa',
    'specialties', jsonb_build_array('Hair Styling', 'Spa Treatments', 'Nail Care', 'Facial Treatments')
  )
)
on conflict (id) do update set
  name = excluded.name,
  website = excluded.website,
  address = excluded.address,
  hours_json = excluded.hours_json,
  policies_json = excluded.policies_json,
  faqs_json = excluded.faqs_json,
  about_json = excluded.about_json;

-- ============================================
-- 3. Create Services
-- ============================================
insert into public.services (id, business_id, name, description, price_cents, duration_minutes, active)
values
  (
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'Hair Styling',
    'Expert styling session with premium products and personalized consultation.',
    12000, -- $120.00
    90,
    true
  ),
  (
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'Spa Treatment',
    'Full relaxation package including massage, facial, and hydrotherapy add-ons.',
    15000, -- $150.00
    135,
    true
  ),
  (
    'c3000000-0000-0000-0000-000000000003'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'Manicure & Pedicure',
    'Complete nail care with exfoliation, mask, and polish.',
    6000, -- $60.00
    75,
    true
  ),
  (
    'c4000000-0000-0000-0000-000000000004'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'Facial Treatment',
    'Custom facial ritual with cleansing, extraction, and LED therapy.',
    9000, -- $90.00
    90,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  duration_minutes = excluded.duration_minutes,
  active = excluded.active;

-- ============================================
-- 4. Create Chatbot with Widget Config
-- ============================================
insert into public.chatbot (id, business_id, public_id, config_json)
values (
  'd0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'handle_demo_salon',
  jsonb_build_object(
    'assistant', jsonb_build_object(
      'name', 'Maya',
      'role', 'AI booking assistant',
      'tagline', 'Smart, fast, helpful',
      'avatar', 'https://kleknnxdnspllqliaong.supabase.co/storage/v1/object/public/handle/maya.png'
    ),
    'uiConfig', jsonb_build_object(
      'primaryColor', '#0f172a',
      'title', 'Maya — your AI booking assistant',
      'welcomeMessage', 'Hi! I''m Maya, your AI assistant at Handle Salon & Spa. I can help you book appointments, answer questions about our services, and provide information about our policies.',
      'logoUrl', 'https://kleknnxdnspllqliaong.supabase.co/storage/v1/object/public/handle/maya.png',
      'launcherMessage', 'Looking for the right service? Ask Maya!'
    )
  )
)
on conflict (id) do update set
  public_id = excluded.public_id,
  config_json = excluded.config_json;

-- ============================================
-- 5. Create Sample Appointments (optional)
-- ============================================
-- Upcoming appointment
insert into public.appointments (
  id,
  business_id,
  service_id,
  customer_name,
  customer_email,
  customer_phone,
  start_time,
  end_time,
  status,
  payment_status
)
values (
  'e0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid, -- Hair Styling
  'Sarah Johnson',
  'sarah.johnson@example.com',
  '+1-555-0123',
  now() + interval '2 days' + interval '14 hours', -- 2 days from now at 2 PM
  now() + interval '2 days' + interval '15 hours 30 minutes',
  'confirmed',
  'paid'
)
on conflict (id) do nothing;

-- Past appointment
insert into public.appointments (
  id,
  business_id,
  service_id,
  customer_name,
  customer_email,
  customer_phone,
  start_time,
  end_time,
  status,
  payment_status
)
values (
  'e1000000-0000-0000-0000-000000000002'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'c2000000-0000-0000-0000-000000000002'::uuid, -- Spa Treatment
  'Emily Davis',
  'emily.davis@example.com',
  '+1-555-0456',
  now() - interval '5 days',
  now() - interval '5 days' + interval '2 hours 15 minutes',
  'completed',
  'paid'
)
on conflict (id) do nothing;

-- ============================================
-- Summary
-- ============================================
select
  'Seed data loaded successfully!' as message,
  (select count(*) from public.users) as users_count,
  (select count(*) from public.businesses) as businesses_count,
  (select count(*) from public.services) as services_count,
  (select count(*) from public.appointments) as appointments_count,
  (select count(*) from public.chatbot) as chatbot_count;
