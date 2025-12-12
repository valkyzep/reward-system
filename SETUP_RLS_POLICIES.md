# Setup RLS DELETE Policies

To enable full DELETE functionality in the Manage Rewards feature, you need to add DELETE policies to your Supabase database.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL commands:

```sql
-- Add DELETE policies for rewards management
CREATE POLICY "Allow public delete rewards" 
ON rewards FOR DELETE USING (true);

CREATE POLICY "Allow public delete variants" 
ON reward_variants FOR DELETE USING (true);

CREATE POLICY "Allow public delete galleries" 
ON reward_galleries FOR DELETE USING (true);
```

4. Click **Run** to execute the SQL

## What This Does:

- Allows the admin panel to delete rewards from the database
- CASCADE deletes will automatically remove associated variants and galleries
- Completes the full CRUD functionality (Create, Read, Update, Delete)

## After Running:

The DELETE button in Manage Rewards will work perfectly, removing rewards and all associated data from the database.
