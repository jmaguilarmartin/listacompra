const BASE_URL = 'https://world.openfoodfacts.org/api/v0/product'

export interface OpenFoodFactsData {
  nombre: string
  marca: string | null
  categoria: string | null
  unidad: string | null
  cantidad_envase: string | null
  nutriscore: string | null
  foto_url: string | null
}

interface OpenFoodFactsProduct {
  product_name?: string
  product_name_es?: string
  brands?: string
  categories_tags?: string[]
  quantity?: string
  nutriscore_grade?: string
  image_front_url?: string
}

interface OpenFoodFactsResponse {
  status: number
  product?: OpenFoodFactsProduct
}

function extraerCategoria(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null
  // Busca la primera categoría en español (es:) o en inglés sin prefijo de país
  const esTag = tags.find((t) => t.startsWith('es:'))
  const enTag = tags.find((t) => t.startsWith('en:'))
  const raw = esTag ?? enTag ?? tags[0]
  return raw.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')
}

function extraerUnidad(quantity: string | undefined): { unidad: string | null; cantidad_envase: string | null } {
  if (!quantity) return { unidad: null, cantidad_envase: null }
  // quantity viene como "1 L", "500 g", "12 unidades", etc.
  const match = quantity.match(/[\d,.]+\s*([a-zA-Záéíóú]+)/)
  const unidad = match ? match[1].toLowerCase() : null
  return { unidad, cantidad_envase: quantity }
}

export async function buscarPorCodigoBarras(codigo: string): Promise<OpenFoodFactsData | null> {
  try {
    const res = await fetch(`${BASE_URL}/${codigo}.json`)
    if (!res.ok) return null

    const data: OpenFoodFactsResponse = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const { unidad, cantidad_envase } = extraerUnidad(p.quantity)

    return {
      nombre: p.product_name_es || p.product_name || '',
      marca: p.brands?.split(',')[0].trim() || null,
      categoria: extraerCategoria(p.categories_tags),
      unidad,
      cantidad_envase,
      nutriscore: p.nutriscore_grade?.toLowerCase() || null,
      foto_url: p.image_front_url || null,
    }
  } catch {
    return null
  }
}
