import { Edit2, Trash2, MapPin, Calendar, Clock } from 'lucide-react'
import { Producto } from '../../lib/supabase'
import { formatRelativeDate } from '../../lib/utils'
import { Button } from '../ui/Button'

interface ProductoCardProps {
  producto: Producto
  onEdit: (producto: Producto) => void
  onDelete: (id: string) => void
  onAddToLista?: (producto: Producto, cantidad: string) => void
}

export function ProductoCard({
  producto,
  onEdit,
  onDelete,
  onAddToLista,
}: ProductoCardProps) {
  const handleAddClick = () => {
    if (onAddToLista) {
      // Preguntar cantidad mediante prompt
      const cantidad = prompt('¿Cantidad?', '1')
      if (cantidad !== null && cantidad.trim() !== '') {
        onAddToLista(producto, cantidad.trim())
      }
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {producto.nombre}
          </h3>

          {producto.categoria && (
            <p className="text-sm text-gray-600 mt-1">
              {producto.categoria}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {producto.lugar_compra_habitual && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-2 text-gray-400" />
                {producto.lugar_compra_habitual}
              </div>
            )}

            {producto.ultima_compra && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2 text-gray-400" />
                Última compra: {formatRelativeDate(producto.ultima_compra)}
              </div>
            )}

            {(producto.frecuencia_manual || producto.frecuencia_calculada) && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2 text-gray-400" />
                Cada{' '}
                {producto.frecuencia_manual || producto.frecuencia_calculada}{' '}
                días
                {!producto.frecuencia_manual && (
                  <span className="ml-1 text-xs text-gray-400">(auto)</span>
                )}
              </div>
            )}
          </div>

          {producto.notas && (
            <p className="mt-3 text-sm text-gray-500 italic">
              {producto.notas}
            </p>
          )}
        </div>

        <div className="ml-4 flex flex-col space-y-2">
          {onAddToLista && (
            <Button
              size="sm"
              onClick={handleAddClick}
              variant="primary"
            >
              Añadir
            </Button>
          )}
          <button
            onClick={() => onEdit(producto)}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
            title="Editar"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(producto.id)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
