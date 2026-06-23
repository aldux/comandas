BEGIN;

-- La clave del problema: anon no tenía permiso de SELECT en pedidos, 
-- por lo que el UPDATE encontraba "0 filas" y fallaba silenciosamente.
DROP POLICY IF EXISTS "Lectura de pedidos anon" ON pedidos;
CREATE POLICY "Lectura de pedidos anon" ON pedidos FOR SELECT TO anon USING (true);

-- Asegurar también lectura de items
DROP POLICY IF EXISTS "Lectura de items anon" ON pedido_items;
CREATE POLICY "Lectura de items anon" ON pedido_items FOR SELECT TO anon USING (true);

COMMIT;
