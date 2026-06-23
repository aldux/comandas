-- =========================================================================
-- Estructura de Datos y Políticas RLS para 'impresoras'
-- =========================================================================

-- 1. Crear la tabla de impresoras
CREATE TABLE impresoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    interfaz TEXT NOT NULL,  -- e.g., 'tcp://192.168.1.100' o 'printer:POS-58'
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Activar Seguridad a Nivel de Fila (RLS)
ALTER TABLE impresoras ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- El print-worker (mediante la clave anon/service_role o pública) necesita leer las impresoras
CREATE POLICY "Lectura de impresoras publica" ON impresoras FOR SELECT USING (true);

-- Solo los usuarios autenticados (el perfil de Caja) pueden agregar, modificar o eliminar
CREATE POLICY "Insertar impresoras por auth" ON impresoras FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar impresoras por auth" ON impresoras FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Eliminar impresoras por auth" ON impresoras FOR DELETE TO authenticated USING (true);
