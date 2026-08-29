/**
 * Sanity check projekcji – porównuje wynik iteracyjny z zamkniętym wzorem
 * na wartość przyszłą kapitału początkowego i renty miesięcznej.
 * Uruchom: npm run check
 */
import { buildProjection, displayValues, pointAtYear, toMonthlyRate } from '../src/lib/projection.ts'

let failures = 0

function expectClose(label: string, actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected)
  const ok = diff <= tolerance
  if (!ok) failures++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}\n      actual=${actual.toFixed(4)} expected=${expected.toFixed(4)} diff=${diff.toFixed(6)}`,
  )
}

const closedForm = (initial: number, monthly: number, annual: number, years: number) => {
  const rate = toMonthlyRate(annual)
  const months = years * 12
  const growth = Math.pow(1 + rate, months)
  const annuity = rate === 0 ? monthly * months : monthly * ((growth - 1) / rate)
  return initial * growth + annuity
}

const base = { initial: 5000, monthly: 500, annualReturn: 0.07, annualInflation: 0.025 }

for (const years of [10, 20, 50]) {
  const points = buildProjection({ ...base, years })
  const point = pointAtYear(points, years)
  expectClose(
    `saldo po ${years} latach zgodne ze wzorem zamkniętym`,
    point.balance,
    closedForm(base.initial, base.monthly, base.annualReturn, years),
  )
  expectClose(
    `wpłacone po ${years} latach`,
    point.contributed,
    base.initial + base.monthly * years * 12,
  )
  expectClose(`zysk = saldo - wpłaty (${years} l.)`, point.gains, point.balance - point.contributed)
  expectClose(
    `wartość realna po ${years} latach`,
    point.real,
    point.balance / Math.pow(1 + base.annualInflation, years),
    point.balance * 1e-9,
  )
}

// Widok nominalny i realny muszą się domykać: wpłaty + zysk = wyświetlana wartość.
for (const showReal of [false, true]) {
  const points = buildProjection({ ...base, years: 30 })
  const view = displayValues(pointAtYear(points, 30), showReal)
  expectClose(
    `${showReal ? 'realnie' : 'nominalnie'}: wpłaty + zysk = wartość portfela`,
    view.contributed + view.gains,
    view.total,
    1e-6,
  )
}

// Zdyskontowane wpłaty muszą być mniejsze od nominalnych przy dodatniej inflacji.
{
  const point = pointAtYear(buildProjection({ ...base, years: 30 }), 30)
  expectClose('wpłaty realne < nominalnych', Math.sign(point.contributed - point.realContributed), 1)
  const monthlyInflation = toMonthlyRate(base.annualInflation)
  const discounted =
    base.initial +
    base.monthly * ((1 - Math.pow(1 + monthlyInflation, -360)) / monthlyInflation)
  expectClose('wpłaty realne zgodne ze wzorem na rentę zdyskontowaną', point.realContributed, discounted)
}

// Bez inflacji widok realny jest identyczny z nominalnym.
{
  const point = pointAtYear(buildProjection({ ...base, annualInflation: 0, years: 30 }), 30)
  const nominal = displayValues(point, false)
  const real = displayValues(point, true)
  expectClose('zerowa inflacja: ta sama wartość', real.total, nominal.total, 1e-6)
  expectClose('zerowa inflacja: te same wpłaty', real.contributed, nominal.contributed, 1e-6)
}

// Roczna stopa musi się składać dokładnie do zadanego zwrotu.
expectClose('12 miesięcy kapitalizacji daje 7% rocznie', Math.pow(1 + toMonthlyRate(0.07), 12) - 1, 0.07, 1e-12)

// Zerowy zwrot: portfel to dokładnie suma wpłat.
{
  const points = buildProjection({ initial: 1000, monthly: 100, annualReturn: 0, annualInflation: 0, years: 10 })
  const point = pointAtYear(points, 10)
  expectClose('zerowy zwrot: saldo = wpłaty', point.balance, 1000 + 100 * 120)
  expectClose('zerowy zwrot: brak zysku', point.gains, 0)
}

// Ujemny zwrot bez dopłat: portfel maleje, ale zostaje dodatni.
{
  const points = buildProjection({ initial: 10000, monthly: 0, annualReturn: -0.1, annualInflation: 0, years: 5 })
  const point = pointAtYear(points, 5)
  expectClose('spadek 10% rocznie przez 5 lat', point.balance, 10000 * Math.pow(0.9, 5))
  expectClose('strata jest ujemna', Math.sign(point.gains), -1)
}

// Brak kapitału startowego: sama renta miesięczna.
{
  const points = buildProjection({ initial: 0, monthly: 500, annualReturn: 0.07, annualInflation: 0, years: 20 })
  expectClose('tylko dopłaty', pointAtYear(points, 20).balance, closedForm(0, 500, 0.07, 20))
}

// Liczba punktów: jeden na miesiąc plus punkt startowy.
{
  const points = buildProjection({ ...base, years: 50 })
  expectClose('liczba punktów dla 50 lat', points.length, 601, 0)
  expectClose('punkt zerowy to kwota startowa', points[0].balance, base.initial)
}

console.log(failures === 0 ? '\nWszystkie sprawdzenia przeszły.' : `\n${failures} sprawdzeń nie przeszło.`)
process.exit(failures === 0 ? 0 : 1)
