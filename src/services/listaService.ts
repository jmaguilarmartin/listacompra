import { supabase, ItemLista, ItemListaInsert, ItemListaUpdate } from '../lib/supabase'
import { getWeekNumber } from '../lib/utils'

/**
 * Obtener items de la lista (pendientes y comprados)
 * Ahora filtra por lista_id si se proporciona
 */
export async function getListaPendiente(listaId?: string): Promise<ItemLista[]> {
  let query = supabase
    .from('lista_pendiente')
    .select(`
      *,
      producto:productos(*)
    `)
    .order('fecha_añadido', { ascending: false })

  // Si se proporciona lista_id, filtrar por ella
  if (listaId) {
    query = query.eq('lista_id', listaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener lista pendiente:', error)
    throw error
  }

  return data as ItemLista[]
}

/**
 * Obtiene la lista completa con todos los estados
 */
export async function getListaCompleta(listaId?: string): Promise<ItemLista[]> {
  let query = supabase
    .from('lista_pendiente')
    .select(`
      *,
      producto:productos(*)
    `)
    .order('fecha_añadido', { ascending: false })

  if (listaId) {
    query = query.eq('lista_id', listaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener lista completa:', error)
    throw error
  }

  return data as ItemLista[]
}

/**
 * Añadir item a la lista
 * IMPORTANTE: Ahora requiere lista_id
 */
export async function addToLista(item: ItemListaInsert): Promise<ItemLista> {
  // Verificar que tenga lista_id
  if (!item.lista_id) {
    throw new Error('Se requiere lista_id para añadir items')
  }

  // Verificar si el producto ya está en la lista pendiente de esta lista específica
  const { data: existing } = await supabase
    .from('lista_pendiente')
    .select('id')
    .eq('producto_id', item.producto_id)
    .eq('lista_id', item.lista_id)
    .eq('estado', 'pendiente')
    .maybeSingle()

  if (existing) {
    throw new Error('El producto ya está en la lista')
  }

  // Añadir semana y año automáticos
  const now = new Date()
  const itemWithDates = {
    ...item,
    semana_compra: getWeekNumber(now),
    año_compra: now.getFullYear(),
  }

  const { data, error } = await supabase
    .from('lista_pendiente')
    .insert([itemWithDates])
    .select(`
      *,
      producto:productos(*)
    `)
    .single()

  if (error) {
    console.error('Error al añadir a lista:', error)
    throw error
  }

  return data as ItemLista
}

/**
 * Actualiza un item de la lista
 */
export async function updateItemLista(id: string, updates: ItemListaUpdate): Promise<ItemLista> {
  const { data, error } = await supabase
    .from('lista_pendiente')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      producto:productos(*)
    `)
    .single()

  if (error) {
    console.error('Error al actualizar item:', error)
    throw error
  }

  return data as ItemLista
}

/**
 * Marca un item como comprado y mueve al histórico
 */
export async function marcarComoComprado(
  id: string,
  updates: ItemListaUpdate
): Promise<ItemLista> {
  const now = new Date()
  const updatesWithDate = {
    ...updates,
    semana_compra: getWeekNumber(now),
    año_compra: now.getFullYear(),
    fecha_compra: now.toISOString().split('T')[0],
  }

  const { data, error } = await supabase
    .from('lista_pendiente')
    .update(updatesWithDate)
    .eq('id', id)
    .select(`
      *,
      producto:productos(*)
    `)
    .single()

  if (error) {
    console.error('Error al marcar como comprado:', error)
    throw error
  }

  return data as ItemLista
}

/**
 * Elimina un item de la lista
 */
export async function deleteItemLista(id: string): Promise<void> {
  const { error } = await supabase.from('lista_pendiente').delete().eq('id', id)

  if (error) {
    console.error('Error al eliminar item:', error)
    throw error
  }
}

/**
 * Limpiar lista (eliminar items comprados)
 * Ahora acepta lista_id opcional
 */
export async function limpiarLista(listaId?: string): Promise<void> {
  let query = supabase
    .from('lista_pendiente')
    .delete()
    .eq('estado', 'comprado')

  if (listaId) {
    query = query.eq('lista_id', listaId)
  }

  const { error } = await query

  if (error) {
    console.error('Error al limpiar lista:', error)
    throw error
  }
}

/**
 * Marcar todos los items como comprados
 * Ahora acepta lista_id opcional
 */
export async function marcarTodosComprados(listaId?: string): Promise<void> {
  const now = new Date()

  let query = supabase
    .from('lista_pendiente')
    .update({
      estado: 'comprado',
      semana_compra: getWeekNumber(now),
      año_compra: now.getFullYear(),
    })
    .eq('estado', 'pendiente')

  if (listaId) {
    query = query.eq('lista_id', listaId)
  }

  const { error } = await query

  if (error) {
    console.error('Error al marcar todos como comprados:', error)
    throw error
  }
}

/**
 * Agrupa los items pendientes por lugar de compra
 */

export function getListaPorLugar(items: ItemLista[]): Record<string, ItemLista[]> {
  const agrupados: Record<string, ItemLista[]> = {}

  items.forEach((item) => {
    const lugar = item.producto?.lugar_compra_habitual || 'Otros'
    if (!agrupados[lugar]) {
      agrupados[lugar] = []
    }
    agrupados[lugar].push(item)
  })

  return agrupados
}

/**
 * Agrupar items por categoría
 */
export function getListaPorCategoria(items: ItemLista[]): Record<string, ItemLista[]> {
  const agrupados: Record<string, ItemLista[]> = {}

  items.forEach((item) => {
    const categoria = item.producto?.categoria || 'Sin Categoría'
    if (!agrupados[categoria]) {
      agrupados[categoria] = []
    }
    agrupados[categoria].push(item)
  })

  return agrupados
}

/**
 * Obtiene estadísticas de la lista
 */
export interface EstadisticasLista {
  totalPendientes: number
  totalComprados: number
  gastoEstimado: number
  itemsPorLugar: Record<string, number>
}

export async function getEstadisticasLista(listaId?: string): Promise<EstadisticasLista> {
  const items = await getListaCompleta(listaId)

  const pendientes = items.filter((i) => i.estado === 'pendiente')
  const comprados = items.filter((i) => i.estado === 'comprado')

  const gastoEstimado = comprados.reduce((sum, item) => {
    return sum + (item.precio_compra || 0)
  }, 0)

  const itemsPorLugar: Record<string, number> = {}
  pendientes.forEach((item) => {
    const lugar = item.producto?.lugar_compra_habitual || 'Sin lugar'
    itemsPorLugar[lugar] = (itemsPorLugar[lugar] || 0) + 1
  })

  return {
    totalPendientes: pendientes.length,
    totalComprados: comprados.length,
    gastoEstimado,
    itemsPorLugar,
  }
}
