# Deploy de Edge Functions — lista-compra

Las Edge Functions viven en `supabase/functions/<nombre>/index.ts` y se
despliegan al Supabase self-hosted que corre en el VPS (Coolify) copiando el
fichero al volumen del contenedor `edge-functions` y reiniciándolo.

Para automatizarlo, en tu WSL hay un alias `deploy-edge-lista`:

```bash
deploy-edge-lista <nombre>     # deploy de una función
deploy-edge-lista --all        # deploy de todas
deploy-edge-lista --list       # listar funciones locales
```

## Datos del entorno

| Concepto             | Valor                                                   |
| -------------------- | ------------------------------------------------------- |
| VPS                  | `root@178.105.137.118`                                  |
| Service ID Supabase  | `<SERVICE_ID_LISTA>` *(ver paso 1)*                     |
| Contenedor runtime   | `supabase-edge-functions-<SERVICE_ID_LISTA>`            |
| Volumen functions    | `/data/coolify/services/<SERVICE_ID_LISTA>/volumes/functions` |
| Repo local (WSL)     | `/mnt/c/Users/jmagu/lista-compra`                       |

## 1. Descubrir el SERVICE_ID

```bash
ssh root@178.105.137.118
docker ps --format 'table {{.Names}}\t{{.Image}}' | grep -i edge-functions
```

Apunta el sufijo del contenedor de **lista-compra** (no el de finanzas).
Luego confirma la ruta del volumen:

```bash
docker inspect supabase-edge-functions-<SERVICE_ID_LISTA> \
  --format '{{ range .Mounts }}{{ .Source }} -> {{ .Destination }}{{ "\n" }}{{ end }}' \
  | grep '/home/deno/functions'
```

Salida esperada:

```
/data/coolify/services/<SERVICE_ID_LISTA>/volumes/functions -> /home/deno/functions
```

## 2. Configurar el alias en WSL

Añade al `~/.bashrc`:

```bash
# === deploy-edge-lista: deploy de Edge Functions de lista-compra ===
COOLIFY_VPS_LISTA="root@178.105.137.118"
COOLIFY_SVC_LISTA="<SERVICE_ID_LISTA>"
COOLIFY_FNS_LISTA="/data/coolify/services/${COOLIFY_SVC_LISTA}/volumes/functions"
COOLIFY_RT_LISTA="supabase-edge-functions-${COOLIFY_SVC_LISTA}"
LOCAL_FNS_LISTA="/mnt/c/Users/jmagu/lista-compra/supabase/functions"

deploy-edge-lista() {
  local fn=$1
  if [ -z "$fn" ]; then
    echo "Uso: deploy-edge-lista <nombre>  |  deploy-edge-lista --all  |  deploy-edge-lista --list"
    return 1
  fi
  if [ "$fn" = "--all" ]; then
    for d in "$LOCAL_FNS_LISTA"/*/; do
      deploy-edge-lista "$(basename "$d")" || return 1
    done
    return 0
  fi
  if [ "$fn" = "--list" ]; then
    ls -1 "$LOCAL_FNS_LISTA" | grep -v '^_'
    return 0
  fi
  if [ ! -f "$LOCAL_FNS_LISTA/$fn/index.ts" ]; then
    echo "✗ No existe $LOCAL_FNS_LISTA/$fn/index.ts"
    return 1
  fi
  scp "$LOCAL_FNS_LISTA/$fn/index.ts" \
      "$COOLIFY_VPS_LISTA:$COOLIFY_FNS_LISTA/$fn/index.ts" \
   && ssh "$COOLIFY_VPS_LISTA" "docker restart $COOLIFY_RT_LISTA >/dev/null" \
   && echo "✓ Deploy $fn OK"
}
```

Recarga:

```bash
source ~/.bashrc
deploy-edge-lista --list
```

## 3. Secrets de la función

Los secrets se gestionan como **variables de entorno del servicio Supabase**
en Coolify (no con `supabase secrets`, porque ese CLI apunta a Cloud).

Variables actuales en uso:

| Secret               | Función              | Notas                                            |
| -------------------- | -------------------- | ------------------------------------------------ |
| `TELEGRAM_BOT_TOKEN` | `notify-telegram`    | Token del bot creado con @BotFather              |
| `TELEGRAM_CHAT_ID`   | `notify-telegram`    | Chat ID donde enviar las notificaciones          |

Si añades una nueva variable, **Redeploy** del servicio Supabase para que
llegue al contenedor de funciones.

## 4. Crear una nueva Edge Function

```bash
mkdir -p supabase/functions/mi-funcion
$EDITOR  supabase/functions/mi-funcion/index.ts
```

Plantilla mínima:

```ts
// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const body = await req.json()
  return new Response(JSON.stringify({ ok: true, body }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

Deploy:

```bash
deploy-edge-lista mi-funcion
```

Y llámala desde la app:

```ts
await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mi-funcion`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
})
```

## 5. Verificar despliegue

```bash
curl -X POST https://supabase-api.jmam.app/functions/v1/<nombre> \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"...":"..."}'
```

Logs del contenedor:

```bash
ssh root@178.105.137.118 "docker logs --tail 100 supabase-edge-functions-<SERVICE_ID_LISTA>"
```

## 6. Funciones desplegadas

| Función           | Endpoint                                                       | Descripción                              |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `notify-telegram` | `https://supabase-api.jmam.app/functions/v1/notify-telegram`   | Envía mensaje a Telegram al añadir item  |
