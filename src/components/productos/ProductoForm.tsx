import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ComboBox } from '../ui/ComboBox'
import { Producto } from '../../lib/supabase'
import { useProductos } from '../../hooks/useProductos'

interface ProductoFormProps {
  producto?: Producto
  onSuccess: () => void
  onCancel: () => void
}

export function ProductoForm({ producto, onSuccess, onCancel }: ProductoFormProps) {
  const { createProducto, updateProducto, getCategorias, getLugaresCompra } = useProductos()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Opciones para los ComboBox
  const [categorias, setCategorias] = useState<string[]>([])
  const [lugares, setLugares] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    lugar_compra_habitual: '',
    frecuencia_manual: '',
    notas: '',
    precio: '',
  })

  useEffect(() => {
    // Cargar categorías y lugares existentes
    loadOptions()
  }, [])

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        categoria: producto.categoria || '',
        lugar_compra_habitual: producto.lugar_compra_habitual || '',
        frecuencia_manual: producto.frecuencia_manual?.toString() || '',
        notas: producto.notas || '',
        precio: producto.precio?.toString() || '',
      })
    }
  }, [producto])

  const loadOptions = async () => {
    try {
      const [categoriasData, lugaresData] = await Promise.all([
        getCategorias(),
        getLugaresCompra(),
      ])
      setCategorias(categoriasData)
      setLugares(lugaresData)
    } catch (err) {
      console.error('Error al cargar opciones:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        nombre: formData.nombre,
        categoria: formData.categoria || null,
        lugar_compra_habitual: formData.lugar_compra_habitual || null,
        frecuencia_manual: formData.frecuencia_manual
          ? parseInt(formData.frecuencia_manual)
          : null,
        notas: formData.notas || null,
        activo: true,
        usuario_creador: 'Usuario',
        frecuencia_calculada: null,
        ultima_compra: null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        fecha_actualizacion_precio: null,
      }

      if (producto) {
        await updateProducto(producto.id, data)
      } else {
        await createProducto(data)
      }

      onSuccess()
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Nombre del producto *"
        value={formData.nombre}
        onChange={(e) => handleChange('nombre', e.target.value)}
        required
        placeholder="Ej: Leche desnatada"
      />

      <ComboBox
        label="Categoría"
        value={formData.categoria}
        onChange={(value) => handleChange('categoria', value)}
        options={categorias}
        placeholder="Selecciona o escribe nueva categoría"
      />

      <ComboBox
        label="Lugar de compra habitual"
        value={formData.lugar_compra_habitual}
        onChange={(value) => handleChange('lugar_compra_habitual', value)}
        options={lugares}
        placeholder="Selecciona o escribe nuevo lugar"
      />

      <Input
        label="Frecuencia de compra (días)"
        type="number"
        value={formData.frecuencia_manual}
        onChange={(e) => handleChange('frecuencia_manual', e.target.value)}
        placeholder="Ej: 7 (compra semanal)"
        min="1"
      />

      <Input
        label="Precio habitual (€)"
        type="number"
        step="0.01"
        value={formData.precio}
        onChange={(e) => handleChange('precio', e.target.value)}
        placeholder="Ej: 1.49"
        min="0"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          value={formData.notas}
          onChange={(e) => handleChange('notas', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          placeholder="Notas adicionales..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  )
}
