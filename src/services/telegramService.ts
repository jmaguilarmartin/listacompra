const SUPABASE_FUNCTION_URL = 'https://gnyxfvdjjylnljptlmim.supabase.co/functions/v1/notify-telegram'

export async function notificarTelegram(
  producto: string,
  cantidad: string,
  lista: string,
  usuario: string = 'Usuario'
) {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        producto,
        cantidad,
        lista,
        usuario
      })
    })

    const result = await response.json()
    
    if (!result.success) {
      console.error('Error al notificar Telegram:', result.error)
    }

    return result.success
  } catch (error) {
    console.error('Error al notificar Telegram:', error)
    return false
  }
}