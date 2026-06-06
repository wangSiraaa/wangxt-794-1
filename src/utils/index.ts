export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const exp = new Date(expirationDate)
  const now = new Date()
  const diffTime = exp.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isExpiringSoon = (expirationDate: string, days: number = 30): boolean => {
  const daysLeft = getDaysUntilExpiration(expirationDate)
  return daysLeft >= 0 && daysLeft <= days
}

export const getRowLabel = (row: number): string => {
  return String.fromCharCode(65 + row)
}

export const getColLabel = (col: number): string => {
  return String(col + 1)
}

export const parseRowLabel = (label: string): number => {
  return label.toUpperCase().charCodeAt(0) - 65
}

export const parseColLabel = (label: string): number => {
  return parseInt(label) - 1
}

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const k = key(item)
    if (!result[k]) {
      result[k] = []
    }
    result[k].push(item)
    return result
  }, {} as Record<K, T[]>)
}

export const uniqueBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): T[] => {
  const seen = new Set<K>()
  return array.filter(item => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export const downloadFile = (content: string, filename: string, type: string = 'text/plain'): void => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
