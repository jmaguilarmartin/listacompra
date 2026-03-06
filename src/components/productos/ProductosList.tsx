import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ProductoCard } from './ProductoCard'
import { ProductoForm } from './ProductoForm'
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

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              onAddToLista={onAddToLista}
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
                  onAddToLista={onAddToLista}
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
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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

      {/* Lista de productos */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm
              ? 'No se encontraron productos'
              : 'No hay productos registrados'}
          </p>
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
