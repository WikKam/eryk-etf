import { useEffect, useMemo, useState } from 'react'
import { Explainer } from './components/Explainer'
import { GrowthChart } from './components/GrowthChart'
import { MilestoneCard } from './components/MilestoneCard'
import { ParamSlider } from './components/ParamSlider'
import { StartEarly } from './components/StartEarly'
import { buildProjection, displayValues, pointAtYear } from './lib/projection'
import {
  addMonths,
  formatDate,
  formatMoney,
  formatPercent,
  yearsLabel,
  yearsUnit,
} from './lib/format'
import { useAnimatedNumber } from './lib/useAnimatedNumber'

/** Dzień zakupu ETF-a, od którego liczymy całą projekcję. */
const START_DATE = new Date(2026, 7, 29)
const MILESTONES = [10, 20, 50]
const HORIZONS = [10, 20, 50]
const STORAGE_KEY = 'sp500-projection-params-v1'

interface Params {
  initial: number
  monthly: number
  annualReturnPct: number
  annualInflationPct: number
  horizonYears: number
  showReal: boolean
}

const DEFAULTS: Params = {
  initial: 5000,
  monthly: 500,
  annualReturnPct: 7,
  annualInflationPct: 2.5,
  horizonYears: 20,
  showReal: false,
}

function loadParams(): Params {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(stored) as Partial<Params>) }
  } catch {
    return DEFAULTS
  }
}

export default function App() {
  const [params, setParams] = useState<Params>(loadParams)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
    } catch {
      // Prywatny tryb przeglądarki – po prostu nie zapamiętujemy ustawień.
    }
  }, [params])

  const update = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((current) => ({ ...current, [key]: value }))

  const maxYears = Math.max(params.horizonYears, ...MILESTONES)

  const fullProjection = useMemo(
    () =>
      buildProjection({
        initial: params.initial,
        monthly: params.monthly,
        annualReturn: params.annualReturnPct / 100,
        annualInflation: params.annualInflationPct / 100,
        years: maxYears,
      }),
    [params.initial, params.monthly, params.annualReturnPct, params.annualInflationPct, maxYears],
  )

  const chartPoints = useMemo(
    () => fullProjection.slice(0, params.horizonYears * 12 + 1),
    [fullProjection, params.horizonYears],
  )

  const headline = displayValues(pointAtYear(fullProjection, params.horizonYears), params.showReal)
  const animatedTotal = useAnimatedNumber(headline.total)

  // Ile kosztuje samo odwlekanie startu: ten sam plan wpłat, ta sama data końcowa,
  // tylko krótszy czas na pracę procentu składanego.
  const delayYears = Math.min(10, Math.max(1, Math.floor(params.horizonYears / 2)))
  const delayed = displayValues(
    pointAtYear(fullProjection, params.horizonYears - delayYears),
    params.showReal,
  )
  const contributionGap = headline.contributed - delayed.contributed
  const timeCost = headline.total - delayed.total - contributionGap

  const isDefault =
    params.initial === DEFAULTS.initial &&
    params.monthly === DEFAULTS.monthly &&
    params.annualReturnPct === DEFAULTS.annualReturnPct &&
    params.annualInflationPct === DEFAULTS.annualInflationPct

  return (
    <div className="page">
      <div className="glow glow--one" aria-hidden="true" />
      <div className="glow glow--two" aria-hidden="true" />

      <header className="hero">
        <span className="hero__eyebrow">Vanguard S&amp;P 500 UCITS ETF</span>
        <h1 className="hero__title">
          Ile urośnie Twoja inwestycja
          <span className="hero__accent"> do {START_DATE.getFullYear() + params.horizonYears} roku?</span>
        </h1>
        <p className="hero__lead">
          Zakup startuje {formatDate(START_DATE)}. Przesuwaj suwaki i zobacz, jak procent składany
          pracuje na Twoich wpłatach. Nie wiesz, co to akcja ani ETF?{' '}
          <a href="#podstawy">Tłumaczymy niżej</a>, bez żargonu.
        </p>
      </header>

      <main className="stack">
        <StartEarly
          delayYears={delayYears}
          currentTotal={headline.total}
          delayedTotal={delayed.total}
          contributionGap={contributionGap}
          timeCost={timeCost}
          showComparison={timeCost > 0}
        />

        <section className="card card--result">
          <div className="chips" role="group" aria-label="Horyzont inwestycji">
            {HORIZONS.map((years) => (
              <button
                key={years}
                type="button"
                className={`chip${params.horizonYears === years ? ' chip--active' : ''}`}
                onClick={() => update('horizonYears', years)}
                aria-pressed={params.horizonYears === years}
              >
                {yearsLabel(years)}
              </button>
            ))}
            {!HORIZONS.includes(params.horizonYears) && (
              <span className="chips__custom">{yearsLabel(params.horizonYears)}</span>
            )}
          </div>

          <div className="result">
            <span className="result__caption">
              Wartość portfela za {yearsLabel(params.horizonYears)}
              {params.showReal ? ' (w dzisiejszych złotych)' : ''}
            </span>
            <strong className="result__total">{formatMoney(animatedTotal)}</strong>
            <div className="result__split">
              <span>
                <i className="dot dot--contrib" />
                Wpłacone {formatMoney(headline.contributed)}
              </span>
              <span className={headline.gains >= 0 ? 'is-positive' : 'is-negative'}>
                <i className="dot dot--gain" />
                Zysk {headline.gains >= 0 ? '+' : ''}
                {formatMoney(headline.gains)}
              </span>
            </div>
          </div>

          <GrowthChart
            points={chartPoints}
            showReal={params.showReal}
            years={params.horizonYears}
          />

          <label className="switch">
            <input
              type="checkbox"
              checked={params.showReal}
              onChange={(event) => update('showReal', event.target.checked)}
            />
            <span className="switch__track" aria-hidden="true">
              <span className="switch__thumb" />
            </span>
            <span className="switch__text">
              Pokaż w dzisiejszych pieniądzach
              <small>Uwzględnia inflację {formatPercent(params.annualInflationPct)} rocznie</small>
            </span>
          </label>
        </section>

        <section className="section">
          <h2 className="section__title">Punkty kontrolne</h2>
          <div className="milestones">
            {MILESTONES.map((years) => (
              <MilestoneCard
                key={years}
                years={years}
                point={pointAtYear(fullProjection, years)}
                showReal={params.showReal}
                targetDate={addMonths(START_DATE, years * 12)}
                active={params.horizonYears === years}
                onSelect={() => update('horizonYears', years)}
              />
            ))}
          </div>
        </section>

        <section className="section" id="podstawy">
          <h2 className="section__title">Zanim wpłacisz pierwszą złotówkę</h2>
          <Explainer />
        </section>

        <section className="card">
          <div className="card__head">
            <h2 className="section__title">Twoje założenia</h2>
            {!isDefault && (
              <button
                type="button"
                className="reset"
                onClick={() => setParams({ ...DEFAULTS, horizonYears: params.horizonYears })}
              >
                Przywróć domyślne
              </button>
            )}
          </div>

          <ParamSlider
            label="Kwota na start"
            value={params.initial}
            min={0}
            max={500000}
            step={500}
            unit="zł"
            hint={`Wpłacasz ją ${formatDate(START_DATE)}`}
            onChange={(value) => update('initial', value)}
          />
          <ParamSlider
            label="Dopłata co miesiąc"
            value={params.monthly}
            min={0}
            max={20000}
            step={50}
            unit="zł"
            hint="Doliczana na koniec każdego miesiąca"
            onChange={(value) => update('monthly', value)}
          />
          <ParamSlider
            label="Zakładany zwrot rocznie"
            value={params.annualReturnPct}
            min={-10}
            max={20}
            step={0.1}
            unit="%"
            decimals={1}
            hint="Historyczna średnia S&P 500 to ok. 10% nominalnie i ok. 7% po inflacji"
            onChange={(value) => update('annualReturnPct', value)}
          />
          <ParamSlider
            label="Inflacja rocznie"
            value={params.annualInflationPct}
            min={0}
            max={15}
            step={0.1}
            unit="%"
            decimals={1}
            hint="Używana tylko do przeliczenia na dzisiejsze złote"
            onChange={(value) => update('annualInflationPct', value)}
          />
          <ParamSlider
            label="Horyzont na wykresie"
            value={params.horizonYears}
            min={1}
            max={50}
            step={1}
            unit={yearsUnit(params.horizonYears)}
            hint="Punkty kontrolne zawsze pokazują 10, 20 i 50 lat"
            onChange={(value) => update('horizonYears', value)}
          />
        </section>

        <footer className="footer">
          <p>
            Wyliczenia zakładają stały zwrot {formatPercent(params.annualReturnPct)} rocznie i
            kapitalizację miesięczną. Rzeczywisty S&amp;P 500 zachowuje się znacznie mniej
            przewidywalnie – bywają lata z kilkudziesięcioprocentowymi spadkami.
          </p>
          <p className="footer__small">
            Kalkulator pomija podatek Belki, prowizje maklerskie, ryzyko kursu USD/PLN i opłatę za
            zarządzanie funduszem. To narzędzie edukacyjne, nie porada inwestycyjna.
          </p>
        </footer>
      </main>
    </div>
  )
}
