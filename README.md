# 🛒 Lista de Compra Inteligente

Sistema de gestión de lista de compra compartida con sugerencias inteligentes basadas en histórico.

## 🎯 Características

- ✅ **Lista de Compra Colaborativa**: Comparte tu lista con otros usuarios
- 🤖 **Sugerencias Inteligentes**: Basadas en tu patrón de compras histórico
- 📊 **Estadísticas**: Análisis de gastos y productos más comprados
- 🏪 **Organización por Lugares**: Agrupa productos por supermercado
- 📱 **PWA**: Instalable como aplicación móvil
- 🔄 **Sincronización en Tiempo Real**: Cambios instantáneos entre usuarios

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (gratis)

### 1. Configurar Supabase

1. Crea una cuenta en [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el script completo de base de datos que se encuentra más abajo
4. Copia tu **Project URL** y **anon public key** desde **Settings > API**

### 2. Instalar el Proyecto

```bash
# Clonar o descargar el proyecto
cd lista-compra

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales de Supabase
nano .env.local
```

Contenido de `.env.local`:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Script SQL para Supabase

Ejecuta este script completo en **SQL Editor** de Supabase:

```sql
-- ============================================
-- TABLA: PRODUCTOS
-- ============================================
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(100),
  lugar_compra_habitual VARCHAR(100),
  frecuencia_manual INTEGER,
  frecuencia_calculada DECIMAL(5,2),
  ultima_compra DATE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  usuario_creador VARCHAR(100),
  notas TEXT,
  
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
  usuario_añadio VARCHAR(100),
  fecha_añadido TIMESTAMP DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'pendiente',
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
      NEW.usuario_añadio,
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
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_pendiente ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_compras ENABLE ROW LEVEL SECURITY;

-- Políticas (permitir acceso a todos los usuarios autenticados)
CREATE POLICY "Permitir lectura" ON productos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura" ON productos FOR ALL USING (true);

CREATE POLICY "Permitir lectura" ON lista_pendiente FOR SELECT USING (true);
CREATE POLICY "Permitir escritura" ON lista_pendiente FOR ALL USING (true);

CREATE POLICY "Permitir lectura" ON historico_compras FOR SELECT USING (true);
CREATE POLICY "Permitir escritura" ON historico_compras FOR ALL USING (true);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================
INSERT INTO productos (nombre, categoria, lugar_compra_habitual, frecuencia_manual, activo) VALUES
('Leche', 'Lácteos', 'Mercadona', 7, TRUE),
('Pan de molde', 'Panadería', 'Mercadona', 7, TRUE),
('Tomates', 'Frutas y Verduras', 'Frutería El Sol', NULL, TRUE),
('Pollo', 'Carnes', 'Carnicería Pérez', 14, TRUE),
('Detergente', 'Limpieza', 'Mercadona', 30, TRUE),
('Papel higiénico', 'Hogar', 'Mercadona', 21, TRUE);
```

## 📖 Uso

### 1. Gestionar Productos

- Ve a la pestaña **Productos**
- Haz clic en **Nuevo Producto**
- Rellena la información:
  - **Nombre**: Nombre del producto
  - **Categoría**: Opcional (Lácteos, Carnes, etc.)
  - **Lugar de compra**: Dónde lo compras habitualmente
  - **Frecuencia**: Cada cuántos días lo compras (opcional, se calcula automáticamente)

### 2. Crear Lista de Compra

- Ve a la pestaña **Lista**
- Haz clic en **Añadir Producto**
- Selecciona el producto y la cantidad
- Verás **Sugerencias Inteligentes** basadas en tu histórico

### 3. Durante la Compra

- Marca productos como comprados haciendo clic en el checkbox
- Opcionalmente añade el precio pagado
- Los productos se moverán automáticamente al histórico

### 4. Ver Estadísticas

- Ve a la pestaña **Estadísticas**
- Analiza tus patrones de compra
- Ve los productos más comprados
- Revisa tus gastos totales

## 🧠 Sistema de Sugerencias Inteligentes

El sistema analiza tu histórico para:

1. **Calcular frecuencias**: Cuántos días pasas entre compras de cada producto
2. **Detectar patrones**: Usa la mediana de intervalos (más robusto que promedio)
3. **Priorizar sugerencias**:
   - 🔴 **Muy urgente**: Pasado 120% del período normal
   - 🟠 **Urgente**: Cumplido el período normal
   - 🟡 **Normal**: Al 90% del período

## 🎨 Personalización

### Colores del Tema

Edita `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Personaliza tus colores aquí
        600: '#0ea5e9',
        700: '#0369a1',
      },
    },
  },
}
```

### Frecuencia de Sugerencias

Ajusta el umbral en `src/services/calculosService.ts`:

```typescript
// Sugerir si hemos llegado al 90% del período (puedes ajustar)
const umbral = frecuencia * 0.9
```

## 📱 Instalar como PWA

1. Abre la app en tu navegador móvil
2. Busca la opción "Añadir a pantalla de inicio"
3. La app se instalará como una aplicación nativa

## 🔧 Troubleshooting

### Error: "Faltan variables de entorno"
- Asegúrate de haber creado `.env.local`
- Verifica que las variables empiecen con `VITE_`

### No se muestran los datos
- Verifica que ejecutaste el script SQL en Supabase
- Revisa la consola del navegador para errores
- Comprueba que las políticas RLS estén configuradas

### Las sugerencias no funcionan
- Necesitas al menos 2 compras de cada producto
- Espera a que se calcule la frecuencia automática
- O establece frecuencia manual en cada producto

## 🚀 Deploy en Producción

### Netlify / Vercel

```bash
npm run build
# Sube la carpeta dist/
```

### Variables de entorno en producción
Configura las mismas variables de `.env.local` en tu plataforma de hosting

## 📝 Licencia

MIT License - Úsalo libremente para proyectos personales o comerciales

## 🤝 Contribuciones

¡Sugerencias y mejoras son bienvenidas!

---

**Desarrollado con ❤️ usando React + TypeScript + Supabase + Tailwind CSS**
