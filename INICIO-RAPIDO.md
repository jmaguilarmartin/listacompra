# 🚀 GUÍA DE INICIO RÁPIDO

## ⏱️ 5 Minutos para Empezar

### 1️⃣ Configurar Supabase (2 minutos)

1. Ve a https://supabase.com y crea una cuenta gratis
2. Haz clic en "New Project"
3. Dale un nombre: "lista-compra"
4. Anota tu contraseña de base de datos
5. Espera 1-2 minutos a que se cree el proyecto

6. Ve a **SQL Editor** (icono a la izquierda)
7. Haz clic en **+ New Query**
8. Copia TODO el contenido del archivo `supabase-setup.sql`
9. Pégalo en el editor y haz clic en **RUN**
10. Verás "Success. No rows returned" - ¡Perfecto!

11. Ve a **Settings > API** (icono de engranaje)
12. Copia estos dos valores:
    - **Project URL**: https://xxxxx.supabase.co
    - **anon public**: eyJhbGc...

### 2️⃣ Instalar la Aplicación (2 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de configuración
cp .env.example .env.local

# 3. Editar .env.local con tus credenciales de Supabase
# (usa nano, vim, o tu editor favorito)
nano .env.local
```

Contenido de `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Guarda el archivo (Ctrl+O, Enter, Ctrl+X en nano)

### 3️⃣ Ejecutar la Aplicación (1 minuto)

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

¡Listo! 🎉

---

## 🎯 Primeros Pasos

### Crear tu primer producto

1. Ve a la pestaña **Productos**
2. Haz clic en **Nuevo Producto**
3. Rellena:
   - Nombre: "Leche"
   - Categoría: "Lácteos"
   - Lugar: "Mercadona"
   - Frecuencia: 7 (compra semanal)
4. Haz clic en **Crear Producto**

### Crear tu primera lista

1. Ve a la pestaña **Lista**
2. Haz clic en **Añadir Producto**
3. Selecciona "Leche"
4. Cantidad: "1"
5. Haz clic en **Añadir a Lista**

### Marcar como comprado

1. Haz clic en el checkbox junto a "Leche"
2. (Opcional) Añade el precio: "1.50"
3. Haz clic en **Confirmar**

¡El producto se mueve automáticamente al histórico!

### Ver sugerencias inteligentes

Después de unas cuantas compras, la app empezará a sugerirte productos automáticamente basándose en:
- Cuántos días han pasado desde la última compra
- Tu patrón histórico de compra
- La frecuencia calculada

---

## 🔧 Solución de Problemas

### "No se puede conectar a Supabase"
✅ Verifica que copiaste bien la URL y la API key en `.env.local`
✅ Asegúrate de que las variables empiezan con `VITE_`
✅ Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

### "Error en la base de datos"
✅ Verifica que ejecutaste el script SQL completo en Supabase
✅ Revisa que no hubo errores al ejecutar el script
✅ Ve a **Table Editor** en Supabase y verifica que existen las tablas

### No aparecen sugerencias
✅ Necesitas al menos 2-3 compras de cada producto para generar sugerencias
✅ Las sugerencias solo aparecen cuando toca volver a comprar un producto

---

## 📱 Instalar como App Móvil

### En Android (Chrome)
1. Abre la app en Chrome
2. Menú (⋮) > "Añadir a pantalla de inicio"
3. Dale un nombre y confirma

### En iOS (Safari)
1. Abre la app en Safari
2. Botón de compartir (□↑)
3. "Añadir a pantalla de inicio"
4. Dale un nombre y confirma

---

## 🚀 Desplegar en Internet (Opcional)

### Opción 1: Netlify (Gratis, Más Fácil)

1. Ve a https://netlify.com y crea una cuenta
2. Arrastra la carpeta `dist/` después de ejecutar `npm run build`
3. Configura las variables de entorno en Site Settings > Environment

### Opción 2: Vercel (Gratis, También Fácil)

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones y configura las variables de entorno.

---

## 📚 Siguiente Paso

Lee el `README.md` completo para:
- Entender el sistema de sugerencias inteligentes
- Personalizar colores y temas
- Configurar usuarios múltiples
- Ver todas las características avanzadas

---

## 💡 Tips Útiles

1. **Añade frecuencias manuales** al principio para productos regulares (leche, pan, etc.)
2. **Deja que la app calcule automáticamente** frecuencias para productos irregulares
3. **Usa categorías** para organizar mejor tus productos
4. **Agrupa por lugar** cuando vayas de compras para no olvidar nada

---

**¿Necesitas ayuda?** Revisa el README.md o la documentación de Supabase
