export interface ProjectionParams {
  /** Kwota zainwestowana jednorazowo w dniu startu. */
  initial: number
  /** Stała dopłata na koniec każdego miesiąca. */
  monthly: number
  /** Zakładany roczny zwrot jako ułamek, np. 0.07 dla 7%. */
  annualReturn: number
  /** Zakładana roczna inflacja jako ułamek. */
  annualInflation: number
  years: number
}

export interface ProjectionPoint {
  month: number
  years: number
  /** Suma pieniędzy włożonych z własnej kieszeni. */
  contributed: number
  /** Wartość portfela w kwotach nominalnych. */
  balance: number
  /** balance - contributed; ujemne przy stratach. */
  gains: number
  /** Wartość portfela w sile nabywczej z dnia startu. */
  real: number
  /** Wpłaty zdyskontowane inflacją – ile byłyby warte dziś. */
  realContributed: number
}

export interface DisplayValues {
  total: number
  contributed: number
  gains: number
}

/**
 * Zestaw liczb spójny w jednej jednostce: albo wszystko nominalnie,
 * albo wszystko w dzisiejszych złotych. Bez tego "zysk" nie sumowałby się
 * z wpłatami do wyświetlanej wartości portfela.
 */
export function displayValues(point: ProjectionPoint, showReal: boolean): DisplayValues {
  if (!showReal) {
    return { total: point.balance, contributed: point.contributed, gains: point.gains }
  }
  return {
    total: point.real,
    contributed: point.realContributed,
    gains: point.real - point.realContributed,
  }
}

/**
 * Zamienia roczną stopę efektywną na miesięczną, tak aby 12 miesięcy
 * kapitalizacji dało dokładnie zadany zwrot roczny.
 */
export function toMonthlyRate(annualRate: number): number {
  if (annualRate <= -1) return -1
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export function buildProjection(params: ProjectionParams): ProjectionPoint[] {
  const months = Math.max(0, Math.round(params.years * 12))
  const rate = toMonthlyRate(params.annualReturn)
  const inflationRate = toMonthlyRate(params.annualInflation)

  const points: ProjectionPoint[] = new Array(months + 1)
  let balance = params.initial
  let contributed = params.initial
  let realContributed = params.initial

  for (let month = 0; month <= months; month++) {
    const deflator = Math.pow(1 + inflationRate, month)
    if (month > 0) {
      balance = balance * (1 + rate) + params.monthly
      contributed += params.monthly
      realContributed += params.monthly / deflator
    }
    points[month] = {
      month,
      years: month / 12,
      contributed,
      balance,
      gains: balance - contributed,
      real: balance / deflator,
      realContributed,
    }
  }

  return points
}

export function pointAtYear(points: ProjectionPoint[], year: number): ProjectionPoint {
  const index = Math.min(points.length - 1, Math.max(0, Math.round(year * 12)))
  return points[index]
}
