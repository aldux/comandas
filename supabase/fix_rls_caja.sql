BEGIN;

-- Permitir a anon actualizar pedidos (necesario para cobrar y cambiar de estado desde el server action sin service_role)
DROP POLICY IF EXISTS "Actualización de pedidos anon" ON pedidos;
CREATE POLICY "Actualización de pedidos anon" ON pedidos FOR UPDATE TO anon USING (true);

-- Permitir a anon actualizar mesas (necesario para liberar la mesa al cobrar)
DROP POLICY IF EXISTS "Actualización de mesas anon" ON mesas;
CREATE POLICY "Actualización de mesas anon" ON mesas FOR UPDATE TO anon USING (true);

COMMIT;
