import { supabase, Producto, ProductoInsert, ProductoUpdate, HistoricoPrecios } from '../lib/supabase'

/**
 * Sube la foto de un producto al bucket de Supabase Storage y devuelve la URL pública
 */
export async function uploadFotoProducto(file: File, productoId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${productoId}.${ext}`

  const { error } = await supabase.storage
    .from('producto-fotos')
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Error al subir foto:', error)
    throw error
  }

  const { data } = supabase.storage
    .from('producto-fotos')
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Obtiene todos los productos activos
 */
export async function getProductos(activosOnly: boolean = true) {
  let query = supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (activosOnly) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener productos:', error)
    throw error
  }

  return data as Producto[]
}

/**
 * Obtiene un producto por ID
 */
export async function getProducto(id: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error al obtener producto:', error)
    throw error
  }

  return data as Producto
}

/**
 * Busca productos por nombre
 */
export async function searchProductos(searchTerm: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .ilike('nombre', `%${searchTerm}%`)
    .eq('activo', true)
    .order('nombre', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error al buscar productos:', error)
    throw error
  }

  return data as Producto[]
}

/**
 * Crea un nuevo producto
 */
export async function createProducto(producto: ProductoInsert) {
  const { data, error } = await supabase
    .from('productos')
    .insert([producto])
    .select()
    .single()

  if (error) {
    console.error('Error al crear producto:', error)
    throw error
  }

  return data as Producto
}

/**
 * Actualiza un producto existente.
 * Si el precio cambia, registra el nuevo precio en historico_precios y actualiza
 * fecha_actualizacion_precio automáticamente.
 */
export async function updateProducto(id: string, updates: ProductoUpdate) {
  let updatesToApply = { ...updates }

  if (updatesToApply.precio !== undefined && updatesToApply.precio !== null) {
    const current = await getProducto(id)
    if (current.precio !== updatesToApply.precio) {
      const now = new Date().toISOString()
      updatesToApply = { ...updatesToApply, fecha_actualizacion_precio: now }
      await supabase.from('historico_precios').insert({
        producto_id: id,
        precio: updatesToApply.precio,
        fecha_cambio: now,
        usuario_cambio: null,
      })
    }
  }

  const { data, error } = await supabase
    .from('productos')
    .update(updatesToApply)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar producto:', error)
    throw error
  }

  return data as Producto
}

/**
 * Obtiene el historial de cambios de precio de un producto
 */
export async function getHistoricoPrecios(productoId: string): Promise<HistoricoPrecios[]> {
  const { data, error } = await supabase
    .from('historico_precios')
    .select('*')
    .eq('producto_id', productoId)
    .order('fecha_cambio', { ascending: false })

  if (error) {
    console.error('Error al obtener historial de precios:', error)
    throw error
  }

  return data as HistoricoPrecios[]
}

/**
 * Marca un producto como inactivo (soft delete)
 */
export async function deleteProducto(id: string) {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar producto:', error)
    throw error
  }
}

/**
 * Obtiene productos agrupados por categoría
 */
export async function getProductosPorCategoria() {
  const productos = await getProductos()
  
  const grouped = productos.reduce((acc, producto) => {
    const categoria = producto.categoria || 'Sin categoría'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(producto)
    return acc
  }, {} as Record<string, Producto[]>)

  return grouped
}

/**
 * Obtiene productos agrupados por lugar de compra
 */
export async function getProductosPorLugar() {
  const productos = await getProductos()
  
  const grouped = productos.reduce((acc, producto) => {
    const lugar = producto.lugar_compra_habitual || 'Sin lugar definido'
    if (!acc[lugar]) {
      acc[lugar] = []
    }
    acc[lugar].push(producto)
    return acc
  }, {} as Record<string, Producto[]>)

  return grouped
}

/**
 * Obtiene todas las categorías únicas
 */
export async function getCategorias() {
  const { data, error } = await supabase
    .from('productos')
    .select('categoria')
    .eq('activo', true)
    .not('categoria', 'is', null)

  if (error) {
    console.error('Error al obtener categorías:', error)
    throw error
  }

  const categorias = [...new Set(data.map(item => item.categoria))]
  return categorias.sort()
}

/**
 * Obtiene todos los lugares de compra únicos
 */
export async function getLugaresCompra() {
  const { data, error } = await supabase
    .from('productos')
    .select('lugar_compra_habitual')
    .eq('activo', true)
    .not('lugar_compra_habitual', 'is', null)

  if (error) {
    console.error('Error al obtener lugares de compra:', error)
    throw error
  }

  const lugares = [...new Set(data.map(item => item.lugar_compra_habitual))]
  return lugares.sort()
}

/**
 * Verifica si un producto ya existe (por nombre y lugar)
 */
export async function productoExists(nombre: string, lugar: string | null): Promise<boolean> {
  let query = supabase
    .from('productos')
    .select('id')
    .eq('nombre', nombre)
    .eq('activo', true)

  if (lugar) {
    query = query.eq('lugar_compra_habitual', lugar)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al verificar producto:', error)
    return false
  }

  return data.length > 0
}
