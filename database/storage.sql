-- ==============================================================================
-- KS STORE - CONFIGURACIÓN DE SUPABASE STORAGE
-- ==============================================================================

-- 1. CREAR EL BUCKET "products" (Público para lectura de imágenes)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICA DE LECTURA PÚBLICA PARA IMÁGENES
CREATE POLICY "Public products storage read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- 3. POLÍTICAS DE GESTIÓN PARA USUARIOS AUTENTICADOS (ADMINISTRADORES)
CREATE POLICY "Admin products storage insert access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Admin products storage update access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'products');

CREATE POLICY "Admin products storage delete access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'products');
