import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, MapPin, CheckCircle2, Clock } from 'lucide-react'
import { getListaByToken } from '../services/listasService'
import { getListaPendiente, getListaPorLugar } from '../services/listaService'
import type { Lista, ItemLista } from '../lib/supabase'

export function ListaCompartidaPage() {
  const { token } = useParams<{ token: string }>()
  const [lista, setLista] = useState<Lista | null>(null)
  const [items, setItems] = useState<ItemLista[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    const cargar = async () => {
      try {
        const l = await getListaByToken(token)
        if (!l) { setNotFound(true); return }
        setLista(l)
        const todos = await getListaPendiente(l.id)
        setItems(todos)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (notFound || !lista) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-md shadow-lg">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Lista no encontrada</h2>
          <p className="text-gray-500 dark:text-gray-400">El enlace es incorrecto o la lista ha sido eliminada.</p>
        </div>
      </div>
    )
  }

  const pendientes = items.filter((i) => i.estado === 'pendiente')
  const comprados = items.filter((i) => i.estado === 'comprado')
  const porLugar = getListaPorLugar(pendientes)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-primary-600 text-white px-4 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingCart size={24} />
            <h1 className="text-2xl font-bold">{lista.icono} {lista.nombre}</h1>
          </div>
          <p className="text-primary-100 text-sm">Lista compartida · solo lectura</p>
          <div className="flex gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1 text-primary-100">
              <Clock size={14} /> {pendientes.length} pendientes
            </span>
            <span className="flex items-center gap-1 text-primary-100">
              <CheckCircle2 size={14} /> {comprados.length} comprados
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Pendientes agrupados */}
        {pendientes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">¡Todo comprado!</p>
          </div>
        ) : (
          Object.entries(porLugar).map(([lugar, grupoItems]) => (
            <div key={lugar} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">{lugar}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{grupoItems.length}</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {grupoItems.map((item) => (
                  <div key={item.id} className="flex items-center px-4 py-3 gap-3">
                    <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.producto?.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        × {item.cantidad}{item.producto?.unidad ? ` ${item.producto.unidad}` : ''}
                      </p>
                    </div>
                    {item.producto?.foto_url && (
                      <img src={item.producto.foto_url} alt={item.producto.nombre}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Comprados */}
        {comprados.length > 0 && (
          <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <summary className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              Comprados ({comprados.length})
            </summary>
            <div className="mt-3 space-y-2">
              {comprados.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  <span className="line-through">{item.producto?.nombre}</span>
                  {item.precio_compra && (
                    <span className="ml-auto text-sm text-green-600">{item.precio_compra.toFixed(2)} €</span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
          Lista de Compra Inteligente · vista de solo lectura
        </p>
      </div>
    </div>
  )
}
