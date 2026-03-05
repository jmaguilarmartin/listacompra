import { useState, useEffect } from 'react'
import { Check, ShoppingCart, ArrowLeft, MapPin, Grid3x3, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useListaCompra } from '../../hooks/useListaCompra'
import { useListas } from '../../hooks/useListas'
import * as listaService from '../../services/listaService'

export function ModoCompra() {
  const navigate = useNavigate()
  const { listaActiva } = useListas()
  const { itemsPendientes, marcarComprado } = useListaCompra(listaActiva?.id)
  const [marcando, setMarcando] = useState<string | null>(null)
  
  // Estado de agrupación con persistencia
  const [modoAgrupacion, setModoAgrupacion] = useState<'lugar' | 'categoria' | 'todo'>(() => {
    const saved = localStorage.getItem('modoAgrupacionCompra')
    if (saved === 'categoria' || saved === 'todo' || saved === 'lugar') {
      return saved as 'lugar' | 'categoria' | 'todo'
    }
    return 'lugar'
  })

  // Guardar preferencia
  useEffect(() => {
    localStorage.setItem('modoAgrupacionCompra', modoAgrupacion)
  }, [modoAgrupacion])

  // Agrupar según el modo seleccionado
  const itemsAgrupados = modoAgrupacion === 'todo'
    ? { 'Todos los productos': itemsPendientes }
    : modoAgrupacion === 'lugar'
      ? listaService.getListaPorLugar(itemsPendientes)
      : listaService.getListaPorCategoria(itemsPendientes)

  const handleMarcarComprado = async (id: string) => {
    try {
      setMarcando(id)
      await marcarComprado(id)
      setTimeout(() => setMarcando(null), 300)
    } catch (err) {
      console.error('Error:', err)
      setMarcando(null)
    }
  }

  if (!listaActiva) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No hay lista seleccionada
          </h2>
          <p className="text-gray-600 mb-6">
            Selecciona una lista para comenzar a comprar
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo */}
      <header className="bg-primary-600 text-white shadow-lg sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">
                {listaActiva.icono} {listaActiva.nombre}
              </h1>
              <p className="text-sm text-primary-100">
                {itemsPendientes.length} productos pendientes
              </p>
            </div>

            <div className="w-10" />
          </div>
          
          {/* Selector de agrupación */}
          <div className="flex items-center justify-center space-x-2 mt-3">
            <button
              onClick={() => setModoAgrupacion('lugar')}
              className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                modoAgrupacion === 'lugar'
                  ? 'bg-white text-primary-600'
                  : 'bg-primary-700 text-primary-100 hover:bg-primary-800'
              }`}
            >
              <MapPin size={16} />
              <span className="hidden xs:inline">Lugar</span>
            </button>
            
            <button
              onClick={() => setModoAgrupacion('categoria')}
              className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                modoAgrupacion === 'categoria'
                  ? 'bg-white text-primary-600'
                  : 'bg-primary-700 text-primary-100 hover:bg-primary-800'
              }`}
            >
              <Grid3x3 size={16} />
              <span className="hidden xs:inline">Categoría</span>
            </button>
            
            <button
              onClick={() => setModoAgrupacion('todo')}
              className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                modoAgrupacion === 'todo'
                  ? 'bg-white text-primary-600'
                  : 'bg-primary-700 text-primary-100 hover:bg-primary-800'
              }`}
            >
              <List size={16} />
              <span className="hidden xs:inline">Todo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Lista de compra */}
      <div className="max-w-2xl mx-auto p-4 pb-20">
        {itemsPendientes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Check size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Lista completada!
            </h2>
            <p className="text-gray-600 mb-6">
              Has comprado todos los productos
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(itemsAgrupados).map(([grupo, items]) => (
              <div key={grupo} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header del grupo - Oculto en modo "todo" */}
                {modoAgrupacion !== 'todo' && (
                  <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
                    <div className="flex items-center">
                      {modoAgrupacion === 'lugar' ? (
                        <MapPin size={20} className="mr-2 text-primary-600" />
                      ) : (
                        <Grid3x3 size={20} className="mr-2 text-primary-600" />
                      )}
                      <div>
                        <h3 className="font-bold text-primary-900 text-lg">
                          {grupo}
                        </h3>
                        <p className="text-sm text-primary-700">
                          {items.length} {items.length === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMarcarComprado(item.id)}
                      disabled={marcando === item.id}
                      className={`w-full px-4 py-5 flex items-center space-x-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        marcando === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          marcando === item.id
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {marcando === item.id && (
                            <Check size={20} className="text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {item.producto?.nombre || 'Producto'}
                        </h4>
                        {item.cantidad && (
                          <p className="text-gray-600 text-base">
                            {item.cantidad}
                          </p>
                        )}
                        {/* Mostrar info adicional según agrupación */}
                        {modoAgrupacion === 'categoria' && item.producto?.lugar_compra_habitual && (
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin size={14} className="mr-1" />
                            {item.producto.lugar_compra_habitual}
                          </p>
                        )}
                        {modoAgrupacion === 'lugar' && item.producto?.categoria && (
                          <p className="text-sm text-gray-500">
                            {item.producto.categoria}
                          </p>
                        )}
                        {modoAgrupacion === 'todo' && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.producto?.categoria && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {item.producto.categoria}
                              </span>
                            )}
                            {item.producto?.lugar_compra_habitual && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center">
                                <MapPin size={12} className="mr-1" />
                                {item.producto.lugar_compra_habitual}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}