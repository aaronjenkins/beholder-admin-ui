import { useState } from 'react'
import { removeItem } from '../storage.js'
import apiFetch from '../api.js'
import DataTable from './DataTable.jsx'
import LogViewer from './LogViewer.jsx'
import AddStreamModal from './AddStreamModal.jsx'

const TABLE_CONFIGS = {
  streams: {
    label: 'Streams',
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Name' },
      { field: 'color', label: 'Color' },
      { field: 'link', label: 'Link' },
      { field: 'region', label: 'Region' },
      { field: 'subregion', label: 'Subregion' },
      { field: 'bias_label', label: 'Bias' },
      { field: 'bias_color', label: 'Bias Color' },
      { field: 'video_id', label: 'Video ID' },
      { field: 'channel_id', label: 'Channel ID' },
      { field: 'stable_video_id', label: 'Stable Video ID' },
      { field: 'icon_url', label: 'Icon' },
    ],
  },
  break_streams: {
    label: 'Breaking',
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Name' },
      { field: 'link', label: 'Link' },
      { field: 'video_id', label: 'Video ID' },
    ],
  },
  osint_streams: {
    label: 'OSINT',
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Name' },
      { field: 'link', label: 'Link' },
      { field: 'video_id', label: 'Video ID' },
    ],
  },
  news_feeds: {
    label: 'News Feeds',
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Name' },
      { field: 'url', label: 'URL' },
      { field: 'icon_url', label: 'Icon' },
    ],
  },
  stock_symbols: {
    label: 'Stocks',
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'symbol', label: 'Symbol' },
      { field: 'name', label: 'Name' },
    ],
  },
}

const TABLE_KEYS = Object.keys(TABLE_CONFIGS)

const NAV_ITEMS = [
  { key: 'tables', label: 'Tables' },
  { key: 'status', label: 'API Status' },
  { key: 'logs', label: 'Logs' },
  { key: 'actions', label: 'Actions' },
]

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('tables')
  const [activeTable, setActiveTable] = useState('streams')
  const [showAddModal, setShowAddModal] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // API Status
  const [apiStatus, setApiStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Actions
  const [actionMsg, setActionMsg] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Force re-fetch key for DataTable
  const [tableKey, setTableKey] = useState(0)

  function logout() {
    removeItem('admin_token')
    window.location.reload()
  }

  async function fetchStatus() {
    setStatusLoading(true)
    try {
      const res = await apiFetch('/api/admin/status')
      if (res.ok) {
        const data = await res.json()
        setApiStatus(data)
      }
    } catch (err) {
      setApiStatus({ error: err.message })
    } finally {
      setStatusLoading(false)
    }
  }

  async function runAction(action, label) {
    if (!window.confirm('Run ' + label + '?')) return
    setActionLoading(action)
    setActionMsg('')
    try {
      const res = await apiFetch('/api/admin/' + action, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setActionMsg(label + ' completed successfully.' + (data.message ? ' ' + data.message : ''))
      } else {
        setActionMsg('Error: ' + (data.detail || 'Failed'))
      }
    } catch (err) {
      setActionMsg('Error: ' + err.message)
    } finally {
      setActionLoading('')
    }
  }

  function handleNavClick(key) {
    setActiveNav(key)
    setMobileNavOpen(false)
    if (key === 'status') fetchStatus()
  }

  function renderContent() {
    switch (activeNav) {
      case 'tables':
        return (
          <div className="tables-section">
            <div className="table-tabs">
              {TABLE_KEYS.map((key) => (
                <button
                  key={key}
                  className={'table-tab' + (activeTable === key ? ' active' : '')}
                  onClick={() => setActiveTable(key)}
                >
                  {TABLE_CONFIGS[key].label}
                </button>
              ))}
            </div>
            <div className="table-actions-bar">
              {activeTable === 'streams' && (
                <button className="btn-add-stream" onClick={() => setShowAddModal(true)}>
                  + Add Stream (Lookup)
                </button>
              )}
            </div>
            <DataTable
              key={activeTable + '-' + tableKey}
              tableName={activeTable}
              columns={TABLE_CONFIGS[activeTable].columns}
            />
          </div>
        )

      case 'status':
        return (
          <div className="status-section">
            <h2>YouTube API Key Status</h2>
            <button onClick={fetchStatus} disabled={statusLoading}>
              {statusLoading ? 'Checking...' : 'Refresh Status'}
            </button>
            {apiStatus && (
              <div className="status-card">
                {apiStatus.error ? (
                  <div className="status-error">{apiStatus.error}</div>
                ) : (
                  <pre className="status-json">{JSON.stringify(apiStatus, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )

      case 'logs':
        return (
          <div className="logs-section">
            <h2>Server Logs</h2>
            <LogViewer />
          </div>
        )

      case 'actions':
        return (
          <div className="actions-section">
            <h2>Server Actions</h2>
            {actionMsg && <div className="action-msg">{actionMsg}</div>}
            <div className="actions-grid">
              <div className="action-card">
                <h3>Rescrape Streams</h3>
                <p>Trigger a full rescan of all YouTube stream video IDs.</p>
                <button
                  onClick={() => runAction('rescrape', 'Rescrape')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'rescrape' ? 'Running...' : 'Run Rescrape'}
                </button>
              </div>
              <div className="action-card">
                <h3>Database Backup</h3>
                <p>Trigger a full database backup to the configured storage.</p>
                <button
                  onClick={() => runAction('backup', 'Backup')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'backup' ? 'Running...' : 'Run Backup'}
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <button className="hamburger" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          <span /><span /><span />
        </button>
        <h1 className="dash-title">Beholder Admin</h1>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </header>

      <div className="dash-body">
        <nav className={'dash-sidebar' + (mobileNavOpen ? ' open' : '')}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={'nav-item' + (activeNav === item.key ? ' active' : '')}
              onClick={() => handleNavClick(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="dash-content">
          {renderContent()}
        </main>
      </div>

      {showAddModal && (
        <AddStreamModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => setTableKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
