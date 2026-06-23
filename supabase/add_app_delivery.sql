BEGIN;
ALTER TYPE metodo_pago_tipo ADD VALUE IF NOT EXISTS 'app_delivery';
COMMIT;
