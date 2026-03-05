import { create } from 'zustand'
import { Producto, ItemLista, Sugerencia } from '../lib/supabase'

interface AppState {
  // Productos
  productos: Producto[]
  setProductos: (productos: Producto[]) => void
  addProducto: (producto: Producto) => void
  updateProducto: (id: string, updates: Partial<Producto>) => void
  removeProducto: (id: string) => void

  // Lista de compra
  listaCompra: ItemLista[]
  setListaCompra: (items: ItemLista[]) => void
  addItemLista: (item: ItemLista) => void
  updateItemLista: (id: string, updates: Partial<ItemLista>) => void
  removeItemLista: (id: string) => void

  // Sugerencias
  sugerencias: Sugerencia[]
  setSugerencias: (sugerencias: Sugerencia[]) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Filtros
  filtroLugar: string | null
  setFiltroLugar: (lugar: string | null) => void
  filtroCategoria: string | null
  setFiltroCategoria: (categoria: string | null) => void

  // Usuario actual
  usuarioActual: string | null
  setUsuarioActual: (usuario: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  // Estado inicial
  productos: [],
  listaCompra: [],
  sugerencias: [],
  isLoading: false,
  error: null,
  filtroLugar: null,
  filtroCategoria: null,
  usuarioActual: null,

  // Acciones de productos
  setProductos: (productos) => set({ productos }),
  
  addProducto: (producto) =>
    set((state) => ({
      productos: [...state.productos, producto],
    })),

  updateProducto: (id, updates) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeProducto: (id) =>
    set((state) => ({
      productos: state.productos.filter((p) => p.id !== id),
    })),

  // Acciones de lista de compra
  setListaCompra: (listaCompra) => set({ listaCompra }),

  addItemLista: (item) =>
    set((state) => ({
      listaCompra: [...state.listaCompra, item],
    })),

  updateItemLista: (id, updates) =>
    set((state) => ({
      listaCompra: state.listaCompra.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItemLista: (id) =>
    set((state) => ({
      listaCompra: state.listaCompra.filter((item) => item.id !== id),
    })),

  // Acciones de sugerencias
  setSugerencias: (sugerencias) => set({ sugerencias }),

  // Acciones de UI
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Acciones de filtros
  setFiltroLugar: (filtroLugar) => set({ filtroLugar }),
  setFiltroCategoria: (filtroCategoria) => set({ filtroCategoria }),

  // Acciones de usuario
  setUsuarioActual: (usuarioActual) => set({ usuarioActual }),
}))
