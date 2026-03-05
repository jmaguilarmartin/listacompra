-- ============================================
-- SCRIPT SQL PARA SUPABASE - LISTA DE COMPRA INTELIGENTE
-- ============================================
-- Ejecuta este script completo en SQL Editor de Supabase
-- después de crear tu proyecto
-- ============================================

-- ============================================
-- TABLA: PRODUCTOS
-- ============================================
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(100),
  lugar_compra_habitual VARCHAR(100),
  frecuencia_manual INTEGER, -- días entre compras (NULL = automático)
  frecuencia_calculada DECIMAL(5,2), -- calculada del histórico
  ultima_compra DATE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  usuario_creador VARCHAR(100),
  notas TEXT,
  
  -- Índices para performance
  CONSTRAINT unique_producto UNIQUE(nombre, lugar_compra_habitual)
);

CREATE INDEX idx_productos_activo ON productos(activo, ultima_compra);
CREATE INDEX idx_productos_lugar ON productos(lugar_compra_habitual);

-- ============================================
-- TABLA: LISTA_PENDIENTE
-- ============================================
CREATE TABLE lista_pendiente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad VARCHAR(50) DEFAULT '1',
  usuario_añadido VARCHAR(100),
  fecha_añadido TIMESTAMP DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, comprado, ignorado
  semana_compra INTEGER,
  año_compra INTEGER,
  notas_compra TEXT,
  precio_compra DECIMAL(8,2),
  lugar_compra_real VARCHAR(100)
);

CREATE INDEX idx_lista_estado ON lista_pendiente(estado, semana_compra, año_compra);
CREATE INDEX idx_lista_producto ON lista_pendiente(producto_id, fecha_añadido);

-- ============================================
-- TABLA: HISTORICO_COMPRAS
-- ============================================
CREATE TABLE historico_compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  fecha_compra DATE NOT NULL,
  precio DECIMAL(8,2),
  cantidad VARCHAR(50),
  lugar_compra VARCHAR(100),
  usuario_compro VARCHAR(100),
  semana_compra INTEGER,
  año_compra INTEGER
);

CREATE INDEX idx_historico_producto ON historico_compras(producto_id, fecha_compra DESC);
CREATE INDEX idx_historico_fecha ON historico_compras(fecha_compra DESC);

-- ============================================
-- TABLA: USUARIOS (opcional pero recomendado)
-- ============================================
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(200) UNIQUE NOT NULL,
  nombre VARCHAR(100),
  lugares_favoritos TEXT[], -- array de lugares preferidos
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: SUGERENCIAS (cache de cálculos)
-- ============================================
CREATE TABLE sugerencias_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  fecha_calculo DATE DEFAULT CURRENT_DATE,
  prioridad INTEGER, -- 1-5
  dias_desde_ultima INTEGER,
  siguiente_compra_estimada DATE,
  
  CONSTRAINT unique_sugerencia_dia UNIQUE(producto_id, fecha_calculo)
);

CREATE INDEX idx_sugerencias_fecha ON sugerencias_cache(fecha_calculo, prioridad DESC);

-- ============================================
-- FUNCIÓN: Calcular semana del año
-- ============================================
CREATE OR REPLACE FUNCTION get_semana_año(fecha DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(WEEK FROM fecha);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Actualizar última_compra en productos
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_ultima_compra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET ultima_compra = NEW.fecha_compra
  WHERE id = NEW.producto_id
    AND (ultima_compra IS NULL OR ultima_compra < NEW.fecha_compra);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ultima_compra
AFTER INSERT ON historico_compras
FOR EACH ROW
EXECUTE FUNCTION actualizar_ultima_compra();

-- ============================================
-- TRIGGER: Añadir a histórico cuando se marca como comprado
-- ============================================
CREATE OR REPLACE FUNCTION mover_a_historico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'comprado' AND OLD.estado = 'pendiente' THEN
    INSERT INTO historico_compras (
      producto_id,
      fecha_compra,
      precio,
      cantidad,
      lugar_compra,
      usuario_compro,
      semana_compra,
      año_compra
    )
    VALUES (
      NEW.producto_id,
      CURRENT_DATE,
      NEW.precio_compra,
      NEW.cantidad,
      NEW.lugar_compra_real,
      NEW.usuario_añadido,
      get_semana_año(CURRENT_DATE),
      EXTRACT(YEAR FROM CURRENT_DATE)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mover_a_historico
AFTER UPDATE ON lista_pendiente
FOR EACH ROW
EXECUTE FUNCTION mover_a_historico();

-- ============================================
-- FUNCIÓN: Calcular frecuencia de un producto
-- ============================================
CREATE OR REPLACE FUNCTION calcular_frecuencia_producto(p_producto_id UUID)
RETURNS TABLE(
  frecuencia_dias DECIMAL,
  es_regular BOOLEAN,
  compras_analizadas INTEGER
) AS $$
DECLARE
  intervalos INTEGER[];
  intervalo INTEGER;
  frecuencia DECIMAL;
  desviacion DECIMAL;
BEGIN
  -- Obtener intervalos entre compras consecutivas
  SELECT ARRAY_AGG(dias_intervalo)
  INTO intervalos
  FROM (
    SELECT 
      fecha_compra - LAG(fecha_compra) OVER (ORDER BY fecha_compra DESC) as dias_intervalo
    FROM historico_compras
    WHERE producto_id = p_producto_id
    ORDER BY fecha_compra DESC
    LIMIT 10
  ) sub
  WHERE dias_intervalo IS NOT NULL;
  
  -- Si no hay suficientes datos
  IF intervalos IS NULL OR array_length(intervalos, 1) < 2 THEN
    RETURN QUERY SELECT NULL::DECIMAL, FALSE, 0;
    RETURN;
  END IF;
  
  -- Calcular mediana (más robusto que promedio)
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY val)
  INTO frecuencia
  FROM unnest(intervalos) as val;
  
  -- Calcular desviación estándar
  SELECT stddev(val)
  INTO desviacion
  FROM unnest(intervalos) as val;
  
  -- Determinar si es regular (desviación < 50% de frecuencia)
  RETURN QUERY SELECT 
    frecuencia,
    CASE WHEN desviacion / frecuencia < 0.5 THEN TRUE ELSE FALSE END,
    array_length(intervalos, 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Obtener sugerencias inteligentes
-- ============================================
CREATE OR REPLACE FUNCTION obtener_sugerencias()
RETURNS TABLE(
  producto_id UUID,
  nombre VARCHAR,
  categoria VARCHAR,
  lugar_compra VARCHAR,
  prioridad INTEGER,
  dias_desde_ultima INTEGER,
  frecuencia_usada DECIMAL,
  ultima_compra DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH frecuencias AS (
    SELECT 
      p.id,
      p.nombre,
      p.categoria,
      p.lugar_compra_habitual,
      p.ultima_compra,
      COALESCE(p.frecuencia_manual, p.frecuencia_calculada) as frecuencia,
      CURRENT_DATE - p.ultima_compra as dias_desde
    FROM productos p
    WHERE p.activo = TRUE
      AND p.ultima_compra IS NOT NULL
      AND COALESCE(p.frecuencia_manual, p.frecuencia_calculada) IS NOT NULL
  ),
  con_prioridad AS (
    SELECT 
      *,
      CASE 
        WHEN dias_desde >= frecuencia * 1.2 THEN 5  -- MUY urgente
        WHEN dias_desde >= frecuencia THEN 4        -- Urgente
        WHEN dias_desde >= frecuencia * 0.9 THEN 3  -- Normal
        ELSE 0
      END as calc_prioridad
    FROM frecuencias
  )
  SELECT 
    id,
    nombre,
    categoria,
    lugar_compra_habitual,
    calc_prioridad,
    dias_desde,
    frecuencia,
    ultima_compra
  FROM con_prioridad
  WHERE calc_prioridad >= 3  -- Solo sugerir si prioridad >= 3
  ORDER BY calc_prioridad DESC, dias_desde DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_pendiente ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugerencias_cache ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (todos los usuarios autenticados pueden leer/escribir)
-- IMPORTANTE: En producción, deberías hacerlas más restrictivas según usuario
CREATE POLICY "Permitir acceso público a productos" ON productos
  FOR ALL USING (true);

CREATE POLICY "Permitir acceso público a lista_pendiente" ON lista_pendiente
  FOR ALL USING (true);

CREATE POLICY "Permitir acceso público a historico_compras" ON historico_compras
  FOR ALL USING (true);

CREATE POLICY "Permitir acceso público a usuarios" ON usuarios
  FOR ALL USING (true);

CREATE POLICY "Permitir acceso público a sugerencias" ON sugerencias_cache
  FOR ALL USING (true);

-- ============================================
-- DATOS DE EJEMPLO (para testing)
-- ============================================
INSERT INTO productos (nombre, categoria, lugar_compra_habitual, frecuencia_manual, activo) VALUES
('Leche', 'Lácteos', 'Mercadona', 7, TRUE),
('Pan de molde', 'Panadería', 'Mercadona', 7, TRUE),
('Tomates', 'Frutas y Verduras', 'Frutería El Sol', NULL, TRUE),
('Pollo', 'Carnes', 'Carnicería Pérez', 14, TRUE),
('Detergente', 'Limpieza', 'Mercadona', 30, TRUE),
('Papel higiénico', 'Hogar', 'Mercadona', 21, TRUE),
('Huevos', 'Lácteos', 'Mercadona', 10, TRUE),
('Arroz', 'Despensa', 'Mercadona', 45, TRUE),
('Aceite de oliva', 'Despensa', 'Mercadona', 60, TRUE),
('Pasta', 'Despensa', 'Mercadona', 30, TRUE);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Puedes ejecutar estas consultas para verificar que todo funciona:

-- Ver todos los productos
-- SELECT * FROM productos;

-- Ver la lista pendiente (estará vacía al principio)
-- SELECT * FROM lista_pendiente;

-- Ver el histórico (estará vacío al principio)
-- SELECT * FROM historico_compras;

-- Probar la función de sugerencias (devolverá vacío sin histórico)
-- SELECT * FROM obtener_sugerencias();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- ¡Configuración completada!
-- Ahora puedes usar la aplicación
