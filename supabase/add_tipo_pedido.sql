BEGIN;

-- 1. Añadir la columna tipo_pedido a la tabla pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_pedido TEXT DEFAULT 'local';

-- 2. Asegurarnos que el RLS siga permitiendo leer y modificar pedidos de todo tipo
-- No se requiere un cambio estricto de RLS porque la política actual afecta a toda la tabla,
-- pero como precaución aseguramos que siga vigente:
DROP POLICY IF EXISTS "Lectura de pedidos anon" ON pedidos;
CREATE POLICY "Lectura de pedidos anon" ON pedidos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Actualización de pedidos anon" ON pedidos;
CREATE POLICY "Actualización de pedidos anon" ON pedidos FOR UPDATE TO anon USING (true);

COMMIT;
