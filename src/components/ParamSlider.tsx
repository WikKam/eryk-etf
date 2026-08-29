import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { formatNumber } from '../lib/format'

interface ParamSliderProps {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  decimals?: number
  onChange: (value: number) => void
}

const parseLocaleNumber = (raw: string): number => {
  const normalized = raw.replace(/[\s\u00a0]/g, '').replace(',', '.')
  return Number.parseFloat(normalized)
}

export function ParamSlider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  decimals = 0,
  onChange,
}: ParamSliderProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    const parsed = parseLocaleNumber(raw)
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(Number(clamped.toFixed(decimals)))
    }
    setDraft(null)
  }

  const displayed =
    draft ?? (decimals > 0 ? value.toFixed(decimals).replace('.', ',') : formatNumber(value))

  const fillPercent = ((value - min) / (max - min)) * 100

  return (
    <div className="param">
      <div className="param__head">
        <label className="param__label" htmlFor={id}>
          {label}
        </label>
        <div className="param__value">
          <input
            id={id}
            className="param__input"
            type="text"
            inputMode="decimal"
            value={displayed}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => {
              setDraft(decimals > 0 ? value.toFixed(decimals).replace('.', ',') : String(value))
              event.target.select()
            }}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          <span className="param__unit">{unit}</span>
        </div>
      </div>

      <input
        className="param__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ '--fill': `${fillPercent}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      {hint && <p className="param__hint">{hint}</p>}
    </div>
  )
}
