Handle Revenue OS — 2-Week Build Plan (1–2h/day)

This document outlines the minimal, scalable architecture and the 14-day execution plan to ship Handle Revenue OS:

secure multi-tenant widget

business onboarding wizard

scheduling + availability engine

appointment booking

Stripe payments

business dashboard

1. System Architecture Overview

Handle uses five core tables:

1. users

Business owners authenticated via NextAuth.

2. businesses

All business settings stored as JSON:

hours

policies

FAQ

about info

3. services

Structured pricing + duration used for availability calculation.

4. appointments

Core scheduling table containing start/end times + customer info.

5. chatbot

Widget UI config + public_id used onsite.

These five tables support:

onboarding

scheduling

widget config

booking

payments

future AI knowledge base

2. Database Schema
users
id uuid pk
email text unique not null
name text
avatar_url text
created_at timestamptz default now()

businesses
id uuid pk
owner_id uuid references users(id)
name text
website text
address text
timezone text

hours_json jsonb
policies_json jsonb
faqs_json jsonb
about_json jsonb

created_at timestamptz default now()
updated_at timestamptz default now()

services
id uuid pk
business_id uuid references businesses(id)
name text
description text
price_cents int
duration_minutes int
active boolean default true

created_at timestamptz default now()
updated_at timestamptz default now()

appointments
id uuid pk
business_id uuid references businesses(id)
service_id uuid references services(id)

customer_name text
customer_email text
customer_phone text

start_time timestamptz
end_time timestamptz

status text default 'pending'
payment_status text default 'none'

created_at timestamptz default now()
updated_at timestamptz default now()

chatbot
id uuid pk
business_id uuid references businesses(id)
public_id text unique
config_json jsonb

created_at timestamptz default now()
updated_at timestamptz default now()

3. Widget Architecture

Businesses embed:

<script 
  src="https://yourdomain.com/widget.js"
  data-widget-id="PUBLIC_ID">
</script>


Widget calls:

GET /api/widget/[publicId]/config


Backend returns merged config:

chatbot.config_json

business hours

policies

FAQ

services list

Widget never reads Supabase directly.

4. Core Backend Workflows
A. Checking Availability

Load hours from hours_json

Load service duration

Load existing appointments

Generate open time slots

Return them to widget

B. Creating Appointment

Validate slot

Compute end_time = start + duration

Insert appointment into appointments

(Optional) Create Stripe PaymentIntent

On webhook → mark appointment confirmed

C. Business Dashboard

Manage business info

Manage hours

Manage services

Update policies + FAQ

Configure widget UI

View/manage appointments

5. 14-Day Execution Plan (1–2 hours/day)
Week 1 — Foundations
Day 1 — Auth + Users Table

Install NextAuth

Enable Google login

Upsert into users

Protect /dashboard

Day 2 — Create All 5 Tables

users

businesses

services

appointments

chatbot

Day 3 — Secure Widget Layer

Add public_id

Add embed script

Build /api/widget/[publicId]/config

Remove public Supabase reads

Day 4 — Move Existing JSON Into Chatbot

Insert full UI JSON into chatbot.config_json

Link to a business

Day 5 — Availability Engine (Backend Only)

Write availability generator

Inputs: hours_json, services.duration, appointments

Output: open time slots

Day 6 — Dashboard Skeleton

Create /dashboard

Create /settings/* pages

Create /appointments page

Day 7 — Cleanup / Buffer

Fix bugs

Align routing

Prepare for onboarding wizard

Week 2 — Onboarding + Bookings + Payments
Day 8 — Onboarding Step 1: Business Info

Write:

name

address

website

timezone

Day 9 — Onboarding Step 2: Hours

Write to:
hours_json

Day 10 — Onboarding Step 3: Services

CRUD operations on services.

Day 11 — Onboarding Step 4: Policies + FAQ

Write to:

policies_json

faqs_json

about_json

Day 12 — Onboarding Step 5: Chatbot UI Config

Write to:
chatbot.config_json

Day 13 — Onboarding Step 6: Embed Code

Display:

<script src=".../widget.js" data-widget-id="PUBLIC_ID"></script>

Day 14 — Booking Flow + Stripe

Connect availability API

Connect create appointment API

Integrate minimal Stripe checkout

Webhook updates payment_status + status

6. After 2 Weeks — What's Working

You will have:

✔ Secure business login
✔ Multi-step onboarding
✔ Business + services fully stored
✔ Widget UI config
✔ Secure multi-tenant widget
✔ Real availability engine
✔ Appointment booking
✔ Stripe payment flow
✔ Dashboard to view/manage appointments

This is a launch-ready MVP for real businesses.

7. Optional Extensions (Future Weeks)

Conversations + messages tables

Ticketing / lead inbox

Knowledge base embeddings

Google Calendar sync

Customer accounts

Staff-level scheduling

Email/SMS reminders

8. Folder Structure Recommendation
/app
  /api
    /widget/[publicId]/config
    /appointment/check-availability
    /appointment/create
    /stripe/intent
    /stripe/webhook
  /dashboard
  /settings
  /onboarding

/lib
  availability.ts
  db.ts
  auth.ts

/components
  Widget
  Onboarding
  Settings
  ServicesForm
