// Edge Function: notify-telegram
// Recibe { producto, cantidad, lista, usuario } y envía un mensaje al chat
// configurado a través de TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — entorno Deno (Supabase Edge Functions), no Node

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

    if (!token || !chatId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { producto, cantidad, lista, usuario = 'Usuario' } = await req.json()

    const text =
      `🛒 <b>Nueva adición a la lista</b>\n` +
      `📋 Lista: <b>${escapeHtml(String(lista ?? ''))}</b>\n` +
      `📦 Producto: <b>${escapeHtml(String(producto ?? ''))}</b>\n` +
      `🔢 Cantidad: <b>${escapeHtml(String(cantidad ?? ''))}</b>\n` +
      `👤 Por: ${escapeHtml(String(usuario))}`

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })

    const tgJson = await tgRes.json()

    if (!tgRes.ok || !tgJson.ok) {
      return new Response(
        JSON.stringify({ success: false, error: tgJson.description ?? 'Telegram API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
