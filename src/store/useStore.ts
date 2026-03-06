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
  setProductos: (productos: Producto[]) => set({ productos }),

  addProducto: (producto: Producto) =>
    set((state: AppState) => ({
      productos: [...state.productos, producto],
    })),

  updateProducto: (id: string, updates: Partial<Producto>) =>
    set((state: AppState) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeProducto: (id: string) =>
    set((state: AppState) => ({
      productos: state.productos.filter((p) => p.id !== id),
    })),

  // Acciones de lista de compra
  setListaCompra: (listaCompra: ItemLista[]) => set({ listaCompra }),

  addItemLista: (item: ItemLista) =>
    set((state: AppState) => ({
      listaCompra: [...state.listaCompra, item],
    })),

  updateItemLista: (id: string, updates: Partial<ItemLista>) =>
    set((state: AppState) => ({
      listaCompra: state.listaCompra.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItemLista: (id: string) =>
    set((state: AppState) => ({
      listaCompra: state.listaCompra.filter((item) => item.id !== id),
    })),

  // Acciones de sugerencias
  setSugerencias: (sugerencias: Sugerencia[]) => set({ sugerencias }),

  // Acciones de UI
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // Acciones de filtros
  setFiltroLugar: (filtroLugar: string | null) => set({ filtroLugar }),
  setFiltroCategoria: (filtroCategoria: string | null) => set({ filtroCategoria }),

  // Acciones de usuario
  setUsuarioActual: (usuarioActual: string | null) => set({ usuarioActual }),
}))
