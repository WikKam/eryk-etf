import { displayValues } from '../lib/projection'
import type { ProjectionPoint } from '../lib/projection'
import { formatMoney, yearsLabel } from '../lib/format'

interface MilestoneCardProps {
  years: number
  point: ProjectionPoint
  showReal: boolean
  targetDate: Date
  active: boolean
  onSelect: () => void
}

const monthYear = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })

export function MilestoneCard({
  years,
  point,
  showReal,
  targetDate,
  active,
  onSelect,
}: MilestoneCardProps) {
  const { total, contributed, gains } = displayValues(point, showReal)
  const multiplier = contributed > 0 ? total / contributed : 0
  // Pasek zawsze pokazuje mniejszą z dwóch kwot na tle większej: przy zysku
  // wpłaty na tle portfela, przy stracie – to, co zostało, na tle wpłat.
  const larger = Math.max(total, contributed)
  const contributedShare = larger > 0 ? (Math.min(total, contributed) / larger) * 100 : 100

  return (
    <button
      type="button"
      className={`milestone${active ? ' milestone--active' : ''}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className="milestone__head">
        <span className="milestone__years">za {yearsLabel(years)}</span>
        <span className="milestone__date">{monthYear.format(targetDate)}</span>
      </div>

      <strong className="milestone__total">{formatMoney(total)}</strong>

      <div
        className={`milestone__bar${gains < 0 ? ' milestone__bar--loss' : ''}`}
        aria-hidden="true"
      >
        <span className="milestone__bar-fill" style={{ width: `${contributedShare}%` }} />
      </div>

      <dl className="milestone__rows">
        <div>
          <dt>
            <i className="dot dot--contrib" />
            Wpłacone
          </dt>
          <dd>{formatMoney(contributed)}</dd>
        </div>
        <div>
          <dt>
            <i className="dot dot--gain" />
            Zysk
          </dt>
          <dd className={gains >= 0 ? 'is-positive' : 'is-negative'}>
            {gains >= 0 ? '+' : ''}
            {formatMoney(gains)}
          </dd>
        </div>
      </dl>

      <span className="milestone__multiplier">
        {multiplier.toFixed(2).replace('.', ',')}× tego, co wpłacisz
      </span>
    </button>
  )
}
