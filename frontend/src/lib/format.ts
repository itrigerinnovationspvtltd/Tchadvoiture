export function formatPrice(price: number, currencyLabel?: string) {
  const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price)
  return currencyLabel ? `${currencyLabel} ${amount}` : amount
}

export function formatKm(km: number) {
  return `${new Intl.NumberFormat('en-US').format(km)} km`
}

export function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sellerLabel(role: string, seller: { name?: string; dealershipName?: string }) {
  if (role === 'dealer') return seller.dealershipName || seller.name || 'Dealer'
  return seller.name || 'Seller'
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong.'
}
