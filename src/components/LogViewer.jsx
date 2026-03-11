import { useState, useEffect, useRef } from 'react'
import apiFetch from '../api.js'

const LEVELS = ['ALL', 'ERROR', 'WARNING', 'INFO', 'DEBUG']

export default function LogViewer() {
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [lineCount, setLineCount] = useState(200)
  const logRef = useRef(null)

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/logs?n=' + lineCount)
      if (res.ok) {
        const data = await res.json()
        setLogs(typeof data === 'string' ? data : (data.logs || JSON.stringify(data, null, 2)))
      }
    } catch (err) {
      setLogs('Error fetching logs: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [lineCount])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchLogs, 5000)
    return () => clearInterval(id)
  }, [autoRefresh, lineCount])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  function getFilteredLines() {
    if (!logs) return ''
    if (levelFilter === 'ALL') return logs
    const lines = logs.split('\n')
    return lines
      .filter((line) => {
        const upper = line.toUpperCase()
        return upper.includes(levelFilter) || !LEVELS.slice(1).some((l) => upper.includes(l))
      })
      .join('\n')
  }

  function getLogLineClass(line) {
    const upper = line.toUpperCase()
    if (upper.includes('ERROR')) return 'log-error'
    if (upper.includes('WARNING') || upper.includes('WARN')) return 'log-warning'
    if (upper.includes('DEBUG')) return 'log-debug'
    return ''
  }

  const filtered = getFilteredLines()

  return (
    <div className="log-viewer">
      <div className="log-toolbar">
        <div className="log-controls">
          <button onClick={fetchLogs} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <select value={lineCount} onChange={(e) => setLineCount(Number(e.target.value))}>
            <option value={100}>100 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
            <option value={1000}>1000 lines</option>
          </select>
        </div>
        <div className="log-filters">
          {LEVELS.map((level) => (
            <button
              key={level}
              className={'log-filter-btn' + (levelFilter === level ? ' active' : '')}
              onClick={() => setLevelFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="log-output" ref={logRef}>
        {filtered.split('\n').map((line, i) => (
          <div key={i} className={'log-line ' + getLogLineClass(line)}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
