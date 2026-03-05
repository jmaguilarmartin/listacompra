-- ============================================
-- ACTUALIZACIÓN: MÚLTIPLES LISTAS Y TEMPLATES
-- ============================================

-- 1. Crear tabla de listas
CREATE TABLE IF NOT EXISTS listas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  usuario_creador VARCHAR(100),
  es_template BOOLEAN DEFAULT false,
  icono VARCHAR(50),
  color VARCHAR(20),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Modificar tabla lista_pendiente para asociarla a una lista
-- IMPORTANTE: Primero crear una lista por defecto

-- Insertar lista por defecto
INSERT INTO listas (id, nombre, descripcion, usuario_creador, es_template, activa)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mi Lista', 'Lista principal de compras', 'Usuario', false, true)
ON CONFLICT DO NOTHING;

-- Añadir columna lista_id a tabla existente
ALTER TABLE lista_pendiente 
ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES listas(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- 3. Crear tabla de items de templates
CREATE TABLE IF NOT EXISTS template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES listas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad_sugerida VARCHAR(50) DEFAULT '1',
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, producto_id)
);

-- 4. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_lista_pendiente_lista_id ON lista_pendiente(lista_id);
CREATE INDEX IF NOT EXISTS idx_template_items_template ON template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_listas_usuario ON listas(usuario_creador);
CREATE INDEX IF NOT EXISTS idx_listas_activa ON listas(activa);
CREATE INDEX IF NOT EXISTS idx_listas_template ON listas(es_template);

-- 5. Trigger para actualizar updated_at en listas
CREATE OR REPLACE FUNCTION update_listas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listas_timestamp
BEFORE UPDATE ON listas
FOR EACH ROW
EXECUTE FUNCTION update_listas_timestamp();

-- 6. Insertar algunos templates de ejemplo
INSERT INTO listas (nombre, descripcion, usuario_creador, es_template, icono, color, activa)
VALUES 
  ('Compra Semanal', 'Template para la compra semanal estándar', 'Sistema', true, '🛒', '#0ea5e9', true),
  ('Lista Rápida', 'Productos básicos del día a día', 'Sistema', true, '⚡', '#f59e0b', true),
  ('Cena con Invitados', 'Todo lo necesario para una cena especial', 'Sistema', true, '🍽️', '#8b5cf6', true)
ON CONFLICT DO NOTHING;

-- 7. Función para aplicar template a una lista
CREATE OR REPLACE FUNCTION aplicar_template(
  p_template_id UUID,
  p_lista_destino_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  items_añadidos INTEGER := 0;
  template_item RECORD;
BEGIN
  -- Verificar que el template existe
  IF NOT EXISTS (SELECT 1 FROM listas WHERE id = p_template_id AND es_template = true) THEN
    RAISE EXCEPTION 'Template no encontrado';
  END IF;
  
  -- Copiar items del template a la lista destino
  FOR template_item IN 
    SELECT producto_id, cantidad_sugerida 
    FROM template_items 
    WHERE template_id = p_template_id
  LOOP
    -- Insertar solo si no existe ya en la lista destino
    INSERT INTO lista_pendiente (
      lista_id,
      producto_id,
      cantidad,
      usuario_añadido,
      estado,
      fecha_añadido
    )
    SELECT 
      p_lista_destino_id,
      template_item.producto_id,
      template_item.cantidad_sugerida,
      'Usuario',
      'pendiente',
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM lista_pendiente 
      WHERE lista_id = p_lista_destino_id 
        AND producto_id = template_item.producto_id 
        AND estado = 'pendiente'
    );
    
    IF FOUND THEN
      items_añadidos := items_añadidos + 1;
    END IF;
  END LOOP;
  
  RETURN items_añadidos;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para copiar lista completa
CREATE OR REPLACE FUNCTION duplicar_lista(
  p_lista_origen_id UUID,
  p_nuevo_nombre VARCHAR(100)
)
RETURNS UUID AS $$
DECLARE
  nueva_lista_id UUID;
BEGIN
  -- Crear nueva lista
  INSERT INTO listas (nombre, descripcion, usuario_creador, es_template, activa)
  SELECT 
    p_nuevo_nombre,
    'Copia de: ' || nombre,
    usuario_creador,
    false,
    true
  FROM listas WHERE id = p_lista_origen_id
  RETURNING id INTO nueva_lista_id;
  
  -- Copiar items
  INSERT INTO lista_pendiente (
    lista_id, producto_id, cantidad, usuario_añadido, estado
  )
  SELECT 
    nueva_lista_id,
    producto_id,
    cantidad,
    usuario_añadido,
    'pendiente'
  FROM lista_pendiente
  WHERE lista_id = p_lista_origen_id AND estado = 'pendiente';
  
  RETURN nueva_lista_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Vista para estadísticas de listas
CREATE OR REPLACE VIEW v_estadisticas_listas AS
SELECT 
  l.id,
  l.nombre,
  l.es_template,
  COUNT(CASE WHEN lp.estado = 'pendiente' THEN 1 END) as items_pendientes,
  COUNT(CASE WHEN lp.estado = 'comprado' THEN 1 END) as items_comprados,
  COUNT(lp.id) as total_items,
  l.updated_at,
  l.activa
FROM listas l
LEFT JOIN lista_pendiente lp ON l.id = lp.lista_id
WHERE l.activa = true
GROUP BY l.id, l.nombre, l.es_template, l.updated_at, l.activa;

-- 10. Políticas RLS (Row Level Security) básicas
ALTER TABLE listas ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a todos (ajustar según necesites autenticación)
CREATE POLICY "Permitir lectura listas" ON listas FOR SELECT USING (true);
CREATE POLICY "Permitir escritura listas" ON listas FOR ALL USING (true);
CREATE POLICY "Permitir lectura template_items" ON template_items FOR SELECT USING (true);
CREATE POLICY "Permitir escritura template_items" ON template_items FOR ALL USING (true);

-- 11. Comentarios para documentación
COMMENT ON TABLE listas IS 'Tabla de listas de compra y templates';
COMMENT ON TABLE template_items IS 'Items que componen un template de lista';
COMMENT ON COLUMN listas.es_template IS 'true si es un template reutilizable, false si es lista normal';
COMMENT ON COLUMN listas.icono IS 'Emoji o nombre de icono para identificar la lista';
COMMENT ON COLUMN listas.color IS 'Color en formato hex para la UI';

-- ============================================
-- FIN DE LA ACTUALIZACIÓN
-- ============================================

-- Verificación: Mostrar listas creadas
SELECT 
  id,
  nombre,
  CASE WHEN es_template THEN 'Template' ELSE 'Lista' END as tipo,
  activa
FROM listas
ORDER BY es_template DESC, nombre;
