import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Search } from 'lucide-react'
import { ItemListaCard } from './ItemListaCard'
import { SugerenciasSection } from './SugerenciasSection'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { useListaCompra } from '../../hooks/useListaCompra'
import { useListas } from '../../hooks/useListas'
import { useSugerencias } from '../../hooks/useSugerencias'
import { useProductos } from '../../hooks/useProductos'
import { ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FileText, Grid3x3, MapPin, List } from 'lucide-react'
import { TemplateSelector } from './TemplateSelector'
import { notificarTelegram } from '../../services/telegramService'
import * as listaService from '../../services/listaService'
import { useUserName } from '../../hooks/useUserName'
import { ItemListaUpdate } from '../../lib/supabase'

export function ListaCompra() {
  const { listaActiva, deleteLista } = useListas()
  const { userName } = useUserName()
  const {
    itemsPendientes,
    itemsComprados,
    marcarComprado,
    marcarPendiente,
    deleteItem,
    updateItem,
    addToLista,
    limpiarLista,
    marcarTodosComprados,
    loadLista,
  } = useListaCompra(listaActiva?.id)

  const { sugerencias, loadSugerencias } = useSugerencias()
  const { productos } = useProductos()
  const navigate = useNavigate()

  const [showSugerencias, setShowSugerencias] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProductoId, setSelectedProductoId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  const [viewMode, setViewMode] = useState<'lugar' | 'categoria' | 'todo'>('lugar')
  const [searchQuery, setSearchQuery] = useState('')

  // Cargar filtro guardado al cambiar de lista
  useEffect(() => {
    if (!listaActiva?.id) return
    const saved = localStorage.getItem(`viewMode_${listaActiva.id}`)
    if (saved === 'categoria' || saved === 'todo' || saved === 'lugar') {
      setViewMode(saved as 'lugar' | 'categoria' | 'todo')
    } else {
      setViewMode('lugar')
    }
  }, [listaActiva?.id])

  // Guardar filtro al cambiarlo
  useEffect(() => {
    if (!listaActiva?.id) return
    localStorage.setItem(`viewMode_${listaActiva.id}`, viewMode)
  }, [viewMode, listaActiva?.id])

  useEffect(() => {
    loadSugerencias()
  }, [])


  const handleAddToLista = async () => {
  if (!selectedProductoId || !listaActiva) {
    alert('Por favor, selecciona una lista primero')
    return
  }

  const productoSeleccionado = productos.find(p => p.id === selectedProductoId)

  try {
    await addToLista({
      lista_id: listaActiva.id,
      producto_id: selectedProductoId,
      cantidad,
      usuario_añadido: userName,
      estado: 'pendiente',
      semana_compra: null,
      año_compra: null,
      notas_compra: null,
      precio_compra: null,
      lugar_compra_real: null,
    })
    
    notificarTelegram(
      productoSeleccionado?.nombre || 'Producto',
      cantidad,
      listaActiva.nombre,
      userName
    )
    
    setIsAddDialogOpen(false)
    setSelectedProductoId('')
    setCantidad('1')
  } catch (err) {
    alert('Error al añadir producto a la lista')
  }
}

  const handleAddSugerencia = async (productoId: string, nombre: string) => {
    if (!listaActiva) {
      alert('Por favor, selecciona una lista primero')
      return
    }

    try {
      await addToLista({
        lista_id: listaActiva.id,
        producto_id: productoId,
        cantidad: '1',
        usuario_añadido: userName,
        estado: 'pendiente',
        semana_compra: null,
        año_compra: null,
        notas_compra: null,
        precio_compra: null,
        lugar_compra_real: null,
      })
      loadSugerencias()
    } catch (err) {
      alert(`Error al añadir ${nombre} a la lista`)
    }
  }

  const handleUpdateCantidad = async (id: string, newCantidad: string) => {
    await updateItem(id, { cantidad: newCantidad })
  }

  const handleUpdateItem = async (id: string, updates: ItemListaUpdate) => {
    await updateItem(id, updates)
  }

  const handleLimpiarLista = async () => {
    if (
      confirm(
        '¿Eliminar todos los productos comprados e ignorados de la lista?'
      )
    ) {
      await limpiarLista()
    }
  }

  const handleMarcarTodos = async () => {
    if (confirm('¿Marcar todos los productos como comprados?')) {
      await marcarTodosComprados()
    }
  }

  const handleEliminarLista = async () => {
    if (!listaActiva) {
      alert('⚠️ No hay lista seleccionada')
      return
    }
    
    if (listaActiva.id === '00000000-0000-0000-0000-000000000001') {
      alert('⚠️ No se puede eliminar la lista por defecto')
      return
    }
    
    const confirmar = confirm(
      `¿Eliminar lista "${listaActiva.nombre}"?\n\n` +
      `⚠️ ADVERTENCIA:\n` +
      `• Se eliminarán todos los items pendientes de esta lista\n` +
      `• Los productos ya comprados se mantendrán en el histórico\n` +
      `• Esta acción NO se puede deshacer\n\n` +
      `¿Estás seguro?`
    )
    
    if (!confirmar) return
    
    try {
      await deleteLista(listaActiva.id)
    } catch (err) {
      console.error('Error al eliminar lista:', err)
    }
  }

  // Función para renderizar items agrupados
  const renderItemsAgrupados = () => {
    const itemsFiltrados = searchQuery
      ? itemsPendientes.filter((item) =>
          item.producto?.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : itemsPendientes

    if (viewMode === 'todo') {
      return (
        <div className="space-y-3">
          {itemsFiltrados.map((item) => (
            <ItemListaCard
              key={item.id}
              item={item}
              onMarcarComprado={marcarComprado}
              onMarcarPendiente={marcarPendiente}
              onDelete={deleteItem}
              onUpdateCantidad={handleUpdateCantidad}
            />
          ))}
        </div>
      )
    }

    const grupos = viewMode === 'lugar'
      ? listaService.getListaPorLugar(itemsFiltrados)
      : listaService.getListaPorCategoria(itemsFiltrados)

    return (
      <div className="space-y-6">
        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  {viewMode === 'lugar' ? (
                    <MapPin size={20} className="mr-2 text-primary-600" />
                  ) : (
                    <Grid3x3 size={20} className="mr-2 text-primary-600" />
                  )}
                  {grupo}
                </h3>
                <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <ItemListaCard
                  key={item.id}
                  item={item}
                  onMarcarComprado={marcarComprado}
                  onMarcarPendiente={marcarPendiente}
                  onDelete={deleteItem}
                  onUpdateCantidad={handleUpdateCantidad}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verificar si hay lista activa */}
      {!listaActiva ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            No hay lista seleccionada
          </h3>
          <p className="text-yellow-700">
            Por favor, selecciona o crea una lista desde el menú superior.
          </p>
        </div>
      ) : (
        <>
          {/* Header con estadísticas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {listaActiva.icono} {listaActiva.nombre}
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {itemsPendientes.length} pendientes
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  {itemsComprados.length} comprados
                </span>
              </div>
            </div>

            {/* Selector de vista */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Ver:</span>
              
              <button
                onClick={() => setViewMode('lugar')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'lugar'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin size={16} />
                <span>Por Lugar</span>
              </button>
              
              <button
                onClick={() => setViewMode('categoria')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'categoria'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 size={16} />
                <span>Por Categoría</span>
              </button>
              
              <button
                onClick={() => setViewMode('todo')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'todo'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List size={16} />
                <span>Todo</span>
              </button>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus size={20} className="mr-2" />
                Añadir Producto
              </Button>

              <Button
                variant={showSugerencias ? 'secondary' : 'ghost'}
                onClick={() => setShowSugerencias(!showSugerencias)}
              >
                {showSugerencias ? 'Ocultar' : 'Mostrar'} Sugerencias
              </Button>

              {itemsPendientes.length > 0 && (
                <Button variant="secondary" onClick={handleMarcarTodos}>
                  <CheckCircle2 size={20} className="mr-2" />
                  Marcar Todos
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
              >
                <FileText size={16} className="mr-1" />
                Aplicar Template
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleEliminarLista}
                title="Eliminar esta lista"
              >
                <Trash2 size={16} className="mr-1" />
                Eliminar Lista
              </Button>

              {(itemsComprados.length > 0) && (
                <Button variant="danger" onClick={handleLimpiarLista}>
                  <Trash2 size={20} className="mr-2" />
                  Limpiar Lista
                </Button>
              )}

              {itemsPendientes.length > 0 && (
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/compra')}
                >
                  <ShoppingBag size={16} className="mr-1" />
                  Modo Compra
                </Button>
              )}
            </div>
          </div>

          {/* Sugerencias inteligentes */}
          {showSugerencias && (
            <SugerenciasSection
              sugerencias={sugerencias}
              onAddToLista={handleAddSugerencia}
            />
          )}

          {/* Lista de productos pendientes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Productos Pendientes
            </h3>

            {itemsPendientes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No hay productos pendientes en tu lista
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Añadir primer producto
                </Button>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto..."
                    className="pl-9"
                  />
                </div>
                {renderItemsAgrupados()}
              </>
            )}
          </div>

          {/* Lista de productos comprados (colapsada) */}
          {itemsComprados.length > 0 && (
            <details className="bg-white rounded-lg border border-gray-200 p-6">
              <summary className="text-lg font-semibold text-gray-900 cursor-pointer">
                Productos Comprados ({itemsComprados.length})
              </summary>
              <div className="mt-4 space-y-3">
                {itemsComprados.map((item) => (
                  <ItemListaCard
                    key={item.id}
                    item={item}
                    onMarcarComprado={marcarComprado}
                    onMarcarPendiente={marcarPendiente}
                    onDelete={deleteItem}
                    onUpdateCantidad={handleUpdateCantidad}
                    onUpdateItem={handleUpdateItem}
                  />
                ))}
              </div>
            </details>
          )}

          {/* Dialog para añadir producto */}
          <Dialog
            open={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            title="Añadir Producto a la Lista"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={selectedProductoId}
                  onChange={(e) => setSelectedProductoId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                      {producto.lugar_compra_habitual &&
                        ` - ${producto.lugar_compra_habitual}`}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 1, 2 kg, 1 litro..."
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddToLista} disabled={!selectedProductoId}>
                  Añadir a Lista
                </Button>
              </div>
            </div>
          </Dialog>

          {/* Modal de templates */}
          {showTemplateSelector && (
            <TemplateSelector
              onClose={() => setShowTemplateSelector(false)}
              onSuccess={loadLista}
            />
          )}
        </>
      )}
    </div>
  )
}
