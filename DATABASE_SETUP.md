# Database Setup Instructions

## Step 1: Run the SQL Schema in Supabase

1. Go to your Supabase project dashboard: https://app.supabase.com/project/YOUR_PROJECT_ID
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/schema.sql` into the editor
5. Click "Run" to execute the SQL and create all tables

## Step 2: Migrate Existing Rewards Data (Optional)

If you want to migrate your existing rewards from `rewardsData.ts` to the database:

```bash
npm install -g ts-node
ts-node scripts/migrate-rewards.ts
```

## Step 3: Update Frontend to Use Database

The frontend (`app/page.tsx`) currently uses `rewardsData.ts`. To switch to the database:

1. Replace the import:
```typescript
// OLD:
import { rewards } from './rewardsData'

// NEW:
// Remove the import, we'll fetch from API
```

2. Add a useEffect to fetch rewards:
```typescript
const [rewards, setRewards] = useState([])

useEffect(() => {
  fetch('/api/rewards')
    .then(res => res.json())
    .then(data => setRewards(data))
}, [])
```

## API Endpoints

### GET /api/rewards
Fetch all rewards with variants and galleries

### POST /api/rewards
Create a new reward
```json
{
  "name": "iPhone 17 Pro Max",
  "points": 50000,
  "category": "Gadget",
  "quantity": 5,
  "variants": {
    "type": "color",
    "options": ["Black Titanium", "White Titanium"]
  },
  "galleries": {
    "Black Titanium": ["url1", "url2", "url3", "url4"],
    "White Titanium": ["url1", "url2", "url3", "url4"]
  }
}
```

### POST /api/claims
Submit a new claim
```json
{
  "rewardId": 1,
  "variantOption": "Black Titanium",
  "username": "user123",
  "fullName": "John Doe",
  "phoneNumber": "09171234567",
  "deliveryAddress": "123 Main St, City",
  "ewalletName": null,
  "ewalletAccount": null
}
```

### GET /api/claims?claimId=CLM-XYZ123
Check claim status

## Database Schema

### rewards
- id (PK)
- name
- points
- category
- quantity
- variant_type
- created_at
- updated_at

### reward_variants
- id (PK)
- reward_id (FK)
- option_name
- created_at

### reward_galleries
- id (PK)
- variant_id (FK)
- image_url
- image_order (0-3)
- created_at

### claims
- id (PK)
- claim_id (unique)
- reward_id (FK)
- variant_id (FK)
- username
- full_name
- phone_number
- delivery_address
- ewallet_name
- ewallet_account
- status (Pending/Processing/Approved/Completed/Rejected)
- created_at
- updated_at
