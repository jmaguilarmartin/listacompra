import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { IScannerControls } from '@zxing/browser'
import { X } from 'lucide-react'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

function diagnosticarError(err: unknown): string {
  if (!window.isSecureContext) {
    return 'La cámara requiere HTTPS. Usa la entrada manual o accede por localhost.'
  }
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') return 'Permiso de cámara denegado. Habilítalo en los ajustes del navegador.'
    if (err.name === 'NotFoundError') return 'No se encontró ninguna cámara en este dispositivo.'
    if (err.name === 'NotReadableError') return 'La cámara está en uso por otra aplicación.'
  }
  return 'No se puede acceder a la cámara.'
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [codigoManual, setCodigoManual] = useState('')

  const iniciarEscaner = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromVideoDevice(undefined, video, (result, err) => {
        if (result) {
          onDetected(result.getText())
        }
        if (err && err.name !== 'NotFoundException') {
          setError(diagnosticarError(err))
        }
      })
      .then((controls) => {
        controlsRef.current = controls
      })
      .catch((err) => setError(diagnosticarError(err)))
  }, [onDetected])

  useEffect(() => {
    // Pequeño delay para asegurar que el DOM está montado
    const t = setTimeout(iniciarEscaner, 100)
    return () => {
      clearTimeout(t)
      controlsRef.current?.stop()
    }
  }, [iniciarEscaner])

  const handleManual = () => {
    const codigo = codigoManual.trim()
    if (codigo) onDetected(codigo)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="relative w-full max-w-sm px-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-4 text-white hover:text-gray-300 z-10"
        >
          <X size={28} />
        </button>

        {error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center space-y-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Introduce el código manualmente:
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManual()}
                placeholder="Ej: 8410000000000"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleManual}
                disabled={!codigoManual.trim()}
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Buscar
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              playsInline
              muted
            />
            {/* Visor */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-24 border-2 border-primary-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
            <p className="text-white text-center text-sm mt-3 px-4">
              Apunta la cámara al código de barras del producto
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
