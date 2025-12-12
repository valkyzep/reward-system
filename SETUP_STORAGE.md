# Setup Supabase Storage for Image Uploads

To enable image uploads in the Manage Rewards feature, you need to create a storage bucket in your Supabase project.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `reward-images`
   - **Public bucket**: ✅ **Enabled** (so images can be accessed publicly)
   - Click **Create bucket**

## Configure Storage Policies:

After creating the bucket, you need to set up policies to allow uploads and access:

1. Click on the `reward-images` bucket
2. Go to **Policies** tab
3. Click **New Policy**

### Policy 1: Allow Public Uploads

```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reward-images');
```

### Policy 2: Allow Public Access

```sql
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'reward-images');
```

### Policy 3: Allow Public Updates

```sql
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reward-images');
```

### Policy 4: Allow Public Deletes

```sql
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'reward-images');
```

## What This Does:

- Creates a public storage bucket for reward images
- Allows anyone to upload, view, update, and delete images
- Images will be accessible via public URLs
- Uploaded images are automatically stored in the `rewards/` folder

## After Setup:

The Add/Edit Reward form will allow you to:
- Upload images directly from your computer
- Preview images before saving
- Remove uploaded images
- Support for JPG, PNG, GIF, WebP, and other image formats

## File Organization:

Images are stored with unique filenames to prevent conflicts:
- Format: `{timestamp}-{random}.{extension}`
- Example: `1701788400000-abc123.jpg`
- All images stored in: `reward-images/rewards/`
