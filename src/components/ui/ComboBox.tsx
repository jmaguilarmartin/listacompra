import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ComboBoxProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  error?: string
}

export const ComboBox = memo(function ComboBox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona o escribe...',
  error,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Actualizar inputValue cuando value cambia externamente
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Filtrar opciones según lo que se escribe (memoizado)
  const filteredOptions = useCallback(() => {
    if (!inputValue) return options
    return options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [inputValue, options])()

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    if (!isOpen) setIsOpen(true)
  }, [onChange, isOpen])

  const handleSelectOption = useCallback((option: string) => {
    setInputValue(option)
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            'block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
          )}
        />

        <button
          type="button"
          onClick={toggleDropdown}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown
            size={20}
            className={cn(
              'transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown de opciones */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li key={`${option}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className="w-full text-left px-4 py-2 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none transition-colors"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              {inputValue ? (
                <>
                  Presiona Enter para crear:{' '}
                  <span className="font-medium text-gray-700">
                    "{inputValue}"
                  </span>
                </>
              ) : (
                'Escribe para buscar o crear nuevo...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
