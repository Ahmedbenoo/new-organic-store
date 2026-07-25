/*
  Final RLS & Storage Security Hardening
  --------------------------------------
  Run manually in Supabase SQL Editor AFTER reviewing.

  Goals:
  - anon: SELECT on public storefront data only
  - anon/authenticated: NO INSERT, UPDATE, DELETE anywhere
  - orders: fully private (no anon/authenticated access)
  - site_settings: hide admin_password from anon reads
  - storage bucket "products": public read only, no client uploads/deletes
  - All writes remain server-side via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)

  After running:
    NOTIFY pgrst, 'reload schema';

  Verification (run separately):
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
    ORDER BY schemaname, tablename, policyname;
*/

-- ---------------------------------------------------------------------------
-- 1. Drop legacy permissive policies (open read/write for anon + authenticated)
-- ---------------------------------------------------------------------------

-- products
DROP POLICY IF EXISTS "anon_select_products" ON public.products;
DROP POLICY IF EXISTS "anon_insert_products" ON public.products;
DROP POLICY IF EXISTS "anon_update_products" ON public.products;
DROP POLICY IF EXISTS "anon_delete_products" ON public.products;

-- site_settings
DROP POLICY IF EXISTS "anon_select_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_insert_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_update_settings" ON public.site_settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON public.site_settings;

-- orders
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON public.orders;

-- hero_slides
DROP POLICY IF EXISTS "anon_select_hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "anon_insert_hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "anon_update_hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "anon_delete_hero_slides" ON public.hero_slides;

-- about_page
DROP POLICY IF EXISTS "anon_select_about_page" ON public.about_page;
DROP POLICY IF EXISTS "anon_insert_about_page" ON public.about_page;
DROP POLICY IF EXISTS "anon_update_about_page" ON public.about_page;
DROP POLICY IF EXISTS "anon_delete_about_page" ON public.about_page;

-- blog
DROP POLICY IF EXISTS "anon_select_blog_page_settings" ON public.blog_page_settings;
DROP POLICY IF EXISTS "anon_insert_blog_page_settings" ON public.blog_page_settings;
DROP POLICY IF EXISTS "anon_update_blog_page_settings" ON public.blog_page_settings;
DROP POLICY IF EXISTS "anon_delete_blog_page_settings" ON public.blog_page_settings;
DROP POLICY IF EXISTS "anon_select_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "anon_insert_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "anon_update_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "anon_delete_blog_posts" ON public.blog_posts;

-- storage (products bucket + any legacy write policies)
DROP POLICY IF EXISTS "Public read products images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_products_images" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_products_storage" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_products_storage" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_products_storage" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_insert_products_storage" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_products_storage" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_products_storage" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2. Ensure RLS stays enabled
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_page_settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Revoke direct write privileges (defense-in-depth; service_role unaffected)
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON TABLE public.products FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.site_settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.hero_slides FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.about_page FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.blog_posts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.blog_page_settings FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE storage.objects FROM anon, authenticated;

-- Keep SELECT grants where public reads are intended (Supabase defaults).
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT SELECT ON TABLE public.hero_slides TO anon, authenticated;
GRANT SELECT ON TABLE public.about_page TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_page_settings TO anon, authenticated;
GRANT SELECT ON TABLE storage.objects TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public READ policies (anon only — authenticated gets same read scope)
-- ---------------------------------------------------------------------------

-- products: storefront catalog — active items only
CREATE POLICY "public_read_active_products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true);

-- site_settings: public storefront keys only — hides admin_password hash
CREATE POLICY "public_read_public_site_settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  key = ANY (
    ARRAY[
      'whatsapp_owner',
      'whatsapp_branch',
      'footer_email',
      'footer_phone',
      'footer_address_en',
      'footer_address_ar',
      'hero_badge_en',
      'hero_badge_ar',
      'hero_title_en',
      'hero_title_ar',
      'hero_description_en',
      'hero_description_ar'
    ]::text[]
  )
);

-- orders: NO public policy — all access via service_role API only

-- hero_slides: homepage slider — visible slides only
CREATE POLICY "public_read_active_hero_slides"
ON public.hero_slides
FOR SELECT
TO anon, authenticated
USING (active = true);

-- about_page: public marketing page (singleton)
CREATE POLICY "public_read_about_page"
ON public.about_page
FOR SELECT
TO anon, authenticated
USING (id = 1);

-- blog_posts: published posts only
CREATE POLICY "public_read_active_blog_posts"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (active = true);

-- blog_page_settings: public blog header (singleton)
CREATE POLICY "public_read_blog_page_settings"
ON public.blog_page_settings
FOR SELECT
TO anon, authenticated
USING (id = 1);

-- ---------------------------------------------------------------------------
-- 5. Storage bucket "products" — public read, no client writes
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "public_read_products_bucket_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- No INSERT / UPDATE / DELETE policies on storage.objects.
-- service_role (Next.js API) bypasses RLS for uploads and deletes.

NOTIFY pgrst, 'reload schema';
