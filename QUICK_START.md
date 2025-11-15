# Quick Start Guide - Week 1 Complete! 🚀

## What We Accomplished in 2 Hours

✅ **Day 2:** Complete 5-table database schema
✅ **Day 4:** Migrated existing config to database with seed data
✅ **Day 3:** Secure widget layer with public_id
✅ **Day 5:** Availability engine (backend only)

See full details: [docs/WEEK1_IMPLEMENTATION.md](docs/WEEK1_IMPLEMENTATION.md)

---

## Next Steps to Get Running

### 1. Set Up Database (5 minutes)

#### Option A: Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy contents of `supabase/schema.sql`
5. Click **Run**
6. Create another new query
7. Copy contents of `supabase/seed.sql`
8. Click **Run**

#### Option B: Command Line
```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations
psql $DATABASE_URL -f supabase/schema.sql
psql $DATABASE_URL -f supabase/seed.sql
```

### 2. Verify Database Setup

Run this query in Supabase SQL Editor:
```sql
-- Should return 1 user, 1 business, 4 services, 1 chatbot, 2 appointments
SELECT
  (SELECT count(*) FROM users) as users,
  (SELECT count(*) FROM businesses) as businesses,
  (SELECT count(*) FROM services) as services,
  (SELECT count(*) FROM chatbot) as chatbot,
  (SELECT count(*) FROM appointments) as appointments;
```

Expected output:
```
users: 1
businesses: 1
services: 4
chatbot: 1
appointments: 2
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

You should see:
- ✅ Widget in bottom-right corner
- ✅ "Handle Revenue OS" page with embed instructions

### 4. Test the APIs

#### Test Widget Config API
```bash
curl http://localhost:3000/api/widget/handle_demo_salon | jq
```

Should return business name, services, hours, policies, etc.

#### Test Availability API
```bash
curl -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "b0000000-0000-0000-0000-000000000001",
    "serviceId": "c1000000-0000-0000-0000-000000000001",
    "numDays": 7
  }' | jq
```

Should return available time slots for the next 7 days.

---

## Test Widget on External Page

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>

  <!-- Widget will appear in bottom-right -->
  <script src="http://localhost:3000/widget.js"
          data-widget-id="handle_demo_salon">
  </script>
</body>
</html>
```

Open in browser - widget should load and work!

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)             │
│  ├── users                                  │
│  ├── businesses (with hours_json, etc.)    │
│  ├── services (pricing, duration)          │
│  ├── appointments (bookings)               │
│  └── chatbot (public_id, config_json)      │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  Backend APIs (Next.js)                     │
│  ├── GET /api/widget/[publicId]            │
│  │   → Returns merged config               │
│  ├── POST /api/availability                │
│  │   → Calculates open time slots          │
│  └── POST /api/booking (existing)          │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  Widget (Embeddable)                        │
│  <script data-widget-id="PUBLIC_ID">       │
│  ├── Fetches config by public_id           │
│  ├── Shows services & availability          │
│  └── Allows booking (with chat)            │
└─────────────────────────────────────────────┘
```

---

## Demo Data

After running seed.sql, you have:

### Business
- **Name:** Handle Salon & Spa
- **Public ID:** `handle_demo_salon`
- **Hours:** Mon-Sat 9am-7pm, Sun 10am-5pm
- **Location:** 123 Main Street, Downtown

### Services
1. **Hair Styling** - $120 / 90 minutes
2. **Spa Treatment** - $150 / 135 minutes (2h 15m)
3. **Manicure & Pedicure** - $60 / 75 minutes
4. **Facial Treatment** - $90 / 90 minutes

### Appointments
- 1 upcoming (2 days from now)
- 1 completed (5 days ago)

---

## Common Issues & Fixes

### Widget doesn't appear
- ✅ Check browser console for errors
- ✅ Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- ✅ Make sure database migrations ran successfully
- ✅ Check Network tab - should see request to `/api/widget/handle_demo_salon`

### API returns 404 or 500
- ✅ Verify seed data exists (run the SQL query from step 2)
- ✅ Check that UUIDs in seed.sql match those in API requests
- ✅ Look at server console logs for detailed error messages

### No available time slots
- ✅ Make sure you're looking at future dates (not past)
- ✅ Check business hours allow for the service duration
- ✅ Verify appointments table doesn't have conflicts

---

## File Structure

```
ByHandleChat/
├── supabase/
│   ├── schema.sql          ← Database structure
│   ├── seed.sql            ← Demo data
│   └── README.md           ← Migration instructions
├── src/
│   ├── lib/
│   │   ├── db.ts           ← Database utilities
│   │   └── availability.ts ← Availability engine
│   └── widget.tsx          ← Widget client (updated)
├── app/
│   ├── api/
│   │   ├── widget/[publicId]/route.ts  ← Widget config
│   │   ├── availability/route.ts       ← Availability API
│   │   └── booking/route.ts           ← Booking API
│   └── page.tsx            ← Demo page
└── docs/
    └── WEEK1_IMPLEMENTATION.md  ← Full docs
```

---

## What's Working Now

✅ Multi-tenant widget architecture
✅ Secure config fetching via public_id
✅ Real-time availability calculation
✅ Business hours enforcement
✅ Service-based duration
✅ Appointment conflict detection
✅ Database-backed everything (no more in-memory!)

---

## Next: Week 2 (Days 1, 6-14)

Still TODO:
- [ ] Day 1: NextAuth + Google login
- [ ] Day 6: Dashboard UI
- [ ] Days 8-13: Onboarding wizard (6 steps)
- [ ] Day 14: Booking flow + Stripe payments

But the **core foundation is rock-solid!** 🎉

---

## Need Help?

Check:
1. [WEEK1_IMPLEMENTATION.md](docs/WEEK1_IMPLEMENTATION.md) - Full implementation details
2. [MVP1-pan.md](docs/MVP1-pan.md) - Original 14-day plan
3. [supabase/README.md](supabase/README.md) - Database setup guide

Happy coding! 🚀
