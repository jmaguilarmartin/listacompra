import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { IScannerControls } from '@zxing/browser'
import { X } from 'lucide-react'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (result) {
          onDetected(result.getText())
        }
        if (err && err.name !== 'NotFoundException') {
          setError('Error accediendo a la cámara')
        }
      })
      .then((controls) => {
        controlsRef.current = controls
      })
      .catch(() => setError('No se puede acceder a la cámara'))

    return () => {
      controlsRef.current?.stop()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="relative w-full max-w-sm">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
        >
          <X size={28} />
        </button>

        {error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={onClose} className="text-primary-600 underline">Cerrar</button>
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
