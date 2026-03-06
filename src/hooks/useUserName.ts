import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useUserName() {
  const { usuarioActual, setUsuarioActual } = useStore()

  useEffect(() => {
    const saved = localStorage.getItem('userName')
    if (saved) {
      setUsuarioActual(saved)
    }
  }, [])

  const userName = usuarioActual || 'Usuario'

  const updateUserName = (name: string) => {
    localStorage.setItem('userName', name)
    setUsuarioActual(name)
  }

  return { userName, updateUserName }
}
