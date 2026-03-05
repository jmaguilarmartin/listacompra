import { ProductosList } from '../components/productos/ProductosList'
import { useListaCompra } from '../hooks/useListaCompra'
import { useListas } from '../hooks/useListas'
import { Producto } from '../lib/supabase'
import { notificarTelegram } from '../services/telegramService'
import { useUserName } from '../hooks/useUserName'

export function ProductosPage() {
  const { addToLista } = useListaCompra()
  const { userName } = useUserName()
  const { listaActiva } = useListas()


  const handleAddToLista = async (producto: Producto, cantidad: string) => {
    console.log('🔍 Añadiendo producto:', producto.nombre, 'Cantidad:', cantidad)
    console.log('🔍 Producto ID:', producto.id)
    // Verificar que hay lista activa
    if (!listaActiva) {
      alert('⚠️ No hay lista activa. Por favor, selecciona o crea una lista primero.')
      return
    }

    try {
      await addToLista({
        lista_id: listaActiva.id,
        producto_id: producto.id,
        cantidad: cantidad,
        usuario_añadido: userName,
        estado: 'pendiente',
        semana_compra: null,
        año_compra: null,
        notas_compra: null,
        precio_compra: null,
        lugar_compra_real: null,
      })

      console.log('📦 Producto añadido:', producto.nombre, cantidad)

      // 🆕 ENVIAR NOTIFICACIÓN A TELEGRAM
      notificarTelegram(
      producto.nombre,
      cantidad,
      listaActiva.nombre,
      userName
    )

      alert(`✅ ${producto.nombre} (${cantidad}) añadido a ${listaActiva.icono} ${listaActiva.nombre}`)
    } catch (err) {
      const error = err as Error
      console.error('Error al añadir:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mis Productos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu catálogo de productos y añádelos fácilmente a tu lista de compra
        </p>
        
        {/* Mostrar lista activa */}
        {listaActiva && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg">
            <span className="font-medium">
              Añadiendo a: {listaActiva.icono} {listaActiva.nombre}
            </span>
          </div>
        )}
      </div>
      
      <ProductosList onAddToLista={handleAddToLista} />
    </div>
  )
}