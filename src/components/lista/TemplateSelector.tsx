import { useState } from 'react'
import { X, FileText, Plus } from 'lucide-react'
import { useTemplates } from '../../hooks/useTemplates'
import { useListas } from '../../hooks/useListas'

interface TemplateSelectorProps {
  onClose: () => void
  onSuccess?: () => void
}

export function TemplateSelector({ onClose, onSuccess }: TemplateSelectorProps) {
  const { templates, aplicarTemplate } = useTemplates()
  const { listaActiva } = useListas()
  const [aplicando, setAplicando] = useState<string | null>(null)

  const handleAplicar = async (templateId: string) => {
    if (!listaActiva) {
      alert('No hay lista activa')
      return
    }

    try {
      setAplicando(templateId)
      const itemsAñadidos = await aplicarTemplate(templateId, listaActiva.id)
      onSuccess?.()
      onClose()
      console.log(`Template aplicado: ${itemsAñadidos} productos añadidos`)
    } catch (err) {
      console.error('Error al aplicar template:', err)
      alert('❌ Error al aplicar template')
      setAplicando(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center">
            <FileText size={24} className="mr-2" />
            Aplicar Template
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-700 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {listaActiva && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lista destino:</strong> {listaActiva.icono} {listaActiva.nombre}
              </p>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No hay templates disponibles</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleAplicar(template.id)}
                  disabled={aplicando === template.id}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:border-primary-500 hover:bg-primary-50 ${
                    aplicando === template.id
                      ? 'opacity-50 cursor-not-allowed'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">
                        {template.icono} {template.nombre}
                      </h4>
                      {template.descripcion && (
                        <p className="text-sm text-gray-600">
                          {template.descripcion}
                        </p>
                      )}
                    </div>
                    <Plus
                      size={24}
                      className={`flex-shrink-0 ml-3 ${
                        aplicando === template.id
                          ? 'text-gray-400'
                          : 'text-primary-600'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}