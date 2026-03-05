import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import * as productosService from '../services/productosService'
import { ProductoInsert, ProductoUpdate } from '../lib/supabase'

export function useProductos() {
  const {
    productos,
    setProductos,
    addProducto: addProductoStore,
    updateProducto: updateProductoStore,
    removeProducto: removeProductoStore,
    isLoading,
    setIsLoading,
    setError,
  } = useStore()

  const [initialized, setInitialized] = useState(false)

  // Cargar productos al iniciar
  useEffect(() => {
    if (!initialized) {
      loadProductos()
      setInitialized(true)
    }
  }, [initialized])

  const loadProductos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await productosService.getProductos()
      setProductos(data)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al cargar productos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createProducto = async (producto: ProductoInsert) => {
    try {
      setIsLoading(true)
      setError(null)
      const nuevoProducto = await productosService.createProducto(producto)
      addProductoStore(nuevoProducto)
      return nuevoProducto
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateProducto = async (id: string, updates: ProductoUpdate) => {
    try {
      setIsLoading(true)
      setError(null)
      const productoActualizado = await productosService.updateProducto(id, updates)
      updateProductoStore(id, productoActualizado)
      return productoActualizado
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProducto = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await productosService.deleteProducto(id)
      removeProductoStore(id)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const searchProductos = async (searchTerm: string) => {
    try {
      setError(null)
      return await productosService.searchProductos(searchTerm)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  const getCategorias = async () => {
    try {
      setError(null)
      return await productosService.getCategorias()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  const getLugaresCompra = async () => {
    try {
      setError(null)
      return await productosService.getLugaresCompra()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  return {
    productos,
    isLoading,
    loadProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    searchProductos,
    getCategorias,
    getLugaresCompra,
  }
}
