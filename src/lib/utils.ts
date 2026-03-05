import { format, parseISO, differenceInDays, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: es })
}

/**
 * Formatea una fecha a formato relativo (hace X días)
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const days = differenceInDays(new Date(), dateObj)
  
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}

/**
 * Obtiene el número de semana del año
 */
export function getWeekNumber(date: Date = new Date()): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * Obtiene el rango de fechas de una semana
 */
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 })
  }
}

/**
 * Formatea un precio
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

/**
 * Calcula la mediana de un array de números
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  
  return sorted[middle]
}

/**
 * Calcula la desviación estándar
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const avg = numbers.reduce((sum, val) => sum + val, 0) / numbers.length
  const squareDiffs = numbers.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / numbers.length
  
  return Math.sqrt(avgSquareDiff)
}

/**
 * Agrupa items por una propiedad
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key] || 'Sin categoría')
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Genera un nombre único para evitar duplicados
 */
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  let name = baseName
  let counter = 1
  
  while (existingNames.includes(name)) {
    name = `${baseName} (${counter})`
    counter++
  }
  
  return name
}

/**
 * Clases CSS condicionales (como classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Obtiene el color según la prioridad
 */
export function getPriorityColor(prioridad: number): string {
  switch (prioridad) {
    case 5: return 'text-red-600 bg-red-50 border-red-200'
    case 4: return 'text-orange-600 bg-orange-50 border-orange-200'
    case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 2: return 'text-blue-600 bg-blue-50 border-blue-200'
    case 1: return 'text-gray-600 bg-gray-50 border-gray-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Obtiene el texto de prioridad
 */
export function getPriorityText(prioridad: number): string {
  switch (prioridad) {
    case 5: return 'Muy urgente'
    case 4: return 'Urgente'
    case 3: return 'Normal'
    case 2: return 'Bajo'
    case 1: return 'Muy bajo'
    default: return 'Desconocido'
  }
}

/**
 * Trunca un texto
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
