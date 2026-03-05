# Script PowerShell para generar iconos placeholder para PWA
# No requiere instalación adicional, usa placeholders online

Write-Host "🎨 Descargando iconos placeholder para PWA..." -ForegroundColor Cyan

# Crear directorio public si no existe
if (!(Test-Path -Path "public")) {
    New-Item -ItemType Directory -Path "public" | Out-Null
}

# Lista de tamaños de iconos
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    Write-Host "Descargando icon-$size.png..." -ForegroundColor Green
    
    $url = "https://via.placeholder.com/$size/0ea5e9/FFFFFF?text=🛒"
    $output = "public/icon-$size.png"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    }
    catch {
        Write-Host "Error al descargar icon-$size.png" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Iconos descargados correctamente en public/" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Get-ChildItem -Path "public/icon-*.png" | Format-Table Name, Length -AutoSize

Write-Host ""
Write-Host "🎉 ¡Listo! Ahora puedes ejecutar 'npm run dev' y probar la PWA" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Nota: Estos son iconos placeholder." -ForegroundColor Yellow
Write-Host "   Para producción, genera iconos profesionales en:" -ForegroundColor Yellow
Write-Host "   https://www.pwabuilder.com/imageGenerator" -ForegroundColor Yellow
