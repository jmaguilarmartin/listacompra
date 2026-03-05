import { ListaCompra } from '../components/lista/ListaCompra'
import { useListas } from '../hooks/useListas'

export function Home() {
  const { listaActiva, isLoading } = useListas()
  
  // Esperar a que cargue la lista activa
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!listaActiva) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          No hay listas disponibles
        </h3>
        <p className="text-yellow-700">
          Por favor, crea una lista desde el menú superior.
        </p>
      </div>
    )
  }
  
  return <ListaCompra key={listaActiva.id} />
}