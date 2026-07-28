import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import dateFormat from 'dateformat'
import prettySeconds from 'pretty-seconds'

import LoadSpine from '../LoadSpine'
import style from './style.scss'

// The report hero. Answers, in order: did it hold, how hard did we push, what did it
// cost in latency, and where did it bend. Everything below this is detail.

// Lifecycle of the run, not a claim about the target's health.
const STATUS_TONE = {
  finished: { text: 'Finished', tone: 'held' },
  in_progress: { text: 'Running', tone: 'running' },
  started: { text: 'Starting', tone: 'running' },
  partially_finished: { text: 'Partial', tone: 'strain' },
  aborted: { text: 'Aborted', tone: 'idle' },
  failed: { text: 'Failed', tone: 'breach' }
}

const Readout = ({ label, value, unit, tone }) => (
  <div className={style.readout}>
    <span className={style.readout__label}>{label}</span>
    <span className={style.readout__value} data-tone={tone}>
      {value}
      {unit && <span className={style.readout__unit}>{unit}</span>}
    </span>
  </div>
)

const ReportHero = ({ report, aggregateReport }) => {
  const status = STATUS_TONE[report.status] || { text: report.status, tone: 'idle' }

  // The spine reads the same series the latency chart below it does, so the two can
  // never disagree. Keys are prefixed (A_, B_ …) when reports are compared, so find
  // this report's p95 rather than assuming a literal name.
  const rows = get(aggregateReport, 'latencyGraph', []) || []
  const keys = get(aggregateReport, 'latencyGraphKeys', []) || []
  const p95Key = keys.find(k => k.endsWith('p95') && !k.startsWith('benchmark')) || 'p95'

  const points = rows
    .map(row => ({ value: Number(row[p95Key]), label: row.name || '' }))
    .filter(p => !isNaN(p.value) && p.value !== 0)

  const peak = points.length ? Math.max(...points.map(p => p.value)) : null
  // Compare against the benchmark run's p95 latency — a millisecond value on the
  // same axis. The benchmark *score* is a 0-100 composite and belongs nowhere near
  // this scale.
  const benchmarkP95 = Number(get(rows, [0, 'benchmark_p95'], 0)) || null
  const errorRate = report.last_success_rate !== undefined && report.last_success_rate !== null
    ? (100 - Number(report.last_success_rate))
    : null
  const rps = report.avg_rps === undefined ? report.last_rps : report.avg_rps

  const errorTone = errorRate === null ? undefined
    : errorRate < 1 ? 'held' : errorRate < 5 ? 'strain' : 'breach'

  return (
    <section className={style.hero}>
      <header className={style.hero__head}>
        <div className={style.hero__id}>
          <span className={style.hero__eyebrow}>Test run</span>
          <h1 className={style.hero__title}>
            {report.test_name ? report.test_name.charAt(0).toUpperCase() + report.test_name.slice(1) : 'Report'}
          </h1>
          <p className={style.hero__meta}>
            <span>{report.test_type || 'load test'}</span>
            <span className={style.hero__dot} />
            <span>{report.start_time ? dateFormat(new Date(report.start_time), 'd mmm yyyy, HH:MM') : '—'}</span>
            <span className={style.hero__dot} />
            <span>{report.parallelism || 1} {Number(report.parallelism) === 1 ? 'runner' : 'runners'}</span>
          </p>
        </div>

        <span className={style.hero__status} data-tone={status.tone}>{status.text}</span>
      </header>

      <div className={style.hero__readouts}>
        <Readout
          label='p95 latency'
          value={peak === null ? '—' : Math.round(peak).toLocaleString()}
          unit={peak === null ? undefined : 'ms'}
        />
        <Readout
          label='Requests / sec'
          value={rps === undefined || rps === null ? '—' : Math.floor(rps).toLocaleString()}
        />
        <Readout
          label='Errors'
          value={errorRate === null ? '—' : `${errorRate.toFixed(2)}`}
          unit={errorRate === null ? undefined : '%'}
          tone={errorTone}
        />
        <Readout
          label='Duration'
          value={report.duration ? prettySeconds(Number(report.duration)) : '—'}
        />
      </div>

      <LoadSpine points={points} reference={benchmarkP95} label='p95 latency' />
    </section>
  )
}

ReportHero.propTypes = {
  report: PropTypes.object.isRequired,
  aggregateReport: PropTypes.object
}

export default ReportHero
