-- =========================================================================
-- RPC: crear_pedido_completo
-- =========================================================================
-- Función transaccional atómica para agrupar la creación del pedido, 
-- la inserción de los ítems y la generación del ticket de impresión.
-- Si falla alguna de las 3 partes, toda la transacción hace ROLLBACK.

CREATE OR REPLACE FUNCTION crear_pedido_completo(payload JSONB)
RETURNS UUID AS $$
DECLARE
    v_pedido_id UUID;
    v_item JSONB;
    v_ticket_texto TEXT;
    v_notas_generales TEXT;
    v_total NUMERIC;
BEGIN
    -- 1. Insertar el pedido principal
    INSERT INTO pedidos (mesa_id, mozo_id, estado, total, tipo_pedido)
    VALUES (
        NULLIF((payload->>'mesa_id'), '')::UUID,
        NULLIF((payload->>'mozo_id'), '')::UUID,
        'preparando',
        (payload->>'total')::NUMERIC,
        COALESCE(payload->>'tipo_pedido', 'local')
    ) RETURNING id INTO v_pedido_id;

    -- Cambiar estado de la mesa a ocupada solo si hay mesa
    IF NULLIF(payload->>'mesa_id', '') IS NOT NULL THEN
        UPDATE mesas SET estado = 'ocupada' WHERE id = (payload->>'mesa_id')::UUID;
    END IF;

    -- 2. Recorrer e Insertar los ítems del pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, notas)
        VALUES (
            v_pedido_id,
            (v_item->>'producto_id')::UUID,
            (v_item->>'cantidad')::INTEGER,
            (v_item->>'precio_unitario')::NUMERIC,
            v_item->>'notas'
        );
    END LOOP;

    -- 3. Generar Ticket de Impresión para la cocina
    v_ticket_texto := '--- NUEVO PEDIDO ---' || E'\n';
    IF COALESCE(payload->>'tipo_pedido', 'local') = 'delivery' THEN
        v_ticket_texto := v_ticket_texto || 'TIPO: 🛵 DELIVERY | CAJERO: ' || (payload->>'mozo_nombre') || E'\n';
    ELSE
        v_ticket_texto := v_ticket_texto || 'MESA: ' || (payload->>'mesa_numero') || ' | MOZO: ' || (payload->>'mozo_nombre') || E'\n';
    END IF;
    v_ticket_texto := v_ticket_texto || '--------------------' || E'\n';

    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_ticket_texto := v_ticket_texto || (v_item->>'cantidad') || 'x ' || (v_item->>'nombre') || ' ($' || (v_item->>'precio_unitario') || ')' || E'\n';
        IF v_item->>'notas' IS NOT NULL AND (v_item->>'notas') != '' THEN
            v_ticket_texto := v_ticket_texto || '   *Nota: ' || (v_item->>'notas') || '*' || E'\n';
        END IF;
    END LOOP;

    v_ticket_texto := v_ticket_texto || '--------------------' || E'\n';
    
    v_notas_generales := payload->>'notas_generales';
    IF v_notas_generales IS NOT NULL AND v_notas_generales != '' THEN
        v_ticket_texto := v_ticket_texto || 'NOTAS GENERALES:' || E'\n' || v_notas_generales || E'\n';
        v_ticket_texto := v_ticket_texto || '--------------------' || E'\n';
    END IF;

    v_total := (payload->>'total')::NUMERIC;
    v_ticket_texto := v_ticket_texto || 'TOTAL: $' || v_total || E'\n';

    -- Insertar en la cola de impresión
    INSERT INTO cola_impresion (pedido_id, ticket_texto, estado)
    VALUES (v_pedido_id, v_ticket_texto, 'pendiente');

    -- Retornar el ID del pedido creado (esto finaliza y hace COMMIT)
    RETURN v_pedido_id;

EXCEPTION WHEN OTHERS THEN
    -- En caso de error, PostgreSQL hace ROLLBACK automáticamente de la transacción.
    -- Lanzamos la excepción para que el cliente (Next.js) reciba el error.
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
