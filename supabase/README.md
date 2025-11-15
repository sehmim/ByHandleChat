# Database Setup

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (if using Supabase cloud)
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Or execute SQL directly
psql $DATABASE_URL < supabase/schema.sql
psql $DATABASE_URL < supabase/seed.sql
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste contents of `schema.sql`
4. Click **Run**
5. Repeat for `seed.sql`

### Option 3: Using Direct PostgreSQL Connection
```bash
# If you have the connection string
export DATABASE_URL="postgresql://user:pass@host:port/dbname"

psql $DATABASE_URL -f supabase/schema.sql
psql $DATABASE_URL -f supabase/seed.sql
```

## Database Structure

### Tables Created
1. **users** - Business owners (for NextAuth)
2. **businesses** - Business profiles with JSON config fields
3. **services** - Services offered with pricing and duration
4. **appointments** - Scheduled appointments with customer info
5. **chatbot** - Widget configuration with public_id for embeds

### Seed Data Includes
- Demo user: `demo@handlesalon.com`
- Demo business: "Handle Salon & Spa"
- 4 services (Hair Styling, Spa Treatment, Manicure & Pedicure, Facial)
- Sample chatbot widget with `public_id: handle_demo_salon`
- 2 sample appointments (1 upcoming, 1 past)

## Testing the Migration

After running the migrations, you can verify:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- View seed data
SELECT * FROM users;
SELECT * FROM businesses;
SELECT * FROM services;
SELECT * FROM chatbot;
SELECT * FROM appointments;
```

## Next Steps

1. Update environment variables in `.env.local`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. The widget will now fetch config using:
   ```
   GET /api/widget/[publicId]/config
   ```

3. Test with the demo public_id: `handle_demo_salon`
