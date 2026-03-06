import { Lightbulb, Plus, TrendingUp } from 'lucide-react'
import { Sugerencia } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { getPriorityColor, getPriorityText, formatRelativeDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface SugerenciasSectionProps {
  sugerencias: Sugerencia[]
  onAddToLista: (productoId: string, nombre: string) => void
  isLoading?: boolean
}

export function SugerenciasSection({
  sugerencias,
  onAddToLista,
  isLoading,
}: SugerenciasSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (sugerencias.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="text-yellow-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">
            Sugerencias Inteligentes
          </h3>
        </div>
        <p className="text-gray-600">
          No hay sugerencias en este momento. Las sugerencias se generan basándose en tu
          histórico de compras.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Lightbulb className="text-yellow-500" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sugerencias Inteligentes
            </h3>
            <p className="text-sm text-gray-600">
              Basadas en tu histórico de compras
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-500">{sugerencias.length} productos</span>
      </div>

      <div className="space-y-3">
        {sugerencias.map((sugerencia) => (
          <div
            key={sugerencia.producto_id}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border',
              getPriorityColor(sugerencia.prioridad)
            )}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    sugerencia.prioridad >= 4
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {getPriorityText(sugerencia.prioridad)}
                </div>
                <h4 className="font-medium text-gray-900">{sugerencia.nombre}</h4>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {sugerencia.lugar_compra && (
                  <span>📍 {sugerencia.lugar_compra}</span>
                )}
                <span>
                  🕐 Cada {sugerencia.frecuencia_usada} días
                </span>
                <span>
                  📅 Última compra: {formatRelativeDate(sugerencia.ultima_compra)}
                </span>
                <span className="font-medium">
                  ({sugerencia.dias_desde_ultima} días transcurridos)
                </span>
                {sugerencia.precio_medio !== null && sugerencia.precio_medio > 0 && (
                  <span>💰 ~{sugerencia.precio_medio.toFixed(2)} €</span>
                )}
              </div>

              {sugerencia.categoria && (
                <p className="mt-1 text-xs text-gray-500">
                  {sugerencia.categoria}
                </p>
              )}
            </div>

            <Button
              size="sm"
              onClick={() =>
                onAddToLista(sugerencia.producto_id, sugerencia.nombre)
              }
              className="ml-4"
            >
              <Plus size={16} className="mr-1" />
              Añadir
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <TrendingUp size={16} className="text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Las sugerencias se calculan automáticamente según tu
            patrón de compras. Los productos marcados como "Urgente" o "Muy urgente"
            deberían comprarse pronto.
          </p>
        </div>
      </div>
    </div>
  )
}
