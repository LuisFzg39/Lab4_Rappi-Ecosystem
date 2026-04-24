-- =====================================================
-- MIGRACIÓN: Lab 4 - Columnas GEOGRAPHY(POINT, 4326)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Paso 1: Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Paso 2: Agregar nuevas columnas GEOGRAPHY
ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_geo GEOGRAPHY(POINT, 4326);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_position GEOGRAPHY(POINT, 4326);

-- Paso 3: Migrar datos existentes
UPDATE orders
SET destination_geo = ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)
WHERE destination_lat IS NOT NULL AND destination_lng IS NOT NULL;

UPDATE orders
SET delivery_position = ST_SetSRID(ST_MakePoint(delivery_lng, delivery_lat), 4326)
WHERE delivery_lat IS NOT NULL AND delivery_lng IS NOT NULL;

-- Paso 4: Eliminar columnas viejas
ALTER TABLE orders DROP COLUMN IF EXISTS destination_lat;
ALTER TABLE orders DROP COLUMN IF EXISTS destination_lng;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_lat;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_lng;

-- Paso 5: Renombrar destination_geo a destination
ALTER TABLE orders RENAME COLUMN destination_geo TO destination;

-- Paso 6: Hacer destination NOT NULL
-- NOTA: Si hay filas sin destination, eliminarlas primero:
-- DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE destination IS NULL);
-- DELETE FROM orders WHERE destination IS NULL;
ALTER TABLE orders ALTER COLUMN destination SET NOT NULL;

-- =====================================================
-- FUNCIONES RPC para el backend
-- =====================================================

-- Función: Insertar un pedido con destino geográfico
CREATE OR REPLACE FUNCTION insert_order_with_geo(
  p_consumer_id UUID,
  p_store_id UUID,
  p_status TEXT,
  p_destination_lng DOUBLE PRECISION,
  p_destination_lat DOUBLE PRECISION
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO orders (consumer_id, store_id, status, destination)
  VALUES (
    p_consumer_id,
    p_store_id,
    p_status,
    ST_SetSRID(ST_MakePoint(p_destination_lng, p_destination_lat), 4326)
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar posición del repartidor
CREATE OR REPLACE FUNCTION update_delivery_position(
  p_order_id UUID,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION
)
RETURNS VOID AS $$
  UPDATE orders
  SET delivery_position = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  WHERE id = p_order_id;
$$ LANGUAGE sql;

-- Función: Verificar si el repartidor llegó (< 5 metros)
CREATE OR REPLACE FUNCTION check_delivery_arrival(p_order_id UUID)
RETURNS TABLE(is_arrived BOOLEAN, distance_meters DOUBLE PRECISION) AS $$
  SELECT
    ST_DWithin(delivery_position, destination, 5) AS is_arrived,
    ST_Distance(delivery_position, destination) AS distance_meters
  FROM orders
  WHERE id = p_order_id
    AND delivery_position IS NOT NULL;
$$ LANGUAGE sql;

-- Función: Obtener coordenadas lat/lng de un pedido
CREATE OR REPLACE FUNCTION get_order_geo(p_order_id UUID)
RETURNS TABLE(
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION
) AS $$
  SELECT
    ST_Y(destination::geometry) AS destination_lat,
    ST_X(destination::geometry) AS destination_lng,
    ST_Y(delivery_position::geometry) AS delivery_lat,
    ST_X(delivery_position::geometry) AS delivery_lng
  FROM orders
  WHERE id = p_order_id;
$$ LANGUAGE sql;
