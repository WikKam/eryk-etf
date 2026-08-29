const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
})

const plain = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 })

const decimal = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatMoney(value: number): string {
  return currency.format(Math.round(value))
}

export function formatNumber(value: number): string {
  return plain.format(Math.round(value))
}

export function formatPercent(value: number): string {
  return `${decimal.format(value)}%`
}

/** Skrócone kwoty na oś wykresu: 850 tys., 2,7 mln, 1,4 mld. */
export function formatCompactMoney(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${decimal.format(value / 1_000_000_000)} mld`
  if (abs >= 1_000_000) return `${decimal.format(value / 1_000_000)} mln`
  if (abs >= 10_000) return `${plain.format(value / 1000)} tys.`
  return plain.format(value)
}

const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
]

export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  result.setMonth(result.getMonth() + months)
  return result
}

/** Polska odmiana: 1 rok, 2 lata, 5 lat. */
export function yearsLabel(years: number): string {
  if (years === 1) return '1 rok'
  const lastTwo = years % 100
  const last = years % 10
  const isFew = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
  return `${years} ${isFew ? 'lata' : 'lat'}`
}
