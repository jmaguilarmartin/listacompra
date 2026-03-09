import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// BarcodeDetector es una API nativa disponible en Chrome/Edge/Android Chrome
interface BarcodeDetectorResult { rawValue: string }
declare class BarcodeDetector {
  constructor(options?: { formats: string[] })
  detect(image: ImageBitmapSource): Promise<BarcodeDetectorResult[]>
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const zxingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [codigoManual, setCodigoManual] = useState('')

  useEffect(() => {
    let cancelled = false

    const reportDetected = (code: string) => {
      if (doneRef.current || cancelled) return
      doneRef.current = true
      onDetected(code)
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()

        // ── Estrategia 1: BarcodeDetector nativo (rápido, funciona bien en móvil) ──
        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          })
          const scanNative = async () => {
            if (cancelled || doneRef.current) return
            try {
              const results = await detector.detect(video)
              if (results.length > 0) { reportDetected(results[0].rawValue); return }
            } catch { /* ignorar errores de frame */ }
            rafRef.current = requestAnimationFrame(scanNative)
          }
          rafRef.current = requestAnimationFrame(scanNative)
        }

        // ── Estrategia 2: ZXing vía canvas (más robusto en portátil/webcam) ──
        // Carga ZXing de forma lazy y sondea cada 400 ms
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        const scanZXing = () => {
          if (cancelled || doneRef.current) return
          try {
            if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0)
              const result = reader.decodeFromCanvas(canvas)
              if (result) { reportDetected(result.getText()); return }
            }
          } catch { /* NotFoundException es normal entre frames */ }
          zxingTimerRef.current = setTimeout(scanZXing, 400)
        }
        zxingTimerRef.current = setTimeout(scanZXing, 600) // pequeño delay inicial

      } catch (err) {
        if (!cancelled) setError(diagnosticarError(err))
      }
    }

    start()

    return () => {
      cancelled = true
      doneRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (zxingTimerRef.current) clearTimeout(zxingTimerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [onDetected])

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
            {/* Canvas oculto para ZXing */}
            <canvas ref={canvasRef} className="hidden" />
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
