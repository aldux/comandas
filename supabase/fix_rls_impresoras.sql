BEGIN;

-- Permitir a anon insertar, actualizar y eliminar impresoras
DROP POLICY IF EXISTS "Insertar impresoras por auth" ON impresoras;
CREATE POLICY "Insertar impresoras anon" ON impresoras FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar impresoras por auth" ON impresoras;
CREATE POLICY "Actualizar impresoras anon" ON impresoras FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Eliminar impresoras por auth" ON impresoras;
CREATE POLICY "Eliminar impresoras anon" ON impresoras FOR DELETE TO anon USING (true);

COMMIT;
