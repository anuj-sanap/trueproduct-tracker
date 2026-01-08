-- Add product_image column to products table
ALTER TABLE public.products
ADD COLUMN product_image text;

-- Add comment for documentation
COMMENT ON COLUMN public.products.product_image IS 'URL to product image stored in Supabase Storage';