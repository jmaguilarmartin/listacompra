import { useState, useEffect } from 'react'

export function useUserName() {
  const [userName, setUserName] = useState<string>('Usuario')

  useEffect(() => {
    const saved = localStorage.getItem('userName')
    if (saved) {
      setUserName(saved)
    }
  }, [])

  const updateUserName = (name: string) => {
    localStorage.setItem('userName', name)
    setUserName(name)
  }

  return { userName, updateUserName }
}