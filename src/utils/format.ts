/**
 * Format a number as Algerian Dinar (DZD)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format a date string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format a phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  return phone
}
export type OrderStatus = 'PENDING' | 'ACCEPTED_PENDING' | 'DONE' | 'CANCELLED'

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING': return 'Pending'
    case 'ACCEPTED_PENDING': return 'Accepted'
    case 'DONE': return 'Done'
    case 'CANCELLED': return 'Cancelled'
  }
}

export function orderStatusVariant(
  status: OrderStatus
): 'warning' | 'info' | 'success' | 'danger' {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'ACCEPTED_PENDING': return 'info'
    case 'DONE': return 'success'
    case 'CANCELLED': return 'danger'
  }
}