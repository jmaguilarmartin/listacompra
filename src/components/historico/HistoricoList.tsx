import { useState, useEffect } from 'react'
import { Calendar, MapPin, Package } from 'lucide-react'
import { getTodoElHistorico } from '../../services/calculosService'
import { HistoricoCompra } from '../../lib/supabase'
import { formatDate, formatPrice } from '../../lib/utils'

export function HistoricoList() {
  const [historico, setHistorico] = useState<HistoricoCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cronologico' | 'producto'>('cronologico')

  useEffect(() => {
    loadHistorico()
  }, [])

  const loadHistorico = async () => {
    setLoading(true)
    try {
      const data = await getTodoElHistorico(200)
      setHistorico(data)
    } catch (err) {
      console.error('Error al cargar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (historico.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin Histórico
        </h3>
        <p className="text-gray-600">
          Aún no has completado ninguna compra. El histórico se generará
          automáticamente cuando marques productos como comprados.
        </p>
      </div>
    )
  }

  const renderCronologico = () => {
    // Agrupar por fecha
    const porFecha = historico.reduce((acc, item) => {
      const fecha = item.fecha_compra
      if (!acc[fecha]) {
        acc[fecha] = []
      }
      acc[fecha].push(item)
      return acc
    }, {} as Record<string, HistoricoCompra[]>)

    return (
      <div className="space-y-6">
        {Object.entries(porFecha)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([fecha, items]) => (
            <div key={fecha} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {formatDate(fecha, 'EEEE, d MMMM yyyy')}
              </h3>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.producto?.nombre}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {item.cantidad && (
                          <span>Cantidad: {item.cantidad}</span>
                        )}
                        {item.lugar_compra && (
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {item.lugar_compra}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.precio && (
                      <div className="ml-4 text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.precio)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total del día */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total del día:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(
                    items.reduce((sum, item) => sum + (item.precio || 0), 0)
                  )}
                </span>
              </div>
            </div>
          ))}
      </div>
    )
  }

  const renderPorProducto = () => {
    const porProducto = historico.reduce((acc, item) => {
      const nombre = item.producto?.nombre || 'Desconocido'
      if (!acc[nombre]) {
        acc[nombre] = []
      }
      acc[nombre].push(item)
      return acc
    }, {} as Record<string, HistoricoCompra[]>)

    return (
      <div className="space-y-4">
        {Object.entries(porProducto)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([nombre, items]) => (
            <div key={nombre} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{nombre}</h3>
                <span className="text-sm text-gray-600">
                  {items.length} compras
                </span>
              </div>

              <div className="space-y-2">
                {items
                  .sort(
                    (a, b) =>
                      new Date(b.fecha_compra).getTime() -
                      new Date(a.fecha_compra).getTime()
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Calendar size={16} />
                        <span>{formatDate(item.fecha_compra)}</span>
                        {item.lugar_compra && (
                          <>
                            <MapPin size={16} />
                            <span>{item.lugar_compra}</span>
                          </>
                        )}
                      </div>
                      {item.precio && (
                        <span className="font-medium text-gray-900">
                          {formatPrice(item.precio)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {/* Estadísticas del producto */}
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Precio promedio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(
                      items
                        .filter((i) => i.precio)
                        .reduce((sum, i) => sum + (i.precio || 0), 0) /
                        items.filter((i) => i.precio).length || 0
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Precio mínimo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(
                      Math.min(...items.map((i) => i.precio || Infinity))
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Precio máximo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(
                      Math.max(...items.map((i) => i.precio || 0))
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de Compras
            </h2>
            <p className="text-gray-600 mt-1">
              {historico.length} compras registradas
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('cronologico')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'cronologico'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Por Fecha
            </button>
            <button
              onClick={() => setViewMode('producto')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'producto'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Por Producto
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {viewMode === 'cronologico' ? renderCronologico() : renderPorProducto()}
    </div>
  )
}
