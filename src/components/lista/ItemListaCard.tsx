import { useState } from 'react'
import { Check, Trash2, MapPin, Edit2 } from 'lucide-react'
import { ItemLista } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../../lib/utils'

interface ItemListaCardProps {
  item: ItemLista
  onMarcarComprado: (id: string, precio?: number, lugar?: string) => void
  onMarcarPendiente: (id: string) => void
  onDelete: (id: string) => void
  onUpdateCantidad: (id: string, cantidad: string) => void
}

export function ItemListaCard({
  item,
  onMarcarComprado,
  onMarcarPendiente,
  onDelete,
  onUpdateCantidad,
}: ItemListaCardProps) {
  const [showPrecioInput, setShowPrecioInput] = useState(false)
  const [precio, setPrecio] = useState('')
  const [lugarCompra, setLugarCompra] = useState(
    item.producto?.lugar_compra_habitual || ''
  )
  const [editingCantidad, setEditingCantidad] = useState(false)
  const [cantidad, setCantidad] = useState(item.cantidad)

  const isComprado = item.estado === 'comprado'

  const handleMarcarComprado = () => {
    if (showPrecioInput) {
      const precioNum = precio ? parseFloat(precio) : undefined
      onMarcarComprado(item.id, precioNum, lugarCompra)
      setShowPrecioInput(false)
      setPrecio('')
    } else {
      setShowPrecioInput(true)
    }
  }

  const handleMarcarPendiente = () => {
    onMarcarPendiente(item.id)
    setShowPrecioInput(false)
  }

  const handleSaveCantidad = () => {
    onUpdateCantidad(item.id, cantidad)
    setEditingCantidad(false)
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-all',
        isComprado
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <button
              onClick={isComprado ? handleMarcarPendiente : handleMarcarComprado}
              className={cn(
                'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                isComprado
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 hover:border-primary-500'
              )}
            >
              {isComprado && <Check size={16} />}
            </button>

            <div className="flex-1">
              <h4
                className={cn(
                  'font-medium text-lg',
                  isComprado ? 'text-gray-600 line-through' : 'text-gray-900'
                )}
              >
                {item.producto?.nombre}
              </h4>

              {editingCantidad ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-32 text-sm"
                    placeholder="Cantidad"
                  />
                  <Button size="sm" onClick={handleSaveCantidad}>
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCantidad(item.cantidad)
                      setEditingCantidad(false)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                  <button
                    onClick={() => setEditingCantidad(true)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              {item.producto?.lugar_compra_habitual && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin size={14} className="mr-1" />
                  {item.producto.lugar_compra_habitual}
                </div>
              )}

              {isComprado && item.precio_compra && (
                <p className="text-sm text-green-700 mt-1 font-medium">
                  Precio: {item.precio_compra.toFixed(2)} €
                </p>
              )}
            </div>
          </div>

          {/* Inputs para precio y lugar cuando se marca como comprado */}
          {showPrecioInput && !isComprado && (
            <div className="mt-3 space-y-2 pl-9">
              <Input
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Precio (opcional)"
                className="w-32"
              />
              <Input
                value={lugarCompra}
                onChange={(e) => setLugarCompra(e.target.value)}
                placeholder="Lugar de compra"
                className="w-48"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleMarcarComprado}>
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPrecioInput(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(item.id)}
          className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
