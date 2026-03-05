import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Crea un archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export interface Producto {
  id: string
  nombre: string
  categoria: string | null
  lugar_compra_habitual: string | null
  frecuencia_manual: number | null
  frecuencia_calculada: number | null
  ultima_compra: string | null
  activo: boolean
  fecha_creacion: string
  usuario_creador: string | null
  notas: string | null
}

export interface ItemLista {
  id: string
  lista_id: string
  producto_id: string
  cantidad: string
  usuario_añadido: string | null
  fecha_añadido: string
  estado: 'pendiente' | 'comprado' | 'ignorado'
  semana_compra: number | null
  año_compra: number | null
  notas_compra: string | null
  precio_compra: number | null
  lugar_compra_real: string | null
  producto?: Producto
}

export interface Lista {
  id: string
  nombre: string
  descripcion: string | null
  usuario_creador: string | null
  es_template: boolean
  icono: string | null
  color: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

export interface TemplateItem {
  id: string
  template_id: string
  producto_id: string
  cantidad_sugerida: string
  orden: number
  created_at: string
  producto?: Producto
}

export interface EstadisticasLista {
  id: string
  nombre: string
  es_template: boolean
  items_pendientes: number
  items_comprados: number
  total_items: number
  updated_at: string
  activa: boolean
}

export interface HistoricoCompra {
  id: string
  producto_id: string
  fecha_compra: string
  precio: number | null
  cantidad: string | null
  lugar_compra: string | null
  usuario_compro: string | null
  semana_compra: number | null
  año_compra: number | null
  producto?: Producto
}

export interface Sugerencia {
  producto_id: string
  nombre: string
  categoria: string | null
  lugar_compra: string | null
  prioridad: number
  dias_desde_ultima: number
  frecuencia_usada: number
  ultima_compra: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string | null
  lugares_favoritos: string[] | null
  activo: boolean
  fecha_registro: string
}

// Tipos para crear/actualizar
export type ProductoInsert = Omit<Producto, 'id' | 'fecha_creacion'>
export type ProductoUpdate = Partial<ProductoInsert>

export type ItemListaInsert = Omit<ItemLista, 'id' | 'fecha_añadido' | 'producto'>
export type ItemListaUpdate = Partial<ItemListaInsert>

export type HistoricoCompraInsert = Omit<HistoricoCompra, 'id' | 'producto'>

export type ListaInsert = Omit<Lista, 'id' | 'created_at' | 'updated_at'>
export type ListaUpdate = Partial<ListaInsert>

export type TemplateItemInsert = Omit<TemplateItem, 'id' | 'created_at' | 'producto'>
export type TemplateItemUpdate = Partial<TemplateItemInsert>
