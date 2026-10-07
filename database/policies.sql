-- ==============================================================================
-- KS STORE - POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ==============================================================================

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. CATEGORÍAS
-- Público: Solo lectura
CREATE POLICY "Public categories read access" 
ON categories FOR SELECT 
USING (true);

-- Admin: Inserción, actualización y eliminación
CREATE POLICY "Admin categories insert access" 
ON categories FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin categories update access" 
ON categories FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin categories delete access" 
ON categories FOR DELETE 
TO authenticated 
USING (true);

-- 2. PRODUCTOS
-- Público: Solo lectura de productos visibles
CREATE POLICY "Public products read access" 
ON products FOR SELECT 
USING (status != 'hidden' OR auth.role() = 'authenticated');

-- Admin: CRUD completo
CREATE POLICY "Admin products insert access" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin products update access" 
ON products FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin products delete access" 
ON products FOR DELETE 
TO authenticated 
USING (true);

-- 3. IMÁGENES DE PRODUCTOS
CREATE POLICY "Public product images read access" 
ON product_images FOR SELECT 
USING (true);

CREATE POLICY "Admin product images insert access" 
ON product_images FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin product images update access" 
ON product_images FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin product images delete access" 
ON product_images FOR DELETE 
TO authenticated 
USING (true);

-- 4. TALLAS DE PRODUCTOS
CREATE POLICY "Public product sizes read access" 
ON product_sizes FOR SELECT 
USING (true);

CREATE POLICY "Admin product sizes insert access" 
ON product_sizes FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin product sizes update access" 
ON product_sizes FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin product sizes delete access" 
ON product_sizes FOR DELETE 
TO authenticated 
USING (true);

-- 5. COLORES DE PRODUCTOS
CREATE POLICY "Public product colors read access" 
ON product_colors FOR SELECT 
USING (true);

CREATE POLICY "Admin product colors insert access" 
ON product_colors FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin product colors update access" 
ON product_colors FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin product colors delete access" 
ON product_colors FOR DELETE 
TO authenticated 
USING (true);

-- 6. CONFIGURACIÓN DE TIENDA
CREATE POLICY "Public store settings read access" 
ON store_settings FOR SELECT 
USING (true);

CREATE POLICY "Admin store settings modify access" 
ON store_settings FOR ALL 
TO authenticated 
USING (true);

-- 7. PEDIDOS (ORDERS)
-- Público puede insertar el pedido al momento de enviar WhatsApp
CREATE POLICY "Public order creation access" 
ON orders FOR INSERT 
WITH CHECK (true);

-- Solo administradores pueden ver y gestionar pedidos
CREATE POLICY "Admin orders view and edit access" 
ON orders FOR ALL 
TO authenticated 
USING (true);

-- 8. PERFILES
CREATE POLICY "Profiles read access" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Profiles insert/update access" 
ON profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id);
