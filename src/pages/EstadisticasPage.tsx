import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react'
import { getTodoElHistorico } from '../services/calculosService'
import { useProductos } from '../hooks/useProductos'
import { formatPrice } from '../lib/utils'

export function EstadisticasPage() {
  const { productos } = useProductos()
  const [stats, setStats] = useState({
    totalCompras: 0,
    totalGastado: 0,
    promedioCompra: 0,
    productosMasComprados: [] as { nombre: string; cantidad: number }[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const historico = await getTodoElHistorico(1000)

      const totalCompras = historico.length
      const totalGastado = historico.reduce(
        (sum, item) => sum + (item.precio || 0),
        0
      )
      const promedioCompra = totalCompras > 0 ? totalGastado / totalCompras : 0

      // Productos más comprados
      const conteo: Record<string, number> = {}
      historico.forEach((item) => {
        const nombre = item.producto?.nombre || 'Desconocido'
        conteo[nombre] = (conteo[nombre] || 0) + 1
      })

      const productosMasComprados = Object.entries(conteo)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10)

      setStats({
        totalCompras,
        totalGastado,
        promedioCompra,
        productosMasComprados,
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-600 mt-2">
          Análisis de tus patrones de compra
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalCompras}
              </p>
            </div>
            <ShoppingCart className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatPrice(stats.totalGastado)}
              </p>
            </div>
            <DollarSign className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio por Compra</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatPrice(stats.promedioCompra)}
              </p>
            </div>
            <TrendingUp className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {productos.length}
              </p>
            </div>
            <Calendar className="text-purple-600" size={40} />
          </div>
        </div>
      </div>

      {/* Top productos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Productos Más Comprados
        </h3>

        {stats.productosMasComprados.length === 0 ? (
          <p className="text-gray-600">
            Aún no hay suficientes datos para mostrar estadísticas
          </p>
        ) : (
          <div className="space-y-3">
            {stats.productosMasComprados.map((producto, index) => (
              <div
                key={producto.nombre}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">
                    {producto.nombre}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {producto.cantidad} compras
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mensaje informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Las estadísticas se actualizan en tiempo real
          según tu histórico de compras. Cuanto más uses la aplicación, más
          precisas serán las sugerencias inteligentes.
        </p>
      </div>
    </div>
  )
}
