-- Allow public (unauthenticated) users to view products
-- This enables the product catalog to be visible to everyone

-- Drop the existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Create a new policy that allows everyone (including unauthenticated users) to view products
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
TO public
USING (true);

