ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS images text[],
  ADD COLUMN IF NOT EXISTS compare_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'SIMPLE';

ALTER TABLE public.wilayas
  ADD COLUMN IF NOT EXISTS delivery_fee_home numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_desk numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS university_id uuid,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

UPDATE public.orders SET delivery_mode = 'home' WHERE delivery_mode IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pack_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'DzairTech',
  store_phone text,
  store_email text,
  store_address text,
  order_prefix text NOT NULL DEFAULT 'ORD',
  auto_accept_orders boolean NOT NULL DEFAULT false,
  allow_order_notes boolean NOT NULL DEFAULT true,
  store_open boolean NOT NULL DEFAULT true,
  show_out_of_stock boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active universities" ON public.universities;
CREATE POLICY "Public can read active universities"
  ON public.universities FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage universities" ON public.universities;
CREATE POLICY "Admin can manage universities"
  ON public.universities FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can read pack items" ON public.pack_items;
CREATE POLICY "Public can read pack items"
  ON public.pack_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = pack_items.pack_id
        AND products.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin can manage pack items" ON public.pack_items;
CREATE POLICY "Admin can manage pack items"
  ON public.pack_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings"
  ON public.store_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage store settings" ON public.store_settings;
CREATE POLICY "Admin can manage store settings"
  ON public.store_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS public.order_rate_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action text NOT NULL,
  key_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_rate_limits_lookup
  ON public.order_rate_limits (action, key_hash, created_at DESC);

ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';
REVOKE UPDATE (role) ON public.profiles FROM anon, authenticated;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.orders', policy_row.policyname);
  END LOOP;

  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_items'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.order_items', policy_row.policyname);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_order_rate_limit(
  p_client_ip text,
  p_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ip_hash text;
  v_phone_hash text;
  v_ip_count integer;
  v_phone_count integer;
  v_phone text;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone, ''), '[\s-]', '', 'g');

  v_ip_hash := encode(
    sha256(convert_to(coalesce(nullif(trim(p_client_ip), ''), 'unknown'), 'UTF8')),
    'hex'
  );
  v_phone_hash := encode(
    sha256(convert_to(coalesce(nullif(v_phone, ''), 'unknown'), 'UTF8')),
    'hex'
  );

  DELETE FROM public.order_rate_limits
  WHERE created_at < now() - interval '2 days';

  SELECT count(*)
  INTO v_ip_count
  FROM public.order_rate_limits
  WHERE action = 'order_ip'
    AND key_hash = v_ip_hash
    AND created_at > now() - interval '10 minutes';

  SELECT count(*)
  INTO v_phone_count
  FROM public.order_rate_limits
  WHERE action = 'order_phone'
    AND key_hash = v_phone_hash
    AND created_at > now() - interval '10 minutes';

  IF v_ip_count >= 10 OR v_phone_count >= 5 THEN
    RETURN false;
  END IF;

  INSERT INTO public.order_rate_limits (action, key_hash)
  VALUES ('order_ip', v_ip_hash), ('order_phone', v_phone_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_order_rate_limit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_order_rate_limit(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.create_order_atomic(p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item record;
  v_component record;
  v_existing record;
  v_order_id uuid;
  v_order_number text;
  v_order_prefix text := 'ORD';
  v_customer_name text;
  v_customer_phone text;
  v_wilaya_id uuid;
  v_commune_id uuid;
  v_address text;
  v_note text;
  v_delivery_mode text;
  v_university_id uuid;
  v_idempotency_key text;
  v_delivery_fee numeric(10, 2) := 0;
  v_subtotal numeric(10, 2) := 0;
  v_store_open boolean := true;
  v_allow_notes boolean := true;
  v_variant_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_product_type text;
  v_variant_description text;
  v_variant_price numeric(10, 2);
  v_variant_stock integer;
  v_variant_active boolean;
  v_variant_size text;
  v_variant_color text;
  v_product_active boolean;
  v_component_count integer;
BEGIN
  IF p_order IS NULL
     OR jsonb_typeof(p_order) <> 'object'
     OR jsonb_typeof(p_order -> 'items') <> 'array' THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  v_customer_name := trim(coalesce(p_order ->> 'customer_name', ''));
  v_customer_phone := regexp_replace(
    coalesce(p_order ->> 'customer_phone', ''),
    '[\s-]',
    '',
    'g'
  );
  v_address := trim(coalesce(p_order ->> 'address', ''));
  v_note := nullif(trim(coalesce(p_order ->> 'note', '')), '');
  v_delivery_mode := coalesce(p_order ->> 'delivery_mode', '');
  v_idempotency_key := nullif(
    trim(coalesce(p_order ->> 'idempotency_key', '')),
    ''
  );

  IF length(v_customer_name) < 2
     OR length(v_customer_name) > 120
     OR v_customer_phone !~ '^0[567][0-9]{8}$'
     OR length(v_address) < 5
     OR length(v_address) > 500
     OR length(coalesce(v_note, '')) > 1000
     OR v_delivery_mode NOT IN ('home', 'desk', 'university')
     OR jsonb_array_length(p_order -> 'items') = 0
     OR jsonb_array_length(p_order -> 'items') > 50 THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  IF v_idempotency_key IS NOT NULL
     AND v_idempotency_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;

  BEGIN
    v_wilaya_id := (p_order ->> 'wilaya_id')::uuid;
    v_commune_id := (p_order ->> 'commune_id')::uuid;
    v_university_id := nullif(p_order ->> 'university_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END;

  IF v_delivery_mode = 'university' AND v_university_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_UNIVERSITY';
  ELSIF v_delivery_mode <> 'university' THEN
    v_university_id := NULL;
  END IF;

  IF v_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_idempotency_key, 0));

    SELECT id, order_number, total, status, customer_phone
    INTO v_existing
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'order', jsonb_build_object(
          'order_number', v_existing.order_number,
          'total', v_existing.total,
          'status', v_existing.status,
          'customer_phone', v_existing.customer_phone
        )
      );
    END IF;
  END IF;

  SELECT store_open, allow_order_notes, order_prefix
  INTO v_store_open, v_allow_notes, v_order_prefix
  FROM public.store_settings
  WHERE id = 1;

  IF NOT FOUND THEN
    v_store_open := true;
    v_allow_notes := true;
    v_order_prefix := 'ORD';
  END IF;

  IF v_store_open IS FALSE THEN
    RAISE EXCEPTION 'STORE_CLOSED';
  END IF;

  IF v_allow_notes IS FALSE THEN
    v_note := NULL;
  END IF;

  IF v_delivery_mode = 'home' THEN
    SELECT delivery_fee_home
    INTO v_delivery_fee
    FROM public.wilayas
    WHERE id = v_wilaya_id
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_WILAYA';
    END IF;
  ELSIF v_delivery_mode = 'desk' THEN
    SELECT delivery_fee_desk
    INTO v_delivery_fee
    FROM public.wilayas
    WHERE id = v_wilaya_id
      AND is_active = true;

    IF NOT FOUND OR v_delivery_fee IS NULL OR v_delivery_fee <= 0 THEN
      RAISE EXCEPTION 'DELIVERY_UNAVAILABLE';
    END IF;
  ELSE
    SELECT delivery_fee_home
    INTO v_delivery_fee
    FROM public.wilayas
    WHERE id = v_wilaya_id
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_WILAYA';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.universities
      WHERE id = v_university_id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'INVALID_UNIVERSITY';
    END IF;

    v_delivery_fee := 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.communes
    WHERE id = v_commune_id
      AND wilaya_id = v_wilaya_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'INVALID_COMMUNE';
  END IF;

  v_order_prefix := regexp_replace(
    left(upper(coalesce(v_order_prefix, 'ORD')), 10),
    '[^A-Z0-9-]',
    '',
    'g'
  );

  IF v_order_prefix = '' THEN
    v_order_prefix := 'ORD';
  END IF;

  v_order_number := v_order_prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24));

  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    wilaya_id,
    commune_id,
    address,
    note,
    delivery_mode,
    university_id,
    subtotal,
    delivery_fee,
    total,
    status,
    idempotency_key
  )
  VALUES (
    v_order_number,
    v_customer_name,
    v_customer_phone,
    v_wilaya_id,
    v_commune_id,
    v_address,
    v_note,
    v_delivery_mode,
    v_university_id,
    0,
    v_delivery_fee,
    v_delivery_fee,
    'PENDING',
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT
      (value ->> 'variant_id')::uuid AS variant_id,
      sum((value ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_order -> 'items')
    GROUP BY 1
    ORDER BY 1
  LOOP
    IF v_item.quantity < 1 OR v_item.quantity > 100 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    SELECT
      pv.id,
      pv.product_id,
      pv.price,
      pv.stock,
      pv.is_active,
      pv.size,
      pv.color,
      p.name,
      p.is_active,
      p.product_type
    INTO
      v_variant_id,
      v_product_id,
      v_variant_price,
      v_variant_stock,
      v_variant_active,
      v_variant_size,
      v_variant_color,
      v_product_name,
      v_product_active,
      v_product_type
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id
    FOR UPDATE OF pv;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';
    END IF;

    IF v_variant_active IS NOT TRUE OR v_product_active IS NOT TRUE THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';
    END IF;

    IF v_variant_stock < v_item.quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    END IF;

    v_variant_description := nullif(
      trim(concat_ws(' / ', nullif(v_variant_size, ''), nullif(v_variant_color, ''))),
      ''
    );

    IF upper(coalesce(v_product_type, 'SIMPLE')) = 'PACK' THEN
      v_component_count := 0;

      FOR v_component IN
        SELECT
          pi.variant_id,
          (pi.quantity * v_item.quantity)::integer AS quantity,
          cv.stock,
          cv.is_active
        FROM public.pack_items pi
        JOIN public.product_variants cv ON cv.id = pi.variant_id
        WHERE pi.pack_id = v_product_id
        ORDER BY pi.variant_id
        FOR UPDATE OF cv
      LOOP
        v_component_count := v_component_count + 1;

        IF v_component.is_active IS NOT TRUE
           OR v_component.stock < v_component.quantity THEN
          RAISE EXCEPTION 'PACK_UNAVAILABLE';
        END IF;

        UPDATE public.product_variants
        SET stock = stock - v_component.quantity
        WHERE id = v_component.variant_id;
      END LOOP;

      IF v_component_count = 0 THEN
        RAISE EXCEPTION 'PACK_UNAVAILABLE';
      END IF;
    ELSE
      UPDATE public.product_variants
      SET stock = stock - v_item.quantity
      WHERE id = v_variant_id;
    END IF;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_description,
      price,
      quantity
    )
    VALUES (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_product_name,
      v_variant_description,
      v_variant_price,
      v_item.quantity
    );

    v_subtotal := v_subtotal + (v_variant_price * v_item.quantity);
  END LOOP;

  UPDATE public.orders
  SET subtotal = v_subtotal,
      total = v_subtotal + v_delivery_fee
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'order', jsonb_build_object(
      'order_number', v_order_number,
      'total', v_subtotal + v_delivery_fee,
      'status', 'PENDING',
      'customer_phone', v_customer_phone
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.get_order_confirmation(
  p_order_number text,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_number text;
  v_phone text;
  v_result jsonb;
BEGIN
  v_order_number := upper(trim(coalesce(p_order_number, '')));
  v_phone := regexp_replace(coalesce(p_phone, ''), '[\s-]', '', 'g');

  IF length(v_order_number) < 5
     OR length(v_order_number) > 50
     OR v_phone !~ '^0[567][0-9]{8}$' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'address', o.address,
    'note', o.note,
    'delivery_mode', o.delivery_mode,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'created_at', o.created_at,
    'wilaya', jsonb_build_object('name', w.name),
    'commune', jsonb_build_object('name', c.name),
    'university', CASE
      WHEN u.id IS NULL THEN NULL
      ELSE jsonb_build_object('name', u.name)
    END,
    'items', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'variant_description', oi.variant_description,
            'price', oi.price,
            'quantity', oi.quantity
          )
          ORDER BY oi.created_at, oi.id
        )
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM public.orders o
  JOIN public.wilayas w ON w.id = o.wilaya_id
  JOIN public.communes c ON c.id = o.commune_id
  LEFT JOIN public.universities u ON u.id = o.university_id
  WHERE o.order_number = v_order_number
    AND o.customer_phone = v_phone;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_confirmation(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(text, text) TO anon, authenticated, service_role;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
WHERE id = 'product-images';

DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'avif')
    AND lower(coalesce(metadata ->> 'mimetype', '')) IN (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    )
  );

DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin())
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'avif')
    AND lower(coalesce(metadata ->> 'mimetype', '')) IN (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    )
  );
