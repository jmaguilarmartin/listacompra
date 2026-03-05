import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import * as calculosService from '../services/calculosService'

export function useSugerencias() {
  const {
    sugerencias,
    setSugerencias,
    isLoading,
    setIsLoading,
    setError,
  } = useStore()

  const [initialized, setInitialized] = useState(false)

  // Cargar sugerencias al iniciar
  useEffect(() => {
    if (!initialized) {
      loadSugerencias()
      setInitialized(true)
    }
  }, [initialized])

  const loadSugerencias = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await calculosService.obtenerSugerencias()
      setSugerencias(data)
      return data
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al cargar sugerencias:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const getSugerenciasPorLugar = async (lugar: string) => {
    try {
      setError(null)
      return await calculosService.obtenerSugerenciasPorLugar(lugar)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  const actualizarFrecuencia = async (productoId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await calculosService.actualizarFrecuenciaCalculada(productoId)
      // Recargar sugerencias después de actualizar
      await loadSugerencias()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const actualizarTodasLasFrecuencias = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await calculosService.actualizarTodasLasFrecuencias()
      // Recargar sugerencias después de actualizar
      await loadSugerencias()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const calcularFrecuencia = async (productoId: string) => {
    try {
      setError(null)
      return await calculosService.calcularFrecuenciaProducto(productoId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  const getEstadisticas = async (productoId: string) => {
    try {
      setError(null)
      return await calculosService.getEstadisticasProducto(productoId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  const getHistorico = async (productoId: string) => {
    try {
      setError(null)
      return await calculosService.getHistoricoProducto(productoId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw error
    }
  }

  // Agrupar sugerencias por prioridad
  const sugerenciasPorPrioridad = {
    urgentes: sugerencias.filter(s => s.prioridad >= 4),
    normales: sugerencias.filter(s => s.prioridad === 3),
    bajas: sugerencias.filter(s => s.prioridad < 3),
  }

  return {
    sugerencias,
    sugerenciasPorPrioridad,
    isLoading,
    loadSugerencias,
    getSugerenciasPorLugar,
    actualizarFrecuencia,
    actualizarTodasLasFrecuencias,
    calcularFrecuencia,
    getEstadisticas,
    getHistorico,
  }
}
