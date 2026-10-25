-- ==============================================================================
-- KS STORE — MIGRACIÓN 002: SISTEMA DE PEDIDOS, HISTORIAL Y ELEMENTOS DE PEDIDO (PDF)
-- ==============================================================================
-- Este script es 100% seguro e idempotente.
-- Crea y actualiza las tablas `orders` y `order_items` para almacenar el historial
-- de pedidos generados en el catálogo junto con su instantánea histórica de precios e imágenes.

BEGIN;

-- 1. ASEGURAR TABLA PRINCIPAL DE PEDIDOS (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Trigger automático para actualizar updated_at en orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. CREAR TABLA DETALLADA DE ELEMENTOS DEL PEDIDO (order_items)
-- Guarda la fotografía exacta (image_url) y el precio unitario (unit_price) vigentes al momento del pedido
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    size VARCHAR(50),
    color VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 3. POLÍTICAS DE SEGURIDAD RLS PARA ORDERS Y ORDER_ITEMS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Cualquier cliente público puede registrar un nuevo pedido desde el catálogo
DROP POLICY IF EXISTS "Public orders insert access" ON orders;
CREATE POLICY "Public orders insert access"
ON orders FOR INSERT
WITH CHECK (true);

-- Lectura de pedidos y gestión completa para administradores autenticados
DROP POLICY IF EXISTS "Public orders select access" ON orders;
CREATE POLICY "Public orders select access"
ON orders FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin orders update access" ON orders;
CREATE POLICY "Admin orders update access"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin orders delete access" ON orders;
CREATE POLICY "Admin orders delete access"
ON orders FOR DELETE
TO authenticated
USING (true);

-- Políticas para order_items
DROP POLICY IF EXISTS "Public order items insert access" ON order_items;
CREATE POLICY "Public order items insert access"
ON order_items FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Public order items select access" ON order_items;
CREATE POLICY "Public order items select access"
ON order_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin order items all access" ON order_items;
CREATE POLICY "Admin order items all access"
ON order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. HABILITAR SUPABASE REALTIME EN ORDERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

COMMIT;
