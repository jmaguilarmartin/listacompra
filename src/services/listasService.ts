import { supabase } from '../lib/supabase'
import type {
  Lista,
  ListaInsert,
  ListaUpdate,
  TemplateItem,
  TemplateItemInsert,
  EstadisticasLista,
} from '../lib/supabase'

/**
 * Obtener todas las listas activas (no templates)
 */
export async function getListas(): Promise<Lista[]> {
  const { data, error } = await supabase
    .from('listas')
    .select('*')
    .eq('activa', true)
    .eq('es_template', false)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener todos los templates
 */
export async function getTemplates(): Promise<Lista[]> {
  const { data, error } = await supabase
    .from('listas')
    .select('*')
    .eq('activa', true)
    .eq('es_template', true)
    .order('nombre')

  if (error) throw error
  return data || []
}

/**
 * Obtener una lista por ID
 */
export async function getListaById(id: string): Promise<Lista | null> {
  const { data, error } = await supabase
    .from('listas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Crear nueva lista
 */
export async function createLista(lista: ListaInsert): Promise<Lista> {
  const { data, error } = await supabase
    .from('listas')
    .insert([lista])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar lista
 */
export async function updateLista(
  id: string,
  updates: ListaUpdate
): Promise<Lista> {
  const { data, error } = await supabase
    .from('listas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar lista (soft delete)
 */
export async function deleteLista(id: string): Promise<void> {
  try {
    // Soft delete: marcar como inactiva en lugar de eliminar
    const { error } = await supabase
      .from('listas')
      .update({ activa: false })
      .eq('id', id)

    if (error) throw error

    // Opcional: Eliminar items pendientes de esa lista
    const { error: errorItems } = await supabase
      .from('lista_pendiente')
      .delete()
      .eq('lista_id', id)

    if (errorItems) throw errorItems
  } catch (error) {
    console.error('Error al eliminar lista:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de todas las listas
 */
export async function getEstadisticasListas(): Promise<EstadisticasLista[]> {
  const { data, error } = await supabase
    .from('v_estadisticas_listas')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener items de un template
 */
export async function getTemplateItems(
  templateId: string
): Promise<TemplateItem[]> {
  const { data, error } = await supabase
    .from('template_items')
    .select(
      `
      *,
      producto:productos(*)
    `
    )
    .eq('template_id', templateId)
    .order('orden')

  if (error) throw error
  return data || []
}

/**
 * Añadir producto a template
 */
export async function addProductoToTemplate(
  item: TemplateItemInsert
): Promise<TemplateItem> {
  const { data, error} = await supabase
    .from('template_items')
    .insert([item])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar producto de template
 */
export async function removeProductoFromTemplate(
  templateId: string,
  productoId: string
): Promise<void> {
  const { error } = await supabase
    .from('template_items')
    .delete()
    .eq('template_id', templateId)
    .eq('producto_id', productoId)

  if (error) throw error
}

/**
 * Aplicar template a una lista
 * Retorna el número de items añadidos
 */
export async function aplicarTemplate(
  templateId: string,
  listaDestinoId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('aplicar_template', {
    p_template_id: templateId,
    p_lista_destino_id: listaDestinoId,
  })

  if (error) throw error
  return data || 0
}

/**
 * Duplicar una lista
 * Retorna el ID de la nueva lista
 */
export async function duplicarLista(
  listaOrigenId: string,
  nuevoNombre: string
): Promise<string> {
  const { data, error } = await supabase.rpc('duplicar_lista', {
    p_lista_origen_id: listaOrigenId,
    p_nuevo_nombre: nuevoNombre,
  })

  if (error) throw error
  return data
}

/**
 * Crear template desde una lista existente
 */
export async function crearTemplateDesdeLista(
  listaId: string,
  nombreTemplate: string,
  descripcion?: string
): Promise<Lista> {
  // 1. Crear el template
  const template = await createLista({
    nombre: nombreTemplate,
    descripcion: descripcion || null,
    usuario_creador: 'Usuario',
    es_template: true,
    icono: '📋',
    color: '#6366f1',
    activa: true,
  })

  // 2. Obtener items de la lista original
  const { data: items, error } = await supabase
    .from('lista_pendiente')
    .select('producto_id, cantidad')
    .eq('lista_id', listaId)
    .eq('estado', 'pendiente')

  if (error) throw error

  // 3. Copiar items al template
  if (items && items.length > 0) {
    const templateItems = items.map((item, index) => ({
      template_id: template.id,
      producto_id: item.producto_id,
      cantidad_sugerida: item.cantidad,
      orden: index,
    }))

    const { error: insertError } = await supabase
      .from('template_items')
      .insert(templateItems)

    if (insertError) throw insertError
  }

  return template
}

/**
 * Obtener lista por defecto del usuario
 * Si no existe, crear una
 */
export async function getListaPorDefecto(): Promise<Lista> {
  // Intentar obtener la lista por defecto
  const { data: listas, error } = await supabase
    .from('listas')
    .select('*')
    .eq('activa', true)
    .eq('es_template', false)
    .order('created_at')
    .limit(1)

  if (error) throw error

  // Si existe, retornarla
  if (listas && listas.length > 0) {
    return listas[0]
  }

  // Si no existe, crear una por defecto
  return await createLista({
    nombre: 'Mi Lista',
    descripcion: 'Lista principal de compras',
    usuario_creador: 'Usuario',
    es_template: false,
    icono: '🛒',
    color: '#0ea5e9',
    activa: true,
  })
}
