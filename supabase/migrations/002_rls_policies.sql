-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ENABLE RLS ON ALL TABLES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (for customers)
-- ============================================

-- Categories: Anyone can read active categories
CREATE POLICY "Public can read active categories"
ON categories FOR SELECT
USING (is_active = true);

-- Products: Anyone can read active products
CREATE POLICY "Public can read active products"
ON products FOR SELECT
USING (is_active = true);

-- Product Variants: Anyone can read active variants of active products
CREATE POLICY "Public can read active variants"
ON product_variants FOR SELECT
USING (
    is_active = true 
    AND EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_variants.product_id 
        AND products.is_active = true
    )
);

-- Wilayas: Anyone can read active wilayas
CREATE POLICY "Public can read active wilayas"
ON wilayas FOR SELECT
USING (is_active = true);

-- Communes: Anyone can read active communes
CREATE POLICY "Public can read active communes"
ON communes FOR SELECT
USING (is_active = true);

-- ============================================
-- ADMIN POLICIES (for authenticated admin)
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories: Admin can do everything
CREATE POLICY "Admin can manage categories"
ON categories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Products: Admin can do everything
CREATE POLICY "Admin can manage products"
ON products FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Product Variants: Admin can do everything
CREATE POLICY "Admin can manage variants"
ON product_variants FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Wilayas: Admin can manage delivery fees
CREATE POLICY "Admin can manage wilayas"
ON wilayas FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Communes: Admin can manage communes
CREATE POLICY "Admin can manage communes"
ON communes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Orders: Admin can read and update orders
CREATE POLICY "Admin can manage orders"
ON orders FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Order Items: Admin can read order items
CREATE POLICY "Admin can manage order items"
ON order_items FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Profiles: Admin can manage all profiles
CREATE POLICY "Admin can manage profiles"
ON profiles FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================
-- STORAGE POLICIES (for product images)
-- ============================================

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Admin can upload product images
CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND is_admin()
);

-- Admin can update product images
CREATE POLICY "Admin can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND is_admin()
);

-- Admin can delete product images
CREATE POLICY "Admin can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND is_admin()
);