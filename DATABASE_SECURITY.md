# Database-Level Security Implementation

## Overview
This application now uses **Supabase Service Role Key** for server-side database operations with proper Row Level Security (RLS) enforcement.

## Security Architecture

### 1. Service Role Client (`lib/supabaseAdmin.ts`)
- Uses service role key to bypass RLS initially
- Sets session context via `set_session_context()` function
- RLS policies check the session context to enforce permissions

### 2. RLS Policies (`supabase/00_complete_schema.sql`)
- **Public**: Can view rewards, submit claims
- **Admins**: Can manage rewards, variants, galleries, claims
- **Super Admins**: Can manage users
- **Session-based**: Uses `get_session_token()` to validate current user

### 3. API Route Protection
All API routes now:
1. Validate CSRF tokens (prevents cross-site attacks)
2. Apply rate limiting (prevents brute force)
3. Use service role client with session context
4. Let RLS policies enforce database-level permissions

## Environment Setup

### Required Environment Variable
Add to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Get your service role key:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the `service_role` key (marked as "secret")

⚠️ **IMPORTANT**: Never commit this key to version control!

## Database Migration

Run the updated schema to apply new RLS policies:

```sql
-- In Supabase SQL Editor, run:
supabase/00_complete_schema.sql
```

This creates:
- `set_session_context()` - Sets session token for current transaction
- `get_session_token()` - Retrieves current session token
- `is_authenticated()` - Checks if user has valid session
- `is_admin()` - Checks if user is admin
- `is_super_admin()` - Checks if user is super admin
- RLS policies using these functions

## How It Works

### Request Flow:
1. User makes authenticated request with session cookie
2. API route validates CSRF token + rate limit
3. `getSupabaseAdmin()` creates client with service role key
4. Calls `set_session_context()` to pass session token to database
5. RLS policies check session via `get_session_token()`
6. Database allows/denies operation based on user role

### Example:
```typescript
// API Route
const supabase = await getSupabaseAdmin() // Sets session context

// User tries to delete reward
await supabase.from('rewards').delete().eq('id', rewardId)
// ✅ Allowed if is_admin() returns true
// ❌ Denied if not authenticated or not admin
```

## Security Benefits

✅ **Defense in Depth**: Security at both API and database levels  
✅ **RLS Enforcement**: Database rejects unauthorized operations even if API is bypassed  
✅ **CSRF Protection**: Prevents cross-site request forgery  
✅ **Rate Limiting**: Prevents brute force attacks  
✅ **Session Validation**: Every request validates session token  

## Testing RLS Policies

Test in Supabase SQL Editor:

```sql
-- Set session context (mimics API route)
SELECT set_session_context('your-test-session-token');

-- Try operations (should respect RLS)
SELECT * FROM rewards; -- Should work (public read)
DELETE FROM rewards WHERE id = 'some-id'; -- Should fail if not admin
```

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
- Add service role key to `.env.local`
- Restart dev server: `npm run dev`

### Error: "new row violates row-level security policy"
- User doesn't have permission for operation
- Check session is valid and user has correct role
- Verify `set_session_context()` is being called

### Claims/Rewards not appearing
- RLS policy may be blocking read access
- Check user session is set correctly
- Verify policies allow public SELECT on rewards/claims
