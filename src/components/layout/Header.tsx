import { ShoppingCart } from 'lucide-react'
import { useListas } from '../../hooks/useListas'

export function Header() {
  const { listas, listaActiva, cambiarListaActiva, createLista } = useListas()

  // DEBUG - Ver qué está pasando
  console.log('🔍 DEBUG Header:', {
    cantidadListas: listas?.length || 0,
    listaActiva: listaActiva?.nombre || 'ninguna',
  })

  const handleCrearLista = async () => {
    const nombre = prompt('Nombre de la nueva lista:', 'Mi Nueva Lista')
    if (nombre && nombre.trim()) {
      try {
        await createLista({
          nombre: nombre.trim(),
          descripcion: null,
          usuario_creador: 'Usuario',
          es_template: false,
          icono: '📝',
          color: '#0ea5e9',
          activa: true,
        })
        alert('✅ Lista creada correctamente')
      } catch (error) {
        console.error('Error al crear lista:', error)
        alert('❌ Error al crear lista')
      }
    }
  }
const handleCambiarLista = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lista = listas.find((l) => l.id === e.target.value)
    if (lista) {
      console.log('📝 Cambiando a lista:', lista.nombre)
      cambiarListaActiva(lista)
      // Forzar recarga para actualizar toda la app
      window.location.reload()
    }
  }
 
 return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo y título - visible en desktop, oculto en mobile */}
          <div className="hidden sm:flex items-center space-x-3">
            <ShoppingCart size={32} />
            <div>
              <h1 className="text-2xl font-bold">Lista de Compra</h1>
              <p className="text-sm text-primary-100">Gestión Inteligente</p>
            </div>
          </div>

          {/* Selector de Listas - responsive */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-center sm:justify-end">
            {listas && listas.length > 0 ? (
              <select
                value={listaActiva?.id || ''}
                onChange={handleCambiarLista}
                className="w-full max-w-[200px] sm:max-w-none sm:w-auto px-3 py-2 bg-white text-gray-800 border-2 border-primary-500 rounded-lg font-medium focus:outline-none text-sm sm:text-base"
              >
                {listas.map((lista) => (
                  <option key={lista.id} value={lista.id}>
                    {lista.icono} {lista.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-2 bg-primary-700 rounded-lg text-sm">
                Cargando...
              </span>
            )}

            <button
              onClick={handleCrearLista}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 flex items-center justify-center bg-white text-primary-600 rounded-lg font-bold hover:bg-primary-50 transition-colors flex-shrink-0"
              title="Crear nueva lista"
            >
              <span className="sm:hidden text-xl">+</span>
              <span className="hidden sm:inline">+ Lista</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}