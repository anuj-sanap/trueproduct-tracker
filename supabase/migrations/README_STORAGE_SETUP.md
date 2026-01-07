# Storage Bucket Setup

After running the migration `20260107000001_add_product_image.sql`, you need to create the storage bucket manually.

## Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** section
3. Click **New bucket**
4. Set the bucket name to: `product-images`
5. Make sure **Public bucket** is checked (enabled)
6. Click **Create bucket**

## Option 2: Using Supabase CLI

```bash
supabase storage create product-images --public
```

## Option 3: Using SQL (if storage extension is enabled)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

After creating the bucket, the storage policies defined in the migration will automatically apply.

