import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { displayValues } from '../lib/projection'
import type { ProjectionPoint } from '../lib/projection'
import { formatCompactMoney, formatMoney } from '../lib/format'

interface GrowthChartProps {
  points: ProjectionPoint[]
  showReal: boolean
  years: number
}

const PAD_TOP = 18
const PAD_BOTTOM = 26
const PAD_RIGHT = 6
const PAD_LEFT = 0
/** Powyżej tej liczby punktów rysujemy co n-ty, żeby ścieżki SVG zostały krótkie. */
const MAX_RENDERED_POINTS = 220

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const stepped = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return stepped * magnitude
}

export function GrowthChart({ points, showReal, years }: GrowthChartProps) {
  const gradientId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hoverMonth, setHoverMonth] = useState<number | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    setWidth(element.clientWidth)
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const height = clamp(width * 0.58, 220, 340)
  const innerWidth = Math.max(1, width - PAD_LEFT - PAD_RIGHT)
  const innerHeight = Math.max(1, height - PAD_TOP - PAD_BOTTOM)
  const lastMonth = Math.max(1, points.length - 1)

  const { yMax, yTicks } = useMemo(() => {
    let peak = 0
    for (const point of points) {
      peak = Math.max(peak, point.balance, point.contributed)
    }
    const step = niceStep(peak / 4)
    const top = Math.max(step, Math.ceil(peak / step) * step)
    const ticks: number[] = []
    for (let value = 0; value <= top + step / 2; value += step) ticks.push(value)
    return { yMax: top, yTicks: ticks }
  }, [points])

  const { scaleX, scaleY } = useMemo(
    () => ({
      scaleX: (month: number) => PAD_LEFT + (month / lastMonth) * innerWidth,
      scaleY: (value: number) =>
        PAD_TOP + innerHeight - (clamp(value, 0, yMax) / yMax) * innerHeight,
    }),
    [lastMonth, innerWidth, innerHeight, yMax],
  )

  const sampled = useMemo(() => {
    const stride = Math.max(1, Math.ceil(points.length / MAX_RENDERED_POINTS))
    const result: ProjectionPoint[] = []
    for (let index = 0; index < points.length; index += stride) result.push(points[index])
    const last = points[points.length - 1]
    if (result[result.length - 1] !== last) result.push(last)
    return result
  }, [points])

  const paths = useMemo(() => {
    if (width === 0) return null
    const toLine = (accessor: (point: ProjectionPoint) => number) =>
      sampled
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'}${scaleX(point.month).toFixed(1)},${scaleY(accessor(point)).toFixed(1)}`,
        )
        .join(' ')

    const contributedLine = toLine((point) => point.contributed)
    const balanceLine = toLine((point) => point.balance)
    const realLine = toLine((point) => point.real)

    const left = scaleX(0).toFixed(1)
    const right = scaleX(lastMonth).toFixed(1)
    const bottom = (PAD_TOP + innerHeight).toFixed(1)
    const top = PAD_TOP.toFixed(1)

    const reversedBalance = [...sampled]
      .reverse()
      .map((point) => `L${scaleX(point.month).toFixed(1)},${scaleY(point.balance).toFixed(1)}`)
      .join(' ')

    return {
      contributedLine,
      balanceLine,
      realLine,
      contributedArea: `${contributedLine} L${right},${bottom} L${left},${bottom} Z`,
      gainsBand: `${contributedLine} ${reversedBalance} Z`,
      clipAbove: `${contributedLine} L${right},${top} L${left},${top} Z`,
      clipBelow: `${contributedLine} L${right},${bottom} L${left},${bottom} Z`,
    }
  }, [sampled, width, scaleX, scaleY, lastMonth, innerHeight])

  const yearStep = years <= 12 ? 2 : years <= 25 ? 5 : 10
  const xTicks = useMemo(() => {
    const ticks: number[] = []
    for (let year = 0; year <= years; year += yearStep) ticks.push(year)
    if (ticks[ticks.length - 1] !== years) ticks.push(years)
    return ticks
  }, [years, yearStep])

  // Na dotyku podpowiedź zostaje po puszczeniu palca – znika dopiero
  // przy dotknięciu czegoś poza wykresem.
  useEffect(() => {
    if (hoverMonth === null) return
    const dismiss = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      if (containerRef.current?.contains(event.target as Node)) return
      setHoverMonth(null)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [hoverMonth])

  const activePoint = hoverMonth === null ? null : points[clamp(hoverMonth, 0, lastMonth)]
  const activeValues = activePoint ? displayValues(activePoint, showReal) : null

  const handlePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left - PAD_LEFT) / innerWidth
    setHoverMonth(Math.round(clamp(ratio, 0, 1) * lastMonth))
  }

  const tooltipLeft = activePoint ? clamp(scaleX(activePoint.month), 78, Math.max(78, width - 78)) : 0

  return (
    <div className="chart" ref={containerRef}>
      {width > 0 && (
        <svg
          className="chart__svg"
          width={width}
          height={height}
          role="img"
          aria-label={`Wykres wzrostu inwestycji przez ${years} lat`}
          onPointerDown={handlePointer}
          onPointerMove={(event) => {
            if (event.pointerType === 'mouse' || event.buttons > 0) handlePointer(event)
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') setHoverMonth(null)
          }}
          onPointerCancel={() => setHoverMonth(null)}
        >
          <defs>
            <linearGradient id={`${gradientId}-contrib`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(129 140 248)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="rgb(129 140 248)" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id={`${gradientId}-gain`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id={`${gradientId}-loss`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(248 113 113)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="rgb(248 113 113)" stopOpacity="0.45" />
            </linearGradient>
            {paths && (
              <>
                <clipPath id={`${gradientId}-above`}>
                  <path d={paths.clipAbove} />
                </clipPath>
                <clipPath id={`${gradientId}-below`}>
                  <path d={paths.clipBelow} />
                </clipPath>
              </>
            )}
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                className="chart__grid"
                x1={PAD_LEFT}
                x2={PAD_LEFT + innerWidth}
                y1={scaleY(tick)}
                y2={scaleY(tick)}
              />
              {tick > 0 && (
                <text className="chart__ylabel" x={PAD_LEFT + 2} y={scaleY(tick) - 5}>
                  {formatCompactMoney(tick)}
                </text>
              )}
            </g>
          ))}

          {paths && (
            <>
              <path d={paths.contributedArea} fill={`url(#${gradientId}-contrib)`} />
              <path
                d={paths.gainsBand}
                fill={`url(#${gradientId}-gain)`}
                clipPath={`url(#${gradientId}-above)`}
              />
              <path
                d={paths.gainsBand}
                fill={`url(#${gradientId}-loss)`}
                clipPath={`url(#${gradientId}-below)`}
              />
              <path className="chart__line chart__line--contrib" d={paths.contributedLine} />
              {showReal && <path className="chart__line chart__line--real" d={paths.realLine} />}
              <path className="chart__line chart__line--balance" d={paths.balanceLine} />
            </>
          )}

          {xTicks.map((year) => (
            <text
              key={year}
              className="chart__xlabel"
              x={clamp(scaleX(year * 12), 8, width - 8)}
              y={height - 8}
              textAnchor={year === 0 ? 'start' : year === years ? 'end' : 'middle'}
            >
              {year === 0 ? 'dziś' : `${year} l.`}
            </text>
          ))}

          {activePoint && (
            <g className="chart__cursor">
              <line
                x1={scaleX(activePoint.month)}
                x2={scaleX(activePoint.month)}
                y1={PAD_TOP}
                y2={PAD_TOP + innerHeight}
              />
              <circle
                className="chart__dot chart__dot--contrib"
                cx={scaleX(activePoint.month)}
                cy={scaleY(activePoint.contributed)}
                r={4}
              />
              <circle
                className="chart__dot chart__dot--balance"
                cx={scaleX(activePoint.month)}
                cy={scaleY(activePoint.balance)}
                r={5}
              />
            </g>
          )}
        </svg>
      )}

      {activePoint && activeValues && (
        <div className="chart__tooltip" style={{ left: tooltipLeft }}>
          <span className="chart__tooltip-when">
            {activePoint.month === 0
              ? 'dziś'
              : `za ${Math.floor(activePoint.years)} l. ${activePoint.month % 12} mies.`}
          </span>
          <strong>{formatMoney(activeValues.total)}</strong>
          <span>
            <i className="dot dot--contrib" />
            wpłacone {formatMoney(activeValues.contributed)}
          </span>
          <span>
            <i className="dot dot--gain" />
            zysk {formatMoney(activeValues.gains)}
          </span>
        </div>
      )}

      <div className="chart__legend">
        <span>
          <i className="dot dot--gain" />
          Wartość portfela
        </span>
        <span>
          <i className="dot dot--contrib" />
          Twoje wpłaty
        </span>
        {showReal && (
          <span>
            <i className="dot dot--real" />
            Realnie (dzisiejsze zł)
          </span>
        )}
      </div>
    </div>
  )
}
