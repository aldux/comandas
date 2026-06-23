BEGIN;
ALTER TYPE pedido_estado ADD VALUE IF NOT EXISTS 'finalizado';
ALTER TYPE pedido_estado ADD VALUE IF NOT EXISTS 'archivado';
COMMIT;
