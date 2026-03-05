# 📱 GUÍA COMPLETA PWA - LISTA DE COMPRA

## ✅ Archivos PWA Ya Creados

Tu aplicación ya incluye todos los archivos necesarios para funcionar como PWA:

```
✅ public/manifest.json          - Configuración de la PWA
✅ public/service-worker.js      - Cache y funcionamiento offline
✅ public/offline.html           - Página para cuando no hay conexión
✅ index.html (actualizado)      - Registro del service worker
```

## 🎯 QUÉ ES UNA PWA

Una **Progressive Web App** es una aplicación web que:
- ✅ Se puede **instalar** como app nativa (sin tienda)
- ✅ Funciona **offline** (sin internet)
- ✅ Tiene **notificaciones push** (opcional)
- ✅ Se actualiza **automáticamente**
- ✅ Es **rápida** (usa caché inteligente)

---

## 🚀 PASO A PASO: ACTIVAR LA PWA

### 1️⃣ Generar Iconos (REQUERIDO)

Los iconos son **obligatorios** para instalar la PWA. Tienes 3 opciones:

#### Opción A: Generador Online (Más Fácil - 2 min)
1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube un logo cuadrado (512x512 mínimo)
3. Descarga el ZIP
4. Copia todos los `icon-*.png` a la carpeta `public/`

#### Opción B: Placeholders Temporales (Para probar - 1 min)
```bash
cd public

# Windows (PowerShell):
curl -o icon-72.png "https://via.placeholder.com/72/0ea5e9/FFFFFF?text=LC"
curl -o icon-96.png "https://via.placeholder.com/96/0ea5e9/FFFFFF?text=LC"
curl -o icon-128.png "https://via.placeholder.com/128/0ea5e9/FFFFFF?text=LC"
curl -o icon-144.png "https://via.placeholder.com/144/0ea5e9/FFFFFF?text=LC"
curl -o icon-152.png "https://via.placeholder.com/152/0ea5e9/FFFFFF?text=LC"
curl -o icon-192.png "https://via.placeholder.com/192/0ea5e9/FFFFFF?text=LC"
curl -o icon-384.png "https://via.placeholder.com/384/0ea5e9/FFFFFF?text=LC"
curl -o icon-512.png "https://via.placeholder.com/512/0ea5e9/FFFFFF?text=LC"

# Mac/Linux:
# (Mismo comando que arriba)
```

#### Opción C: Manual (Profesional)
Lee el archivo `GENERAR-ICONOS.md` para más detalles.

### 2️⃣ Verificar que Funciona (Desarrollo)

```bash
# 1. Ejecutar la app
npm run dev

# 2. Abrir navegador en:
http://localhost:3000

# 3. Abrir DevTools (F12)
# 4. Ir a "Application" > "Manifest"
# 5. Verificar que aparezcan los iconos
# 6. Ir a "Service Workers"
# 7. Verificar que esté registrado y activo
```

### 3️⃣ Compilar para Producción

```bash
# Crear build optimizado
npm run build

# Previsualizar (simula producción)
npm run preview
```

**IMPORTANTE**: El service worker solo funciona en:
- ✅ `https://` (producción)
- ✅ `localhost` (desarrollo)
- ❌ NO funciona en HTTP sin HTTPS

---

## 📱 INSTALAR LA PWA

### En Android (Chrome)

1. Abre la app en Chrome
2. Busca el mensaje "Agregar a pantalla de inicio"
3. O ve a Menú (⋮) > "Instalar aplicación"
4. Confirma

**Características en Android:**
- ✅ Icono en el launcher
- ✅ Pantalla de bienvenida
- ✅ Funciona sin barra de navegador
- ✅ Funciona offline

### En iPhone/iPad (Safari)

1. Abre la app en Safari
2. Toca el botón "Compartir" (□↑)
3. Desplázate y toca "Añadir a pantalla de inicio"
4. Personaliza el nombre
5. Toca "Añadir"

**Limitaciones en iOS:**
- ⚠️ El service worker tiene limitaciones
- ⚠️ No hay notificaciones push
- ✅ Funciona como app standalone
- ✅ Icono en pantalla de inicio

### En Desktop (Chrome/Edge)

1. Abre la app en Chrome o Edge
2. Busca el icono de instalación en la barra de direcciones (+)
3. O ve a Menú (⋮) > "Instalar Lista de Compra..."
4. Confirma

**Características en Desktop:**
- ✅ Ventana independiente
- ✅ Atajo en el escritorio
- ✅ En el menú de aplicaciones
- ✅ Funciona offline

---

## 🔄 ESTRATEGIA DE CACHÉ

La app usa una estrategia **Network First** con fallback a Cache:

```javascript
1. Intenta cargar desde internet (Network First)
   ↓
2. Si falla, busca en caché (Cache Fallback)
   ↓
3. Si no hay caché, muestra offline.html
```

### ¿Qué se cachea?

- ✅ Archivos estáticos (HTML, CSS, JS)
- ✅ Iconos y manifest
- ✅ Respuestas exitosas de la API
- ✅ Imágenes y recursos

### ¿Qué NO se cachea?

- ❌ Errores de red
- ❌ Respuestas de error (404, 500, etc.)
- ❌ Peticiones fuera de HTTP/HTTPS

---

## 🌐 DESPLEGAR EN PRODUCCIÓN

### Opción 1: Netlify (Gratis, Recomendado)

```bash
# 1. Compilar
npm run build

# 2. Instalar Netlify CLI (una vez)
npm install -g netlify-cli

# 3. Login
netlify login

# 4. Desplegar
netlify deploy --prod --dir=dist
```

O arrastra la carpeta `dist/` en https://app.netlify.com/drop

**✅ Netlify automáticamente:**
- Activa HTTPS (requerido para PWA)
- Configura headers correctos
- CDN global
- Actualizaciones automáticas

### Opción 2: Vercel (Gratis)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Desplegar
vercel --prod
```

### Opción 3: GitHub Pages + Custom Domain

**IMPORTANTE**: GitHub Pages requiere dominio personalizado con HTTPS para PWA.

```bash
# 1. En package.json, añadir:
{
  "homepage": "https://tu-usuario.github.io/lista-compra"
}

# 2. Instalar gh-pages
npm install --save-dev gh-pages

# 3. En package.json, añadir scripts:
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# 4. Desplegar
npm run deploy
```

---

## 🧪 VERIFICAR PWA EN PRODUCCIÓN

### Lighthouse (Auditoría PWA)

1. Abre tu app desplegada
2. Abre DevTools (F12)
3. Ve a "Lighthouse"
4. Selecciona "Progressive Web App"
5. Haz clic en "Generate report"

**Objetivo**: Score > 90/100

### PWA Checklist

✅ Manifest válido
✅ Service worker registrado
✅ Funciona offline
✅ HTTPS activo
✅ Iconos en todos los tamaños
✅ Meta tags correctos
✅ Instalable en móvil y desktop
✅ Pantalla de splash (automática)
✅ Orientación correcta

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### "No se puede instalar la app"

**Causa**: Faltan iconos o manifest incorrecto

**Solución**:
1. Verifica que existan todos los iconos en `public/`
2. Abre DevTools > Application > Manifest
3. Verifica errores en la consola

### "Service Worker no se registra"

**Causa**: No estás en HTTPS o localhost

**Solución**:
- En desarrollo: usa `localhost` (no `127.0.0.1`)
- En producción: asegúrate de tener HTTPS

### "Cambios no se ven después de actualizar"

**Causa**: Caché del service worker

**Solución**:
```javascript
// En DevTools > Application > Service Workers
1. Marca "Update on reload"
2. O haz clic en "Unregister" y recarga
```

### "Funciona en localhost pero no en producción"

**Causa**: Rutas incorrectas o CORS

**Solución**:
1. Verifica que todas las rutas sean absolutas
2. Configura CORS en Supabase si es necesario

---

## 📊 MONITOREAR LA PWA

### Google Analytics (Opcional)

Puedes agregar eventos para monitorear:
- Instalaciones de PWA
- Uso offline
- Actualizaciones de service worker

### En el Código

```javascript
// Detectar cuando la app es instalada
window.addEventListener('appinstalled', () => {
  console.log('PWA instalada')
  // Enviar evento a analytics
})

// Detectar modo online/offline
window.addEventListener('online', () => {
  console.log('Conexión restaurada')
})

window.addEventListener('offline', () => {
  console.log('Sin conexión')
})
```

---

## 🎉 CARACTERÍSTICAS AVANZADAS (OPCIONAL)

### 1. Notificaciones Push

Requiere:
- Backend que envíe notificaciones
- Permisos del usuario
- Configuración en service worker (ya incluida)

### 2. Sincronización en Background

```javascript
// Registrar sincronización
navigator.serviceWorker.ready.then((registration) => {
  return registration.sync.register('sync-shopping-list')
})
```

### 3. Badge API (Contador en icono)

```javascript
// Mostrar número de items pendientes
navigator.setAppBadge(5)

// Limpiar badge
navigator.clearAppBadge()
```

---

## 📚 RECURSOS ADICIONALES

- **PWA Builder**: https://www.pwabuilder.com/
- **Workbox** (caché avanzado): https://developers.google.com/web/tools/workbox
- **MDN PWA**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Google PWA Checklist**: https://web.dev/pwa-checklist/

---

## ✅ RESUMEN RÁPIDO

```bash
# 1. Generar iconos
# (Usar generador online o placeholders)

# 2. Compilar
npm run build

# 3. Desplegar
netlify deploy --prod --dir=dist
# O usar Vercel, GitHub Pages, etc.

# 4. Verificar
# Abrir en móvil y probar instalación

# 5. Auditoría
# Lighthouse > PWA > Score > 90
```

---

**🎉 ¡Tu app ya está lista para ser una PWA profesional!**
