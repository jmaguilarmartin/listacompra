import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import * as listaService from '../services/listaService'
import { ItemListaInsert, ItemListaUpdate } from '../lib/supabase'

export function useListaCompra(listaId?: string) {
  const {
    listaCompra,
    setListaCompra,
    addItemLista: addItemStore,
    updateItemLista: updateItemStore,
    removeItemLista: removeItemStore,
    isLoading,
    setIsLoading,
    setError,
  } = useStore()

// Cargar lista cuando listaId cambia
  useEffect(() => {
    cargarDatos(listaId)
  }, [listaId])

 const cargarDatos = async (id?: string) => {
    // IMPORTANTE: Limpiar primero
    setListaCompra([])

    if (!id) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await listaService.getListaPendiente(id)
      setListaCompra(data)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('❌ Error al cargar lista:', err)
      setListaCompra([])
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadLista = () => cargarDatos(listaId)

  const addToLista = async (item: ItemListaInsert) => {
    try {
      setIsLoading(true)
      setError(null)

      if (!item.lista_id) {
        throw new Error('Se requiere lista_id para añadir items')
      }

      const nuevoItem = await listaService.addToLista(item)
      addItemStore(nuevoItem)
      return nuevoItem
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al añadir item:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const marcarComprado = async (id: string, precio?: number, lugar?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const updates: ItemListaUpdate = {
        estado: 'comprado',
        ...(precio !== undefined && { precio_compra: precio }),
        ...(lugar && { lugar_compra_real: lugar }),
      }
      const itemActualizado = await listaService.marcarComoComprado(id, updates)
      updateItemStore(itemActualizado.id, itemActualizado)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al marcar como comprado:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const marcarPendiente = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const updates: ItemListaUpdate = {
        estado: 'pendiente',
        precio_compra: null,
        lugar_compra_real: null,
      }
      const itemActualizado = await listaService.updateItemLista(id, updates)
      updateItemStore(itemActualizado.id, itemActualizado)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al marcar como pendiente:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await listaService.deleteItemLista(id)
      removeItemStore(id)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al eliminar item:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (id: string, updates: ItemListaUpdate) => {
    try {
      setIsLoading(true)
      setError(null)
      const itemActualizado = await listaService.updateItemLista(id, updates)
      updateItemStore(itemActualizado.id, itemActualizado)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al actualizar item:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const limpiarLista = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await listaService.limpiarLista(listaId)
      await cargarDatos(listaId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al limpiar lista:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const marcarTodosComprados = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await listaService.marcarTodosComprados(listaId)
      await cargarDatos(listaId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al marcar todos como comprados:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const itemsPendientes = listaCompra.filter((item) => item.estado === 'pendiente')
  const itemsComprados = listaCompra.filter((item) => item.estado === 'comprado')

  return {
    listaCompra,
    itemsPendientes,
    itemsComprados,
    isLoading,
    loadLista,
    addToLista,
    marcarComprado,
    marcarPendiente,
    deleteItem,
    updateItem,
    limpiarLista,
    marcarTodosComprados,
  }
}