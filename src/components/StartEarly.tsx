import { formatMoney, yearsLabel } from '../lib/format'

interface StartEarlyProps {
  delayYears: number
  currentTotal: number
  delayedTotal: number
  /** O ile mniej własnych pieniędzy wpłaci ktoś, kto zaczyna później. */
  contributionGap: number
  /** Część różnicy, której nie tłumaczą mniejsze wpłaty – to koszt samego czekania. */
  timeCost: number
  showComparison: boolean
}

export function StartEarly({
  delayYears,
  currentTotal,
  delayedTotal,
  contributionGap,
  timeCost,
  showComparison,
}: StartEarlyProps) {
  return (
    <section className="start-early">
      <div className="start-early__intro">
        <span className="start-early__badge" aria-hidden="true">
          18
        </span>
        <div>
          <h2 className="start-early__title">Osiemnaste urodziny to najlepszy możliwy start</h2>
          <p>
            To pierwszy dzień, w którym możesz sam założyć konto maklerskie i kupić ETF na własne
            nazwisko. Dostajesz wtedy za darmo jedyną rzecz, której później nie kupisz za żadne
            pieniądze: czas.
          </p>
        </div>
      </div>

      {showComparison && (
        <>
          <div className="versus">
            <div className="versus__side versus__side--now">
              <span>Zaczynasz dziś</span>
              <strong>{formatMoney(currentTotal)}</strong>
            </div>
            <span className="versus__vs" aria-hidden="true">
              vs
            </span>
            <div className="versus__side versus__side--late">
              <span>Zaczynasz {yearsLabel(delayYears)} później</span>
              <strong>{formatMoney(delayedTotal)}</strong>
            </div>
          </div>
          <p className="start-early__cost">
            Ta sama wpłata co miesiąc i ta sama data na mecie – różnicę robi wyłącznie start.{' '}
            {contributionGap > 0 ? (
              <>
                Zwłoka kosztuje {formatMoney(currentTotal - delayedTotal)}, a tylko{' '}
                {formatMoney(contributionGap)} z tego to pieniądze, których nie wpłacisz. Reszta,{' '}
                {formatMoney(timeCost)}, to procent składany, którego nie da się już nadrobić.
              </>
            ) : (
              <>
                Zwłoka kosztuje {formatMoney(timeCost)} – w całości jest to procent składany,
                którego nie da się już nadrobić.
              </>
            )}
          </p>
        </>
      )}
    </section>
  )
}
