#!/bin/bash

# Script para generar iconos placeholder para PWA
# Requiere ImageMagick instalado

echo "🎨 Generando iconos placeholder para PWA..."

# Crear directorio public si no existe
mkdir -p public

# Crear SVG base
cat > /tmp/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0ea5e9" rx="80"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" fill="white" text-anchor="middle" font-weight="bold">🛒</text>
</svg>
EOF

# Generar todos los tamaños usando ImageMagick
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"
do
  echo "Generando icon-${size}.png..."
  convert -background none /tmp/icon.svg -resize ${size}x${size} public/icon-${size}.png
done

# Limpiar archivo temporal
rm /tmp/icon.svg

echo "✅ Iconos generados correctamente en public/"
echo ""
echo "Archivos creados:"
ls -lh public/icon-*.png

echo ""
echo "🎉 ¡Listo! Ahora puedes ejecutar 'npm run dev' y probar la PWA"
