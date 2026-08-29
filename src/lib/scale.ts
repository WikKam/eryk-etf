/** Zaokrągla krok osi do „ładnej” wartości: 1, 2, 5 albo 10 razy potęga dziesiątki. */
export function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const stepped = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return stepped * magnitude
}

export interface Scale {
  /** Górna granica osi – nigdy niższa niż największa rysowana wartość. */
  max: number
  ticks: number[]
}

export function buildScale(peak: number, targetTicks = 4): Scale {
  const safePeak = Number.isFinite(peak) && peak > 0 ? peak : 0
  const step = niceStep(safePeak / targetTicks)
  const max = Math.max(step, Math.ceil(safePeak / step) * step)
  const count = Math.round(max / step)
  const ticks: number[] = new Array(count + 1)
  // Mnożenie zamiast sumowania w pętli – inaczej błąd zmiennoprzecinkowy
  // kumuluje się i ostatni tick nie trafia dokładnie w max.
  for (let index = 0; index <= count; index++) ticks[index] = index * step
  return { max, ticks }
}
