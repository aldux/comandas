-- Initial database schema for ComandasApp

-- Roles Type
CREATE TYPE empleado_rol AS ENUM ('mozo', 'cajero', 'admin');
CREATE TYPE mesa_estado AS ENUM ('libre', 'ocupada');
CREATE TYPE pedido_estado AS ENUM ('preparando', 'listo', 'cobrado', 'anulado');
CREATE TYPE impresion_estado AS ENUM ('pendiente', 'impreso');

-- Table: empleados
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    pin TEXT NOT NULL CHECK (length(pin) = 4 AND pin ~ '^[0-9]{4}$'),
    rol empleado_rol NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: mesas
CREATE TABLE mesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER NOT NULL UNIQUE,
    estado mesa_estado DEFAULT 'libre',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    categoria TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TYPE metodo_pago_tipo AS ENUM ('efectivo', 'tarjeta_tpv', 'bizum');

-- Table: pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    mozo_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
    estado pedido_estado DEFAULT 'preparando',
    total NUMERIC(10, 2) DEFAULT 0,
    metodo_pago metodo_pago_tipo,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: pedido_items
CREATE TABLE pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: cola_impresion
CREATE TABLE cola_impresion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    ticket_texto TEXT NOT NULL,
    estado impresion_estado DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger to update 'updated_at' on pedidos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedidos_modtime
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- SEED DATA (Prueba)
INSERT INTO empleados (nombre, pin, rol) VALUES
    ('Juan Mozo', '1234', 'mozo'),
    ('Ana Moza', '5678', 'mozo'),
    ('Carlos Cajero', '1111', 'cajero'),
    ('Admin', '9999', 'admin');

INSERT INTO mesas (numero) VALUES
    (1), (2), (3), (4), (5);

INSERT INTO productos (nombre, precio, categoria) VALUES
    ('Hamburguesa Clásica', 8.50, 'Hamburguesas'),
    ('Hamburguesa Doble', 11.00, 'Hamburguesas'),
    ('Papas Fritas', 3.50, 'Acompañamientos'),
    ('Refresco Cola', 2.00, 'Bebidas');
