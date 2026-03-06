import { useState, useEffect } from 'react'
import { Producto, HistoricoPrecios } from '../../lib/supabase'
import { Dialog } from '../ui/Dialog'
import { getHistoricoPrecios } from '../../services/productosService'
import { formatDate, formatPrice } from '../../lib/utils'

interface HistoricoPreciosDialogProps {
  producto: Producto
  onClose: () => void
}

export function HistoricoPreciosDialog({ producto, onClose }: HistoricoPreciosDialogProps) {
  const [historial, setHistorial] = useState<HistoricoPrecios[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistoricoPrecios(producto.id)
      .then(setHistorial)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [producto.id])

  return (
    <Dialog open onClose={onClose} title={`Historial de precios: ${producto.nombre}`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : historial.length === 0 ? (
        <p className="text-gray-600 py-4 text-center">
          No hay cambios de precio registrados todavía.
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {historial.map((h, index) => (
            <div
              key={h.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm text-gray-600">
                  {formatDate(h.fecha_cambio, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">{formatPrice(h.precio)}</span>
                {index === 0 && (
                  <span className="ml-2 text-xs text-green-600 font-medium">(actual)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  )
}
