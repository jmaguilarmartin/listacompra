import { useState, useEffect } from 'react'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function UserSetup() {
  const [inputName, setInputName] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('userName')
    if (!saved) {
      setShowDialog(true)
    }
  }, [])

  const handleSave = () => {
    if (inputName.trim()) {
      localStorage.setItem('userName', inputName.trim())
      setShowDialog(false)
      window.location.reload() // Recargar para que se aplique en toda la app
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputName.trim()) {
      handleSave()
    }
  }

  return (
    <Dialog
      open={showDialog}
      onClose={() => {}} // No permitir cerrar sin nombre
      title="¡Bienvenido a Lista de Compra!"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Para empezar, dinos ¿cómo te llamas?
        </p>
        
        <Input
          label="Tu nombre"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Juan Miguel"
          autoFocus
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={!inputName.trim()}
          >
            Comenzar
          </Button>
        </div>
      </div>
    </Dialog>
  )
}