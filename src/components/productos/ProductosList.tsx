import { useState } from 'react'
import { Plus, Search, Barcode } from 'lucide-react'
import { ProductoCard } from './ProductoCard'
import { ProductoForm } from './ProductoForm'
import { BarcodeScanner } from './BarcodeScanner'
import { HistoricoPreciosDialog } from './HistoricoPreciosDialog'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProductos } from '../../hooks/useProductos'
import { Producto } from '../../lib/supabase'
import { groupBy } from '../../lib/utils'

interface ProductosListProps {
  onAddToLista?: (producto: Producto, cantidad: string) => void
}

export function ProductosList({ onAddToLista }: ProductosListProps) {
  const { productos, deleteProducto } = useProductos()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | undefined>()
  const [productoHistorial, setProductoHistorial] = useState<Producto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'categoria' | 'lugar'>('all')

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProducto(id)
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingProducto(undefined)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingProducto(undefined)
  }

  const handleBarcodeSearch = (code: string) => {
    setShowBarcodeSearch(false)
    setSearchTerm(code)
  }

  // Filtrar productos por búsqueda (nombre o código de barras)
  const filteredProductos = productos.filter((p) => {
    const term = searchTerm.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.codigo_barras && p.codigo_barras.includes(searchTerm))
    )
  })

  // Resetear búsqueda tras añadir a la lista
  const handleAddToListaConReset = onAddToLista
    ? (producto: Producto, cantidad: string) => {
        onAddToLista(producto, cantidad)
        setSearchTerm('')
      }
    : undefined

  // Agrupar productos según el modo de vista
  const renderProductos = () => {
    if (viewMode === 'all') {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProductos.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddToLista={handleAddToListaConReset}
              onVerHistorial={setProductoHistorial}
            />
          ))}
        </div>
      )
    }

    const grouped =
      viewMode === 'categoria'
        ? groupBy(filteredProductos, 'categoria')
        : groupBy(filteredProductos, 'lugar_compra_habitual')

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([key, items]) => (
          <div key={key}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {key || 'Sin clasificar'}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddToLista={handleAddToListaConReset}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Barra de acciones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowBarcodeSearch(true)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
              title="Buscar por código de barras"
            >
              <Barcode size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            Todos
          </Button>
          <Button
            variant={viewMode === 'categoria' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('categoria')}
          >
            Por Categoría
          </Button>
          <Button
            variant={viewMode === 'lugar' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('lugar')}
          >
            Por Lugar
          </Button>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus size={20} className="mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Scanner para búsqueda */}
      {showBarcodeSearch && (
        <BarcodeScanner
          onDetected={handleBarcodeSearch}
          onClose={() => setShowBarcodeSearch(false)}
        />
      )}

      {/* Lista de productos */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-gray-500">
            {searchTerm
              ? 'No se encontraron productos'
              : 'No hay productos registrados'}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setIsFormOpen(true)
                setEditingProducto(undefined)
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              + Crear producto nuevo
            </button>
          )}
        </div>
      ) : (
        renderProductos()
      )}

      {/* Modal de formulario */}
      <Dialog
        open={isFormOpen}
        onClose={handleFormCancel}
        title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="md"
      >
        <ProductoForm
          producto={editingProducto}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Dialog>

      {/* Historial de precios */}
      {productoHistorial && (
        <HistoricoPreciosDialog
          producto={productoHistorial}
          onClose={() => setProductoHistorial(null)}
        />
      )}
    </div>
  )
}
