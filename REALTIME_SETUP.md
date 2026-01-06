# Real-Time Updates Setup

This project now supports **real-time updates** - changes in the backend (rewards, categories, tiers) will automatically appear in the frontend without needing to refresh the page!

## How It Works

- Uses **Supabase Realtime** to listen for database changes
- Automatically updates the frontend when:
  - Stock quantities change
  - New rewards are added
  - Rewards are updated or deleted
  - Categories or tiers are modified

## Setup Instructions

### 1. Enable Realtime in Supabase

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Enable realtime for rewards table
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;

-- Enable realtime for categories table
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Enable realtime for tiers table
ALTER PUBLICATION supabase_realtime ADD TABLE tiers;

-- Optional: Enable for other tables
ALTER PUBLICATION supabase_realtime ADD TABLE claims;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_galleries;
```

Or simply run the migration file:
```bash
# Copy the contents of supabase/enable-realtime.sql and run it in Supabase SQL Editor
```

### 2. Verify Realtime is Enabled

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Ensure `supabase_realtime` publication exists
4. Verify your tables are listed under the publication

### 3. Test It Out

1. Open your frontend application
2. Open your admin dashboard in another tab
3. Add or update a reward's stock
4. **Watch the frontend update automatically** without refresh! ✨

## What Updates in Real-Time

- ✅ **Rewards**: Stock changes, price changes, new rewards
- ✅ **Categories**: New categories, category updates
- ✅ **Tiers**: New tiers, tier updates
- ✅ **Inventory**: Quantity updates from restocking

## Technical Details

- **Frontend**: Subscribed to Postgres changes via `supabase.channel()`
- **Events**: Listens for `INSERT`, `UPDATE`, `DELETE` on specified tables
- **Automatic cleanup**: Subscriptions are removed when component unmounts
- **No polling**: Uses WebSocket connection for instant updates

## Troubleshooting

### Changes not appearing in real-time?

1. **Check if Realtime is enabled**:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

2. **Verify environment variables** are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. **Check browser console** for connection errors

4. **Ensure RLS policies allow reading**: Realtime requires SELECT permissions

### Still not working?

- Check Supabase logs in Dashboard → Logs
- Verify your internet connection (WebSocket required)
- Make sure you're using the anon key, not the service role key for frontend

## Performance

- **Minimal overhead**: Only subscribes to necessary tables
- **Efficient updates**: Updates only changed items in state
- **Auto-cleanup**: Unsubscribes when user leaves page
- **Scalable**: Supabase handles millions of realtime connections

---

**Note**: Realtime is included in Supabase's free tier with generous limits!
