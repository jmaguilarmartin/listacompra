import { useState, useEffect } from 'react'
import * as listasService from '../services/listasService'
import type { Lista, ListaInsert, ListaUpdate } from '../lib/supabase'

export function useListas() {
  const [listas, setListas] = useState<Lista[]>([])
  const [listaActiva, setListaActiva] = useState<Lista | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar listas solo una vez al iniciar
  useEffect(() => {
    loadListas()
  }, [])

  const loadListas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listasService.getListas()
      setListas(data)

      // Cargar lista activa desde localStorage o usar la primera
      const listaActivaId = localStorage.getItem('listaActivaId')
      
      if (listaActivaId) {
        const lista = data.find((l) => l.id === listaActivaId)
        if (lista) {
          setListaActiva(lista)
          return
        }
      }

      // Si no hay en localStorage o no se encuentra, usar la primera
      if (data.length > 0) {
        setListaActiva(data[0])
        localStorage.setItem('listaActivaId', data[0].id)
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al cargar listas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createLista = async (lista: ListaInsert) => {
    try {
      setError(null)
      const nuevaLista = await listasService.createLista(lista)
      setListas((prev) => [nuevaLista, ...prev])
      return nuevaLista
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  const updateLista = async (id: string, updates: ListaUpdate) => {
    try {
      setError(null)
      const listaActualizada = await listasService.updateLista(id, updates)
      setListas((prev) =>
        prev.map((lista) => (lista.id === id ? listaActualizada : lista))
      )
      if (listaActiva?.id === id) {
        setListaActiva(listaActualizada)
      }
      return listaActualizada
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

 const deleteLista = async (id: string) => {
  try {
    setError(null)
    
    // Obtener lista que se va a eliminar
    const listaAEliminar = listas.find(l => l.id === id)
    if (!listaAEliminar) {
      throw new Error('Lista no encontrada')
    }
    
    // Llamar al servicio para eliminar
    await listasService.deleteLista(id)
    
    // Actualizar estado local
    setListas((prev) => prev.filter((lista) => lista.id !== id))
    
    // Si era la lista activa, cambiar a otra
    if (listaActiva?.id === id) {
      // Buscar otra lista disponible
      const otraLista = listas.find((l) => l.id !== id)
      
      if (otraLista) {
        // Cambiar a otra lista existente
        setListaActiva(otraLista)
        localStorage.setItem('listaActivaId', otraLista.id)
      } else {
        // Si no hay más listas, crear/cargar la lista por defecto
        const listaDefecto = await listasService.getListaPorDefecto()
        setListas([listaDefecto])
        setListaActiva(listaDefecto)
        localStorage.setItem('listaActivaId', listaDefecto.id)
      }
    }
  } catch (err) {
    const error = err as Error
    setError(error.message)
    throw err
  }
}

  const duplicarLista = async (listaId: string, nuevoNombre: string) => {
    try {
      setError(null)
      const nuevaListaId = await listasService.duplicarLista(listaId, nuevoNombre)
      const nuevaLista = await listasService.getListaById(nuevaListaId)
      if (nuevaLista) {
        setListas((prev) => [nuevaLista, ...prev])
      }
      return nuevaListaId
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  const cambiarListaActiva = (lista: Lista) => {
    setListaActiva(lista)
    localStorage.setItem('listaActivaId', lista.id)
  }

  return {
    listas,
    listaActiva,
    isLoading,
    error,
    loadListas,
    createLista,
    updateLista,
    deleteLista,
    duplicarLista,
    cambiarListaActiva,
  }
}