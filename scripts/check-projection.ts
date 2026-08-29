/**
 * Audyt matematyki kalkulatora.
 *
 * Każdą liczbę, którą pokazuje strona, sprawdzamy tu drugą, niezależną drogą:
 * pętla rekurencyjna kontra wzór zamknięty kontra sumowanie pojedynczych wpłat.
 * Jeśli trzy różne metody dają ten sam wynik, błąd w jednej z nich się ujawni.
 *
 * Uruchom: npm run check
 */
import {
  buildProjection,
  displayValues,
  pointAtYear,
  toMonthlyRate,
} from '../src/lib/projection.ts'
import { buildScale, niceStep } from '../src/lib/scale.ts'

let passed = 0
let failed = 0
let currentSection = ''

function section(name: string) {
  currentSection = name
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 64 - name.length))}`)
}

function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${label}${detail ? `  (${detail})` : ''}`)
  } else {
    failed++
    console.log(`  ✗ ${label}  ${detail}`)
    console.log(`    sekcja: ${currentSection}`)
  }
}

function close(label: string, actual: number, expected: number, tolerance = 1e-9) {
  const diff = Math.abs(actual - expected)
  const scale = Math.max(1, Math.abs(expected))
  check(label, diff / scale <= tolerance, `${actual.toFixed(4)} vs ${expected.toFixed(4)}`)
}

// ── Niezależne implementacje odniesienia ────────────────────────────────────

/** Wzór zamknięty: wartość przyszła kapitału początkowego plus renty płatnej z dołu. */
function closedFormBalance(initial: number, monthly: number, annual: number, months: number) {
  const rate = toMonthlyRate(annual)
  const growth = Math.pow(1 + rate, months)
  const annuity = rate === 0 ? monthly * months : monthly * ((growth - 1) / rate)
  return initial * growth + annuity
}

/** Trzecia droga: każda wpłata rośnie osobno, na końcu sumujemy. */
function summedBalance(initial: number, monthly: number, annual: number, months: number) {
  const rate = toMonthlyRate(annual)
  let total = initial * Math.pow(1 + rate, months)
  for (let k = 1; k <= months; k++) total += monthly * Math.pow(1 + rate, months - k)
  return total
}

/** Wpłaty zdyskontowane na dziś, liczone wprost z definicji. */
function summedRealContributed(
  initial: number,
  monthly: number,
  inflation: number,
  months: number,
) {
  const rate = toMonthlyRate(inflation)
  let total = initial
  for (let k = 1; k <= months; k++) total += monthly / Math.pow(1 + rate, k)
  return total
}

/** Deterministyczny generator, żeby test losowy był powtarzalny. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Domyślne ustawienia strony – audyt pilnuje dokładnie tych liczb. */
const BASE = { initial: 4000, monthly: 500, annualReturn: 0.07, annualInflation: 0.025 }

// ── 1. Stopa miesięczna ─────────────────────────────────────────────────────

section('Stopa miesięczna')
for (const annual of [0, 0.02, 0.07, 0.1, 0.2, -0.08, -0.1]) {
  close(
    `12 miesięcy składa się dokładnie w ${(annual * 100).toFixed(1)}% rocznie`,
    Math.pow(1 + toMonthlyRate(annual), 12) - 1,
    annual,
    1e-12,
  )
}
check('zwrot -100% nie daje NaN', toMonthlyRate(-1) === -1)
check('zwrot poniżej -100% nie daje NaN', toMonthlyRate(-1.5) === -1)
check('zerowy zwrot daje zerową stopę', toMonthlyRate(0) === 0)

// ── 2. Saldo: trzy niezależne metody ────────────────────────────────────────

section('Saldo portfela – trzy niezależne metody')
for (const years of [1, 10, 20, 30, 50]) {
  const point = pointAtYear(buildProjection({ ...BASE, years }), years)
  const months = years * 12
  const formula = closedFormBalance(BASE.initial, BASE.monthly, BASE.annualReturn, months)
  const summed = summedBalance(BASE.initial, BASE.monthly, BASE.annualReturn, months)
  close(`${years} l. – pętla vs wzór zamknięty`, point.balance, formula, 1e-12)
  close(`${years} l. – pętla vs suma pojedynczych wpłat`, point.balance, summed, 1e-12)
}

// ── 3. Tożsamości księgowe ──────────────────────────────────────────────────

section('Tożsamości księgowe')
for (const years of [10, 20, 50]) {
  const point = pointAtYear(buildProjection({ ...BASE, years }), years)
  close(
    `${years} l. – wpłaty = start + 12·lata·rata`,
    point.contributed,
    BASE.initial + BASE.monthly * years * 12,
  )
  close(`${years} l. – zysk = saldo − wpłaty`, point.gains, point.balance - point.contributed)
  close(
    `${years} l. – wartość realna = saldo / (1+i)^lata`,
    point.real,
    point.balance / Math.pow(1 + BASE.annualInflation, years),
  )
  close(
    `${years} l. – wpłaty realne liczone wprost z definicji`,
    point.realContributed,
    summedRealContributed(BASE.initial, BASE.monthly, BASE.annualInflation, years * 12),
    1e-12,
  )
}

// ── 4. Spójność widoku nominalnego i realnego ───────────────────────────────

section('Widok nominalny i realny')
for (const years of [10, 20, 50]) {
  const point = pointAtYear(buildProjection({ ...BASE, years }), years)
  for (const showReal of [false, true]) {
    const view = displayValues(point, showReal)
    close(
      `${years} l. ${showReal ? 'realnie' : 'nominalnie'} – wpłaty + zysk = wartość`,
      view.contributed + view.gains,
      view.total,
      1e-12,
    )
  }
  const real = displayValues(point, true)
  const nominal = displayValues(point, false)
  check(`${years} l. – realna wartość niższa od nominalnej`, real.total < nominal.total)
  check(`${years} l. – realne wpłaty niższe od nominalnych`, real.contributed < nominal.contributed)
}
{
  const point = pointAtYear(buildProjection({ ...BASE, annualInflation: 0, years: 30 }), 30)
  const real = displayValues(point, true)
  const nominal = displayValues(point, false)
  close('zerowa inflacja – wartość identyczna', real.total, nominal.total, 1e-12)
  close('zerowa inflacja – wpłaty identyczne', real.contributed, nominal.contributed, 1e-12)
}

// ── 5. Przypadki brzegowe ───────────────────────────────────────────────────

section('Przypadki brzegowe')
{
  const point = pointAtYear(
    buildProjection({ initial: 1000, monthly: 100, annualReturn: 0, annualInflation: 0, years: 10 }),
    10,
  )
  close('zerowy zwrot – saldo równe wpłatom', point.balance, 1000 + 100 * 120)
  close('zerowy zwrot – zysk zerowy', point.gains, 0)
}
{
  const point = pointAtYear(
    buildProjection({ initial: 10000, monthly: 0, annualReturn: -0.1, annualInflation: 0, years: 5 }),
    5,
  )
  close('spadek 10% rocznie przez 5 lat', point.balance, 10000 * Math.pow(0.9, 5))
  check('strata wychodzi ujemna', point.gains < 0, point.gains.toFixed(2))
  check('saldo mimo strat pozostaje dodatnie', point.balance > 0)
}
{
  const point = pointAtYear(
    buildProjection({ initial: 0, monthly: 500, annualReturn: 0.07, annualInflation: 0, years: 20 }),
    20,
  )
  close('brak kapitału startowego – sama renta', point.balance, closedFormBalance(0, 500, 0.07, 240))
}
{
  const points = buildProjection({
    initial: 0,
    monthly: 0,
    annualReturn: 0.07,
    annualInflation: 0.025,
    years: 50,
  })
  const view = displayValues(pointAtYear(points, 50), true)
  check(
    'zerowe wpłaty – same zera, bez NaN',
    view.total === 0 && view.contributed === 0 && view.gains === 0,
  )
}
{
  // Skrajne ustawienia z suwaków: maksimum wszystkiego przez 50 lat.
  const point = pointAtYear(
    buildProjection({
      initial: 500000,
      monthly: 20000,
      annualReturn: 0.2,
      annualInflation: 0.15,
      years: 50,
    }),
    50,
  )
  check(
    'maksymalne ustawienia – wynik skończony',
    Number.isFinite(point.balance) && Number.isFinite(point.real) && point.balance > 0,
  )
  close(
    'maksymalne ustawienia – zgodność ze wzorem',
    point.balance,
    closedFormBalance(500000, 20000, 0.2, 600),
    1e-12,
  )
}
{
  const points = buildProjection({ ...BASE, years: 50 })
  check('50 lat to 601 punktów (miesiące + start)', points.length === 601)
  close('punkt zerowy równy kwocie startowej', points[0].balance, BASE.initial)
  close('punkt zerowy – zysk zerowy', points[0].gains, 0)
  check(
    'saldo rośnie monotonicznie przy dodatnim zwrocie',
    points.every((p, i) => i === 0 || p.balance > points[i - 1].balance),
  )
  check(
    'nigdzie nie ma NaN ani nieskończoności',
    points.every(
      (p) =>
        Number.isFinite(p.balance) &&
        Number.isFinite(p.contributed) &&
        Number.isFinite(p.gains) &&
        Number.isFinite(p.real) &&
        Number.isFinite(p.realContributed),
    ),
  )
}

// ── 6. Odczyt punktu w czasie ───────────────────────────────────────────────

section('Odczyt punktu w czasie')
{
  const points = buildProjection({ ...BASE, years: 50 })
  check('rok 10 to indeks 120', pointAtYear(points, 10).month === 120)
  check('rok 0 to indeks 0', pointAtYear(points, 0).month === 0)
  check('przekroczony zakres przycina się do końca', pointAtYear(points, 99).month === 600)
  check('ujemny rok przycina się do zera', pointAtYear(points, -5).month === 0)
}

// ── 7. Koszt zwłoki (kafelek osiemnastki) ───────────────────────────────────

section('Koszt zwłoki')
for (const [horizon, delay] of [
  [10, 5],
  [20, 10],
  [50, 10],
] as const) {
  const projection = buildProjection({ ...BASE, years: horizon })
  const now = displayValues(pointAtYear(projection, horizon), false)
  const late = displayValues(pointAtYear(projection, horizon - delay), false)
  const contributionGap = now.contributed - late.contributed
  const timeCost = now.total - late.total - contributionGap
  close(
    `horyzont ${horizon} l. – luka we wpłatach = rata × ${delay} lat`,
    contributionGap,
    BASE.monthly * delay * 12,
  )
  close(
    `horyzont ${horizon} l. – rozkład różnicy się domyka`,
    contributionGap + timeCost,
    now.total - late.total,
    1e-12,
  )
  check(`horyzont ${horizon} l. – koszt czasu dodatni`, timeCost > 0, `${timeCost.toFixed(0)} zł`)
}

// ── 8. Skala osi wykresu ────────────────────────────────────────────────────

section('Skala osi wykresu')
check('niceStep(0) nie zwraca zera', niceStep(0) === 1)
check('niceStep ujemnego nie zwraca zera', niceStep(-5) === 1)
for (const [raw, expected] of [
  [1, 1],
  [1.5, 2],
  [3, 5],
  [7, 10],
  [23000, 50000],
  [0.03, 0.05],
] as const) {
  check(`niceStep(${raw}) = ${expected}`, niceStep(raw) === expected, String(niceStep(raw)))
}
{
  const rand = mulberry32(7)
  let scaleOk = true
  let details = ''
  for (let i = 0; i < 5000; i++) {
    const peak = rand() * Math.pow(10, Math.floor(rand() * 9))
    const { max, ticks } = buildScale(peak)
    const monotonic = ticks.every((t, idx) => idx === 0 || t > ticks[idx - 1])
    const ok =
      max >= peak &&
      ticks[0] === 0 &&
      Math.abs(ticks[ticks.length - 1] - max) < max * 1e-9 &&
      monotonic &&
      ticks.length >= 2 &&
      ticks.length <= 12
    if (!ok) {
      scaleOk = false
      details = `peak=${peak} max=${max} ticks=${ticks.length}`
      break
    }
  }
  check('5000 losowych szczytów – oś nigdy nie ucina krzywej', scaleOk, details)
}
{
  // Oś musi objąć również linię wpłat, gdy portfel jest pod kreską.
  const points = buildProjection({
    initial: 200000,
    monthly: 300,
    annualReturn: -0.06,
    annualInflation: 0.025,
    years: 20,
  })
  const peak = Math.max(...points.map((p) => Math.max(p.balance, p.contributed)))
  check('przy stracie oś obejmuje linię wpłat', buildScale(peak).max >= peak)
}

// ── 9. Test losowy: 20 000 kombinacji parametrów ────────────────────────────

section('Test losowy – 20 000 kombinacji')
{
  const rand = mulberry32(20260829)
  let worstBalance = 0
  let worstIdentity = 0
  let bad: string | null = null

  for (let i = 0; i < 20000 && !bad; i++) {
    const initial = Math.round(rand() * 500000)
    const monthly = Math.round(rand() * 20000)
    const annualReturn = -0.1 + rand() * 0.3
    const annualInflation = rand() * 0.15
    const years = 1 + Math.floor(rand() * 50)

    const point = pointAtYear(
      buildProjection({ initial, monthly, annualReturn, annualInflation, years }),
      years,
    )
    const reference = closedFormBalance(initial, monthly, annualReturn, years * 12)
    const scale = Math.max(1, Math.abs(reference))
    worstBalance = Math.max(worstBalance, Math.abs(point.balance - reference) / scale)

    for (const showReal of [false, true]) {
      const view = displayValues(point, showReal)
      const gap = Math.abs(view.contributed + view.gains - view.total) / Math.max(1, view.total)
      worstIdentity = Math.max(worstIdentity, gap)
      if (!Number.isFinite(view.total) || !Number.isFinite(view.gains)) {
        bad = `niepoprawna liczba przy initial=${initial} monthly=${monthly} r=${annualReturn} i=${annualInflation} lat=${years}`
      }
    }
    if (worstBalance > 1e-9) {
      bad = `rozjazd salda ${worstBalance} przy initial=${initial} monthly=${monthly} r=${annualReturn} lat=${years}`
    }
  }

  check('brak NaN i nieskończoności w żadnej kombinacji', bad === null, bad ?? '')
  check(
    'saldo zgodne ze wzorem zamkniętym we wszystkich kombinacjach',
    worstBalance <= 1e-9,
    `najgorszy błąd względny ${worstBalance.toExponential(2)}`,
  )
  check(
    'wpłaty + zysk = wartość we wszystkich kombinacjach i obu widokach',
    worstIdentity <= 1e-9,
    `najgorszy błąd względny ${worstIdentity.toExponential(2)}`,
  )
}

// ── 10. Wartości pokazywane na stronie przy domyślnych ustawieniach ─────────

section('Domyślne ustawienia – wartości ze strony')
{
  const projection = buildProjection({ ...BASE, years: 50 })
  const expectations: Array<[number, number, number]> = [
    // [lata, saldo, wpłaty]
    [10, 93394.4711, 64000],
    [20, 269246.9261, 124000],
    [50, 2634302.5728, 304000],
  ]
  for (const [years, balance, contributed] of expectations) {
    const point = pointAtYear(projection, years)
    close(`${years} l. – saldo ${balance.toFixed(0)} zł`, point.balance, balance, 1e-7)
    close(`${years} l. – wpłaty ${contributed} zł`, point.contributed, contributed)
  }
  close(
    '50 l. – wartość realna 766 430 zł',
    displayValues(pointAtYear(projection, 50), true).total,
    766429.807,
    1e-7,
  )
  const multiplier = pointAtYear(projection, 50).balance / pointAtYear(projection, 50).contributed
  close('50 l. – mnożnik ×8,67', multiplier, 8.6655, 1e-4)
}

// ── Podsumowanie ────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(70)}`)
console.log(failed === 0 ? `WSZYSTKIE ${passed} SPRAWDZEŃ PRZESZŁO` : `${failed} z ${passed + failed} sprawdzeń NIE przeszło`)
process.exit(failed === 0 ? 0 : 1)
