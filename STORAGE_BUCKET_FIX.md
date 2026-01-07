# Fix: Storage Bucket Error

If you're still getting the "Storage bucket not found" error, follow these steps:

## Step 1: Verify Bucket Exists

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** (left sidebar)
3. Check if you see a bucket named **`product-images`**
4. If it doesn't exist, create it:
   - Click **"New bucket"**
   - Name: `product-images` (exactly this name, lowercase with hyphen)
   - **Enable "Public bucket"** (this is important!)
   - Click **"Create bucket"**

## Step 2: Verify Bucket is Public

1. Click on the `product-images` bucket
2. Go to **Settings** tab
3. Make sure **"Public bucket"** is enabled/checked
4. If not, enable it and save

## Step 3: Check Storage Policies

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Make sure you see these policies for `product-images`:
   - "Admins can upload product images" (INSERT)
   - "Anyone can view product images" (SELECT)
   - "Admins can update product images" (UPDATE)
   - "Admins can delete product images" (DELETE)

If policies are missing, run this SQL in the SQL Editor:

```sql
-- Create storage policy to allow authenticated users to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create storage policy to allow anyone to view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Create storage policy to allow admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create storage policy to allow admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);
```

## Step 4: Verify Your Admin Role

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query to check your role:

```sql
SELECT ur.role, p.email 
FROM user_roles ur
JOIN profiles p ON p.user_id = ur.user_id
WHERE ur.user_id = auth.uid();
```

3. You should see `admin` as the role. If not, you need to be assigned admin role.

## Step 5: Create Bucket via SQL (Alternative)

If the dashboard method doesn't work, run this SQL directly:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
```

## Step 6: Test the Bucket

After creating the bucket, try uploading an image again. If it still fails:

1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for error messages
4. Check the **Network** tab to see the actual API response

## Common Issues:

- **Bucket name mismatch**: Must be exactly `product-images` (lowercase, with hyphen)
- **Bucket not public**: Must enable "Public bucket" option
- **Missing policies**: Storage policies must be created
- **Not admin**: User must have admin role in `user_roles` table
- **RLS blocking**: Check if Row Level Security is blocking the operation

