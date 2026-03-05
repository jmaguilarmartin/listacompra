import { useState, useEffect } from 'react'
import * as listasService from '../services/listasService'
import type { Lista, TemplateItem, TemplateItemInsert } from '../lib/supabase'

export function useTemplates() {
  const [templates, setTemplates] = useState<Lista[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar templates al iniciar
  useEffect(() => {
    loadTemplates()
  }, [])

  // Cargar todos los templates
  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listasService.getTemplates()
      setTemplates(data)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Error al cargar templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Crear nuevo template
  const createTemplate = async (nombre: string, descripcion?: string) => {
    try {
      setError(null)
      const nuevoTemplate = await listasService.createLista({
        nombre,
        descripcion: descripcion || null,
        usuario_creador: 'Usuario',
        es_template: true,
        icono: '📋',
        color: '#6366f1',
        activa: true,
      })
      setTemplates((prev) => [...prev, nuevoTemplate])
      return nuevoTemplate
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Crear template desde lista existente
  const crearTemplateDesdeLista = async (
    listaId: string,
    nombreTemplate: string,
    descripcion?: string
  ) => {
    try {
      setError(null)
      const nuevoTemplate = await listasService.crearTemplateDesdeLista(
        listaId,
        nombreTemplate,
        descripcion
      )
      setTemplates((prev) => [...prev, nuevoTemplate])
      return nuevoTemplate
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Eliminar template
  const deleteTemplate = async (id: string) => {
    try {
      setError(null)
      await listasService.deleteLista(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Obtener items de un template
  const getTemplateItems = async (templateId: string): Promise<TemplateItem[]> => {
    try {
      setError(null)
      return await listasService.getTemplateItems(templateId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Añadir producto a template
  const addProductoToTemplate = async (item: TemplateItemInsert) => {
    try {
      setError(null)
      return await listasService.addProductoToTemplate(item)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Eliminar producto de template
  const removeProductoFromTemplate = async (
    templateId: string,
    productoId: string
  ) => {
    try {
      setError(null)
      await listasService.removeProductoFromTemplate(templateId, productoId)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  // Aplicar template a una lista
  const aplicarTemplate = async (
    templateId: string,
    listaDestinoId: string
  ): Promise<number> => {
    try {
      setError(null)
      const itemsAñadidos = await listasService.aplicarTemplate(
        templateId,
        listaDestinoId
      )
      return itemsAñadidos
    } catch (err) {
      const error = err as Error
      setError(error.message)
      throw err
    }
  }

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    createTemplate,
    crearTemplateDesdeLista,
    deleteTemplate,
    getTemplateItems,
    addProductoToTemplate,
    removeProductoFromTemplate,
    aplicarTemplate,
  }
}
