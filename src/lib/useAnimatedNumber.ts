import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Płynnie dojeżdża do nowej wartości, żeby duże kwoty nie przeskakiwały skokowo. */
export function useAnimatedNumber(target: number, duration = 550): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!Number.isFinite(target)) return

    const from = fromRef.current
    const start = performance.now()
    const span = prefersReducedMotion() ? 0 : duration

    const tick = (now: number) => {
      const progress = span <= 0 ? 1 : Math.min(1, (now - start) / span)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (target - from) * eased
      fromRef.current = current
      setValue(current)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}
