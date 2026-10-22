const STORAGE_PREFIX = 'dzairtech:order-phone:'

function storageKey(orderNumber: string): string {
  return `${STORAGE_PREFIX}${orderNumber.trim().toUpperCase()}`
}

export function rememberOrderPhone(
  orderNumber: string,
  phone: string
): void {
  if (!orderNumber.trim() || !phone.trim()) return

  try {
    window.sessionStorage.setItem(storageKey(orderNumber), phone.trim())
  } catch {
    return
  }
}

export function getRememberedOrderPhone(orderNumber: string): string {
  if (!orderNumber.trim()) return ''

  try {
    return window.sessionStorage.getItem(storageKey(orderNumber)) ?? ''
  } catch {
    return ''
  }
}

export function forgetRememberedOrderPhone(orderNumber: string): void {
  if (!orderNumber.trim()) return

  try {
    window.sessionStorage.removeItem(storageKey(orderNumber))
  } catch {
    return
  }
}
