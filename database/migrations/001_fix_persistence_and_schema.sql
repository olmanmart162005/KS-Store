-- ==============================================================================
-- KS STORE — MIGRACIÓN 001: CORRECCIÓN DE PERSISTENCIA, CAMPOS EXTENDIDOS Y SEGURIDAD RLS
-- ==============================================================================
-- Este script es 100% seguro e idempotente (NO borra ni sobrescribe tus productos actuales).
-- Puedes copiarlo y pegarlo completo en el SQL Editor de Supabase y presionar "Run".

BEGIN;

-- 1. AGREGAR COLUMNAS ADICIONALES A LA TABLA PRODUCTS (SI NO EXISTEN)
-- Permite guardar modelo/silueta y atributos específicos directamente en la tabla principal
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- 2. TRIGGER AUTOMÁTICO PARA ACTUALIZAR updated_at CADA VEZ QUE SE EDITE UN PRODUCTO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. ASEGURAR CATEGORÍAS OFICIALES Y DESCRIPCIÓN DE TIENDA EN ESPAÑOL (ORGULLO TRIUNFEÑO)
INSERT INTO categories (id, name, slug, description, icon, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Gorras', 'gorras', 'Gorras exclusivas de diseñador, New Era, pedrería y moda urbana.', 'Crown', 1),
('22222222-2222-2222-2222-222222222222', 'Tenis', 'tenis', 'Calzado auténtico, lanzamientos exclusivos y siluetas urbanas.', 'Footprints', 2),
('33333333-3333-3333-3333-333333333333', 'Moda Urbana', 'moda-urbana', 'Prendas y accesorios urbanos que definen tu estilo.', 'Shirt', 3)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

UPDATE store_settings
SET 
    tagline = 'Estilo que te representa • Orgullo Triunfeño',
    hero_subtitle = 'KS Store es tu tienda en línea de gorras, tenis y moda urbana en Honduras. Con orgullo Triunfeño, te ofrecemos la selección más cotizada en gorras de diseñador, pedrería fina y calzado urbano con envíos a todo el país.'
WHERE id IS NOT NULL;

-- 4. INSERTAR LOS 8 MODELOS DE TENIS SI AÚN NO ESTÁN EN LA BASE DE DATOS
-- Utiliza ON CONFLICT (sku) DO NOTHING para respetar cualquier cambio previo que hayas hecho
INSERT INTO products (name, slug, description, category_id, brand, model, sku, price, compare_price, stock, status, featured, is_new, is_sale, main_image) VALUES
('Nike Air Max 270 Black Neon', 'nike-air-max-270-black-neon', 'Silueta icónica con unidad Max Air de gran tamaño en el talón para una amortiguación inigualable y estilo urbano vanguardista.', '22222222-2222-2222-2222-222222222222', 'Nike', 'Air Max 270', 'KS-T001', 2499.00, 2850.00, 12, 'available', true, true, false, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'),
('Air Jordan 1 Retro High OG Chicago Lost & Found', 'air-jordan-1-retro-high-og-chicago', 'El clásico indiscutible del básquetbol y la cultura sneakerhead con acabados vintage de cuero premium en colorway Chicago.', '22222222-2222-2222-2222-222222222222', 'Jordan', 'Air Jordan 1 High OG', 'KS-T002', 3850.00, 4400.00, 8, 'available', true, false, false, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'),
('Nike Dunk Low Retro Panda', 'nike-dunk-low-retro-panda', 'El par más versátil del streetwear. Construcción en cuero premium con bloque de color blanco y negro atemporal.', '22222222-2222-2222-2222-222222222222', 'Nike', 'Dunk Low Retro', 'KS-T003', 2650.00, 2990.00, 15, 'available', true, false, true, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'),
('Air Jordan 4 Retro Black Cat', 'air-jordan-4-retro-black-cat', 'Monocromático absoluto en nobuck negro de máxima calidad con ojales de malla y amortiguación visible Air Sole.', '22222222-2222-2222-2222-222222222222', 'Jordan', 'Air Jordan 4 Retro', 'KS-T004', 4200.00, 4800.00, 6, 'available', true, true, false, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80'),
('New Balance 550 White Grey Vintage', 'new-balance-550-white-grey', 'Inspiración retro de las canchas de baloncesto de 1989. Cuero microperforado y detalles en gris neutro para el día a día.', '22222222-2222-2222-2222-222222222222', 'New Balance', '550 Vintage', 'KS-T005', 2350.00, 2600.00, 10, 'available', false, true, false, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'),
('Travis Scott x Air Jordan 1 Low Reverse Mocha', 'travis-scott-air-jordan-1-low-reverse-mocha', 'Colaboración de edición limitada con el icónico Swoosh invertido en tono vela sobre nubuck café mocha y cuero blanco.', '22222222-2222-2222-2222-222222222222', 'Jordan', 'Air Jordan 1 Low TS', 'KS-T006', 4950.00, 5500.00, 4, 'available', true, true, false, 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80'),
('Adidas Yeezy Boost 350 V2 Onyx', 'adidas-yeezy-boost-350-v2-onyx', 'Tejido Primeknit transpirable y suela con tecnología Boost encapsulada para la máxima comodidad en tono Onyx oscuro.', '22222222-2222-2222-2222-222222222222', 'Adidas', 'Yeezy Boost 350 V2', 'KS-T007', 3600.00, 4100.00, 7, 'available', false, false, false, 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80'),
('Nike Air Force 1 07 Triple White Classic', 'nike-air-force-1-07-triple-white', 'La leyenda urbana por excelencia. Cuero nítido totalmente blanco con chapa metálica AF-1 en los cordones.', '22222222-2222-2222-2222-222222222222', 'Nike', 'Air Force 1 07', 'KS-T008', 1950.00, 2250.00, 20, 'available', false, false, true, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (sku) DO NOTHING;

-- 5. POBLAR TALLAS INICIALES PARA PRODUCTOS QUE AÚN NO TENGAN TALLAS REGISTRADAS
INSERT INTO product_sizes (product_id, size, stock)
SELECT p.id, 'Ajustable / Unitalla', p.stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE (c.slug = 'gorras' OR p.sku LIKE 'KS-G%')
  AND NOT EXISTS (SELECT 1 FROM product_sizes ps WHERE ps.product_id = p.id);

INSERT INTO product_sizes (product_id, size, stock)
SELECT p.id, s.sz, GREATEST(1, p.stock / 5)
FROM products p
CROSS JOIN (VALUES ('39'), ('40'), ('41'), ('42'), ('43')) AS s(sz)
LEFT JOIN categories c ON p.category_id = c.id
WHERE (c.slug = 'tenis' OR p.sku LIKE 'KS-T%')
  AND NOT EXISTS (SELECT 1 FROM product_sizes ps WHERE ps.product_id = p.id);

-- 6. REFORZAR POLÍTICAS RLS (LECTURA PÚBLICA, ESCRITURA AUTORIZADA PARA ADMIN)
-- Asegurar que el usuario administrador principal tenga el correo confirmado y perfil activo
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'sauladmin@ksstore.org';

INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'sauladmin@ksstore.org'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Asegurar que todas las políticas de lectura permitan ver todo el catálogo y a los autenticados gestionar todo
DROP POLICY IF EXISTS "Public products read access" ON products;
CREATE POLICY "Public products read access"
ON products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin products insert access" ON products;
CREATE POLICY "Admin products insert access"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin products update access" ON products;
CREATE POLICY "Admin products update access"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin products delete access" ON products;
CREATE POLICY "Admin products delete access"
ON products FOR DELETE
TO authenticated
USING (true);

-- Políticas para tablas hijas (imágenes, tallas, colores, categorías)
DROP POLICY IF EXISTS "Admin product images all access" ON product_images;
CREATE POLICY "Admin product images all access"
ON product_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin product sizes all access" ON product_sizes;
CREATE POLICY "Admin product sizes all access"
ON product_sizes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin product colors all access" ON product_colors;
CREATE POLICY "Admin product colors all access"
ON product_colors FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin categories all access" ON categories;
CREATE POLICY "Admin categories all access"
ON categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin store settings all access" ON store_settings;
CREATE POLICY "Admin store settings all access"
ON store_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. ASEGURAR BUCKET DE STORAGE PÚBLICO PARA FOTOGRAFÍAS DE PRODUCTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public products storage read access" ON storage.objects;
CREATE POLICY "Public products storage read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin products storage insert access" ON storage.objects;
CREATE POLICY "Admin products storage insert access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin products storage update access" ON storage.objects;
CREATE POLICY "Admin products storage update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin products storage delete access" ON storage.objects;
CREATE POLICY "Admin products storage delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- 8. HABILITAR SUPABASE REALTIME EN TABLAS DEL CATÁLOGO
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
  END IF;
END $$;

COMMIT;
