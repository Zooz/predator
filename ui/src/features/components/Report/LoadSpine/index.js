import React from 'react'
import PropTypes from 'prop-types'
import style from './style.scss'

// ── The load spine ────────────────────────────────────────────────────────
// The signature element. A run is a system held under pressure for a period of
// time, and the one thing an operator wants before anything else is "did it hold,
// and if not, when did it start to bend". This draws the whole run as a single
// pressure trace: p95 latency over time, with the benchmark run's p95 as a dashed
// reference and a tick on the first sample that went past it.
//
// The reference is the benchmark's p95 *latency*, not the benchmark score. The score
// is a 0-100 composite and drawing it on a millisecond axis would make the chart
// lie about where the run crossed the line.
//
// Deliberately not a recharts chart — it has no axes, no legend and no tooltip. It
// is a shape you read in one glance, sitting above the real charts that follow.

const VIEW_W = 1000
const VIEW_H = 100

const buildPath = (points, max) => {
  if (points.length === 0) return { line: '', area: '' }
  const stepX = points.length > 1 ? VIEW_W / (points.length - 1) : 0
  const y = (v) => VIEW_H - (max > 0 ? (v / max) * (VIEW_H - 8) : 0) - 4
  const coords = points.map((p, i) => [i * stepX, y(p.value)])

  const line = coords
    .map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`
  return { line, area }
}

const LoadSpine = ({ points, reference, referenceLabel, label }) => {
  // An empty state that explains itself beats an empty axis frame.
  if (!points || points.length < 2) {
    return (
      <div className={style.spine}>
        <div className={style.spine__empty}>
          Not enough samples yet to draw the run.
        </div>
      </div>
    )
  }

  const values = points.map(p => p.value)
  const peak = Math.max(...values)
  const max = Math.max(peak, reference || 0) * 1.12
  const { line, area } = buildPath(points, max)

  // Without a benchmark there is nothing to be over, so the trace stays neutral
  // rather than asserting a verdict the data cannot support.
  const overIndex = reference ? points.findIndex(p => p.value > reference) : -1
  const isOver = overIndex > -1
  const stepX = VIEW_W / (points.length - 1)
  const referenceY = reference && max > 0
    ? VIEW_H - (reference / max) * (VIEW_H - 8) - 4
    : null

  return (
    <div className={style.spine} data-over={String(isOver)}>
      <svg
        className={style.spine__svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio='none'
        role='img'
        aria-label={isOver
          ? `${label} peaked at ${Math.round(peak)} ms, above the benchmark's ${Math.round(reference)} ms`
          : `${label} peaked at ${Math.round(peak)} ms`}
      >
        <defs>
          <linearGradient id='spine-fill' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='var(--spine-hue)' stopOpacity='0.22' />
            <stop offset='100%' stopColor='var(--spine-hue)' stopOpacity='0' />
          </linearGradient>
        </defs>

        <path d={area} fill='url(#spine-fill)' />
        <path
          d={line}
          fill='none'
          stroke='var(--spine-hue)'
          strokeWidth='2'
          strokeLinejoin='round'
          strokeLinecap='round'
          vectorEffect='non-scaling-stroke'
        />

        {referenceY !== null && (
          <line
            x1='0' y1={referenceY} x2={VIEW_W} y2={referenceY}
            stroke='var(--fg-muted)'
            strokeWidth='1'
            strokeDasharray='4 5'
            vectorEffect='non-scaling-stroke'
          />
        )}

        {isOver && (
          <line
            x1={overIndex * stepX} y1='0'
            x2={overIndex * stepX} y2={VIEW_H}
            stroke='var(--breach-fg)'
            strokeWidth='1'
            vectorEffect='non-scaling-stroke'
          />
        )}
      </svg>

      <div className={style.spine__axis}>
        <span>{points[0].label}</span>
        {reference ? (
          <span className={style.spine__threshold}>
            {referenceLabel} {Math.round(reference)} ms
          </span>
        ) : (
          <span className={style.spine__threshold}>
            peak {Math.round(peak)} ms
          </span>
        )}
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  )
}

LoadSpine.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.number,
    label: PropTypes.string
  })),
  reference: PropTypes.number,
  referenceLabel: PropTypes.string,
  label: PropTypes.string
}

LoadSpine.defaultProps = {
  points: [],
  referenceLabel: 'benchmark p95',
  label: 'Latency'
}

export default LoadSpine
