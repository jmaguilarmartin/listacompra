import { useState } from 'react'
import { FileText, Plus, Trash2, Package } from 'lucide-react'
import { useTemplates } from '../hooks/useTemplates'
import { useProductos } from '../hooks/useProductos'
import type { Lista } from '../lib/supabase'

export function TemplatesPage() {
  const { templates, createTemplate, deleteTemplate, getTemplateItems, addProductoToTemplate, removeProductoFromTemplate } = useTemplates()
  const { productos } = useProductos()
  
  const [templateSeleccionado, setTemplateSeleccionado] = useState<Lista | null>(null)
  const [itemsTemplate, setItemsTemplate] = useState<any[]>([])
  const [showCrearTemplate, setShowCrearTemplate] = useState(false)
  const [showAñadirProducto, setShowAñadirProducto] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadSugerida, setCantidadSugerida] = useState('1')

  const cargarItemsTemplate = async (template: Lista) => {
    try {
      const items = await getTemplateItems(template.id)
      setItemsTemplate(items)
      setTemplateSeleccionado(template)
    } catch (err) {
      console.error('Error al cargar items:', err)
    }
  }

  const handleCrearTemplate = async () => {
    if (!nuevoNombre.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    try {
      await createTemplate(nuevoNombre, nuevaDescripcion || undefined)
      setShowCrearTemplate(false)
      setNuevoNombre('')
      setNuevaDescripcion('')
      alert('✅ Template creado')
    } catch (err) {
      alert('❌ Error al crear template')
    }
  }

  const handleEliminarTemplate = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar template "${nombre}"?`)) return

    try {
      await deleteTemplate(id)
      if (templateSeleccionado?.id === id) {
        setTemplateSeleccionado(null)
        setItemsTemplate([])
      }
      alert('✅ Template eliminado')
    } catch (err) {
      alert('❌ Error al eliminar template')
    }
  }

  const handleAñadirProducto = async () => {
    if (!templateSeleccionado || !productoSeleccionado) {
      alert('Selecciona un producto')
      return
    }

    try {
      await addProductoToTemplate({
        template_id: templateSeleccionado.id,
        producto_id: productoSeleccionado,
        cantidad_sugerida: cantidadSugerida,
        orden: itemsTemplate.length + 1,
      })
      
      await cargarItemsTemplate(templateSeleccionado)
      setShowAñadirProducto(false)
      setProductoSeleccionado('')
      setCantidadSugerida('1')
      alert('✅ Producto añadido al template')
    } catch (err) {
      alert('❌ Error al añadir producto')
    }
  }

  const handleEliminarProducto = async (templateId: string, productoId: string) => {
    if (!confirm('¿Eliminar este producto del template?')) return

    try {
      await removeProductoFromTemplate(templateId, productoId)
      if (templateSeleccionado) {
        await cargarItemsTemplate(templateSeleccionado)
      }
      alert('✅ Producto eliminado')
    } catch (err) {
      alert('❌ Error al eliminar producto')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates de Listas</h1>
            <p className="text-gray-600 mt-2">
              Crea templates con productos predefinidos para reutilizar
            </p>
          </div>
          <button
            onClick={() => setShowCrearTemplate(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de templates */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Templates</h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No hay templates</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    templateSeleccionado?.id === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => cargarItemsTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {template.icono} {template.nombre}
                      </h3>
                      {template.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">
                          {template.descripcion}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEliminarTemplate(template.id, template.nombre)
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Productos del template */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {!templateSeleccionado ? (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Selecciona un template para ver sus productos</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {templateSeleccionado.icono} {templateSeleccionado.nombre}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {itemsTemplate.length} productos en este template
                  </p>
                </div>
                <button
                  onClick={() => setShowAñadirProducto(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Añadir Producto
                </button>
              </div>

              {itemsTemplate.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">Este template no tiene productos</p>
                  <button
                    onClick={() => setShowAñadirProducto(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Añadir Primer Producto
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemsTemplate.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.producto?.nombre || 'Producto'}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {item.cantidad_sugerida && (
                            <span className="text-sm text-gray-600">
                              Cantidad: {item.cantidad_sugerida}
                            </span>
                          )}
                          {item.producto?.categoria && (
                            <span className="text-sm text-gray-500">
                              {item.producto.categoria}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEliminarProducto(templateSeleccionado.id, item.producto_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Crear Template */}
      {showCrearTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Compra del mes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Describe para qué sirve este template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCrearTemplate(false)
                  setNuevoNombre('')
                  setNuevaDescripcion('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearTemplate}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Producto */}
      {showAñadirProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Añadir Producto al Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecciona un producto...</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad sugerida
                </label>
                <input
                  type="text"
                  value={cantidadSugerida}
                  onChange={(e) => setCantidadSugerida(e.target.value)}
                  placeholder="Ej: 2 kg, 1 litro, 3 unidades..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAñadirProducto(false)
                  setProductoSeleccionado('')
                  setCantidadSugerida('1')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAñadirProducto}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}