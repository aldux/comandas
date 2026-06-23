-- 1. Activar RLS en todas las tablas
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cola_impresion ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'mesas' y 'productos' (Catálogo Público)
-- Mozos (anon) y Caja (authenticated) pueden leer
CREATE POLICY "Lectura pública de mesas" ON mesas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de productos" ON productos FOR SELECT USING (true);
-- Solo Caja/Admin (authenticated) puede modificar
CREATE POLICY "Modificación de mesas por auth" ON mesas FOR ALL TO authenticated USING (true);
CREATE POLICY "Modificación de productos por auth" ON productos FOR ALL TO authenticated USING (true);

-- 3. Políticas para 'empleados' (Validación de PIN)
-- Permitir lectura para que el Server Action (anon) pueda buscar el PIN
CREATE POLICY "Lectura pública de empleados" ON empleados FOR SELECT USING (true);
CREATE POLICY "Modificación de empleados por auth" ON empleados FOR ALL TO authenticated USING (true);

-- 4. Políticas para 'pedidos' y 'pedido_items' (Transaccionalidad)
-- Mozos (anon) pueden hacer INSERT para crear el pedido. Caja (authenticated) puede ver y actualizar.
CREATE POLICY "Creación de pedidos pública" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de pedidos por auth" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actualización de pedidos por auth" ON pedidos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Creación de items pública" ON pedido_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de items por auth" ON pedido_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actualización de items por auth" ON pedido_items FOR UPDATE TO authenticated USING (true);

-- 5. Políticas para 'cola_impresion'
-- Mozos y Caja pueden insertar tickets
CREATE POLICY "Crear ticket de impresion" ON cola_impresion FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de impresion por auth" ON cola_impresion FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actualización de impresion por auth" ON cola_impresion FOR UPDATE TO authenticated USING (true);
