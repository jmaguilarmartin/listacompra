import { supabase, Producto, HistoricoCompra, Sugerencia } from '../lib/supabase'
import { differenceInDays, parseISO } from 'date-fns'
import { median, standardDeviation } from '../lib/utils'

/**
 * Calcula la frecuencia de compra de un producto basándose en el histórico
 */
export async function calcularFrecuenciaProducto(productoId: string) {
  // Obtener últimas 10 compras del producto
  const { data: compras, error } = await supabase
    .from('historico_compras')
    .select('fecha_compra')
    .eq('producto_id', productoId)
    .order('fecha_compra', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error al obtener histórico:', error)
    throw error
  }

  if (!compras || compras.length < 2) {
    return null // Insuficientes datos
  }

  // Calcular intervalos entre compras consecutivas
  const intervalos: number[] = []
  for (let i = 0; i < compras.length - 1; i++) {
    const fecha1 = parseISO(compras[i].fecha_compra)
    const fecha2 = parseISO(compras[i + 1].fecha_compra)
    const dias = differenceInDays(fecha1, fecha2)
    if (dias > 0) {
      intervalos.push(dias)
    }
  }

  if (intervalos.length === 0) {
    return null
  }

  // Usar mediana para evitar outliers (más robusto que promedio)
  const frecuenciaDias = median(intervalos)
  
  // Calcular desviación para determinar regularidad
  const desviacion = intervalos.length > 2 ? standardDeviation(intervalos) : 0
  
  // Producto es regular si desviación < 50% de frecuencia
  const esRegular = (desviacion / frecuenciaDias) < 0.5

  return {
    frecuenciaDias: Math.round(frecuenciaDias * 10) / 10, // redondear a 1 decimal
    esRegular,
    desviacion: Math.round(desviacion * 10) / 10,
    comprasAnalizadas: compras.length,
    intervalos,
  }
}

/**
 * Actualiza la frecuencia calculada de un producto
 */
export async function actualizarFrecuenciaCalculada(productoId: string) {
  const frecuencia = await calcularFrecuenciaProducto(productoId)
  
  if (!frecuencia) {
    return null
  }

  const { data, error } = await supabase
    .from('productos')
    .update({ frecuencia_calculada: frecuencia.frecuenciaDias })
    .eq('id', productoId)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar frecuencia:', error)
    throw error
  }

  return data as Producto
}

/**
 * Actualiza las frecuencias de todos los productos
 */
export async function actualizarTodasLasFrecuencias() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id')
    .eq('activo', true)
    .is('frecuencia_manual', null) // Solo productos sin frecuencia manual

  if (error) {
    console.error('Error al obtener productos:', error)
    throw error
  }

  const resultados = []
  for (const producto of productos) {
    try {
      const resultado = await actualizarFrecuenciaCalculada(producto.id)
      resultados.push(resultado)
    } catch (err) {
      console.error(`Error al actualizar producto ${producto.id}:`, err)
    }
  }

  return resultados
}

/**
 * Determina si un producto debe ser sugerido
 */
export function deberSugerirProducto(producto: Producto): {
  sugerir: boolean
  prioridad: number
  diasDesdeUltima: number
  frecuenciaUsada: number | null
} | null {
  if (!producto.activo || !producto.ultima_compra) {
    return null
  }

  // Usar frecuencia manual si existe, sino calculada
  const frecuencia = producto.frecuencia_manual || producto.frecuencia_calculada

  if (!frecuencia) {
    return null // Sin datos suficientes
  }

  const diasDesdeUltima = differenceInDays(new Date(), parseISO(producto.ultima_compra))

  // Calcular prioridad
  let prioridad = 0
  let sugerir = false

  if (diasDesdeUltima >= frecuencia * 1.2) {
    prioridad = 5 // MUY urgente (pasado de plazo)
    sugerir = true
  } else if (diasDesdeUltima >= frecuencia) {
    prioridad = 4 // Urgente (plazo cumplido)
    sugerir = true
  } else if (diasDesdeUltima >= frecuencia * 0.9) {
    prioridad = 3 // Normal (cerca del plazo)
    sugerir = true
  }

  return {
    sugerir,
    prioridad,
    diasDesdeUltima,
    frecuenciaUsada: frecuencia,
  }
}

/**
 * Obtiene sugerencias inteligentes de productos para comprar
 */
export async function obtenerSugerencias(): Promise<Sugerencia[]> {
  // Obtener productos activos con última compra y frecuencia
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .not('ultima_compra', 'is', null)

  if (error) {
    console.error('Error al obtener productos para sugerencias:', error)
    throw error
  }

  if (!productos || productos.length === 0) {
    return []
  }

  // Obtener precios históricos en una sola query para calcular precio medio por producto
  const { data: preciosHistorico } = await supabase
    .from('historico_compras')
    .select('producto_id, precio')
    .not('precio', 'is', null)

  const precioMedioPorProducto: Record<string, number> = {}
  if (preciosHistorico) {
    const acumulado: Record<string, { suma: number; count: number }> = {}
    for (const row of preciosHistorico) {
      if (row.precio !== null) {
        if (!acumulado[row.producto_id]) acumulado[row.producto_id] = { suma: 0, count: 0 }
        acumulado[row.producto_id].suma += row.precio
        acumulado[row.producto_id].count++
      }
    }
    for (const [id, { suma, count }] of Object.entries(acumulado)) {
      precioMedioPorProducto[id] = suma / count
    }
  }

  // Evaluar cada producto
  const sugerencias: Sugerencia[] = []

  for (const producto of productos) {
    const evaluacion = deberSugerirProducto(producto)

    if (evaluacion && evaluacion.sugerir) {
      sugerencias.push({
        producto_id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        lugar_compra: producto.lugar_compra_habitual,
        prioridad: evaluacion.prioridad,
        dias_desde_ultima: evaluacion.diasDesdeUltima,
        frecuencia_usada: evaluacion.frecuenciaUsada!,
        ultima_compra: producto.ultima_compra!,
        precio_medio: precioMedioPorProducto[producto.id] ?? null,
      })
    }
  }

  // Ordenar por prioridad (mayor primero) y luego por días desde última compra
  sugerencias.sort((a, b) => {
    if (b.prioridad !== a.prioridad) {
      return b.prioridad - a.prioridad
    }
    return b.dias_desde_ultima - a.dias_desde_ultima
  })

  return sugerencias
}

/**
 * Obtiene sugerencias filtradas por lugar
 */
export async function obtenerSugerenciasPorLugar(lugar: string): Promise<Sugerencia[]> {
  const todasLasSugerencias = await obtenerSugerencias()
  return todasLasSugerencias.filter(s => s.lugar_compra === lugar)
}

/**
 * Obtiene el histórico de compras de un producto
 */
export async function getHistoricoProducto(productoId: string): Promise<HistoricoCompra[]> {
  const { data, error } = await supabase
    .from('historico_compras')
    .select(`
      *,
      producto:productos(*)
    `)
    .eq('producto_id', productoId)
    .order('fecha_compra', { ascending: false })

  if (error) {
    console.error('Error al obtener histórico:', error)
    throw error
  }

  return data as HistoricoCompra[]
}

/**
 * Obtiene todo el histórico de compras
 */
export async function getTodoElHistorico(limit: number = 100): Promise<HistoricoCompra[]> {
  const { data, error } = await supabase
    .from('historico_compras')
    .select(`
      *,
      producto:productos(*)
    `)
    .order('fecha_compra', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error al obtener histórico completo:', error)
    throw error
  }

  return data as HistoricoCompra[]
}

/**
 * Calcula estadísticas de un producto
 */
export async function getEstadisticasProducto(productoId: string) {
  const historico = await getHistoricoProducto(productoId)

  if (historico.length === 0) {
    return {
      totalCompras: 0,
      precioPromedio: 0,
      precioMinimo: 0,
      precioMaximo: 0,
      ultimaCompra: null,
      lugarMasComun: null,
    }
  }

  const precios = historico
    .map(h => h.precio)
    .filter((p): p is number => p !== null && p !== undefined)

  const lugares = historico
    .map(h => h.lugar_compra)
    .filter((l): l is string => l !== null && l !== undefined)

  // Lugar más común
  const lugaresCount = lugares.reduce((acc, lugar) => {
    acc[lugar] = (acc[lugar] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const lugarMasComun = lugares.length > 0
    ? Object.entries(lugaresCount).sort((a, b) => b[1] - a[1])[0][0]
    : null

  return {
    totalCompras: historico.length,
    precioPromedio: precios.length > 0
      ? precios.reduce((sum, p) => sum + p, 0) / precios.length
      : 0,
    precioMinimo: precios.length > 0 ? Math.min(...precios) : 0,
    precioMaximo: precios.length > 0 ? Math.max(...precios) : 0,
    ultimaCompra: historico[0].fecha_compra,
    lugarMasComun,
    historicoCompleto: historico,
  }
}

/**
 * Obtiene productos que nunca se han comprado
 */
export async function getProductosNuncaComprados(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .is('ultima_compra', null)

  if (error) {
    console.error('Error al obtener productos nunca comprados:', error)
    throw error
  }

  return data as Producto[]
}

/**
 * Obtiene productos comprados recientemente (últimos N días)
 */
export async function getProductosRecientes(dias: number = 7): Promise<Producto[]> {
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - dias)

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .not('ultima_compra', 'is', null)
    .gte('ultima_compra', fechaLimite.toISOString().split('T')[0])
    .order('ultima_compra', { ascending: false })

  if (error) {
    console.error('Error al obtener productos recientes:', error)
    throw error
  }

  return data as Producto[]
}
