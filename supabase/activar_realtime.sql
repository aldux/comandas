-- Activar Realtime para las tablas necesarias
BEGIN;
  -- supabase_realtime es una publicacion especial de Supabase
  -- Debemos asegurarnos de que las tablas estén en ella para poder escucharlas
  ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
  ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
  ALTER PUBLICATION supabase_realtime ADD TABLE cola_impresion;
COMMIT;
