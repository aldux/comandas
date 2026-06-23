BEGIN;

-- 1. Agregar el nuevo estado 'finalizado' al ENUM de pedidos
ALTER TYPE pedido_estado ADD VALUE IF NOT EXISTS 'finalizado';

-- 2. Permitir a la Caja actualizar pedidos y liberar mesas
DROP POLICY IF EXISTS "Actualización de pedidos anon" ON pedidos;
CREATE POLICY "Actualización de pedidos anon" ON pedidos FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Actualización de mesas anon" ON mesas;
CREATE POLICY "Actualización de mesas anon" ON mesas FOR UPDATE TO anon USING (true);

-- 3. Permitir a la Caja agregar y eliminar impresoras
DROP POLICY IF EXISTS "Insertar impresoras por auth" ON impresoras;
CREATE POLICY "Insertar impresoras anon" ON impresoras FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar impresoras por auth" ON impresoras;
CREATE POLICY "Actualizar impresoras anon" ON impresoras FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Eliminar impresoras por auth" ON impresoras;
CREATE POLICY "Eliminar impresoras anon" ON impresoras FOR DELETE TO anon USING (true);

COMMIT;
