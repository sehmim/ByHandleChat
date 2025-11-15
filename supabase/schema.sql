-- Handle Revenue OS - Complete Database Schema
-- Created: 2025-11-15
-- 5 core tables: users, businesses, services, appointments, chatbot

-- ============================================
-- 1. USERS TABLE
-- Business owners authenticated via NextAuth
-- ============================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Business owners who manage their scheduling businesses';

-- ============================================
-- 2. BUSINESSES TABLE
-- All business settings stored as JSON
-- ============================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  website text,
  address text,
  timezone text default 'America/New_York',

  -- JSON fields for flexible business data
  hours_json jsonb,
  policies_json jsonb,
  faqs_json jsonb,
  about_json jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.businesses is 'Business profiles with hours, policies, FAQ stored as JSON';
comment on column public.businesses.hours_json is 'Business operating hours by day of week';
comment on column public.businesses.policies_json is 'Cancellation, payment, and other policies';
comment on column public.businesses.faqs_json is 'Frequently asked questions';
comment on column public.businesses.about_json is 'About the business, team info, etc';

-- Index for looking up businesses by owner
create index if not exists idx_businesses_owner_id on public.businesses(owner_id);

-- ============================================
-- 3. SERVICES TABLE
-- Structured pricing + duration for availability
-- ============================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null default 0,
  duration_minutes int not null,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.services is 'Services offered by businesses - used for scheduling and pricing';
comment on column public.services.price_cents is 'Price in cents (e.g., $50.00 = 5000)';
comment on column public.services.duration_minutes is 'Service duration used for availability calculation';
comment on column public.services.active is 'Whether this service is currently bookable';

-- Index for looking up active services by business
create index if not exists idx_services_business_id on public.services(business_id);
create index if not exists idx_services_active on public.services(business_id, active);

-- ============================================
-- 4. APPOINTMENTS TABLE
-- Core scheduling with start/end times + customer info
-- ============================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,

  -- Customer information
  customer_name text not null,
  customer_email text not null,
  customer_phone text,

  -- Scheduling
  start_time timestamptz not null,
  end_time timestamptz not null,

  -- Status tracking
  status text not null default 'pending',
  payment_status text not null default 'none',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ensure end_time is after start_time
  constraint appointments_time_check check (end_time > start_time)
);

comment on table public.appointments is 'Scheduled appointments with customer info and payment status';
comment on column public.appointments.status is 'pending, confirmed, cancelled, completed, no_show';
comment on column public.appointments.payment_status is 'none, pending, paid, refunded';

-- Indexes for common queries
create index if not exists idx_appointments_business_id on public.appointments(business_id);
create index if not exists idx_appointments_service_id on public.appointments(service_id);
create index if not exists idx_appointments_start_time on public.appointments(business_id, start_time);
create index if not exists idx_appointments_status on public.appointments(business_id, status);

-- ============================================
-- 5. CHATBOT TABLE
-- Widget UI config + public_id used on websites
-- ============================================
create table if not exists public.chatbot (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  public_id text unique not null,
  config_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chatbot is 'Widget configuration and public embed IDs for each business';
comment on column public.chatbot.public_id is 'Public-facing ID used in embed script (e.g., "handle_abc123")';
comment on column public.chatbot.config_json is 'Widget UI customization: colors, avatar, welcome message, etc';

-- Indexes
create index if not exists idx_chatbot_business_id on public.chatbot(business_id);
create index if not exists idx_chatbot_public_id on public.chatbot(public_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_businesses_updated_at before update on public.businesses
  for each row execute function update_updated_at_column();

create trigger update_services_updated_at before update on public.services
  for each row execute function update_updated_at_column();

create trigger update_appointments_updated_at before update on public.appointments
  for each row execute function update_updated_at_column();

create trigger update_chatbot_updated_at before update on public.chatbot
  for each row execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- TODO: Enable after NextAuth integration
-- ============================================
-- alter table public.users enable row level security;
-- alter table public.businesses enable row level security;
-- alter table public.services enable row level security;
-- alter table public.appointments enable row level security;
-- alter table public.chatbot enable row level security;
