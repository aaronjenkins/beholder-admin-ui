import { useState, useEffect } from 'react'
import apiFetch from '../api.js'

export default function DataTable({ tableName, columns }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingCell, setEditingCell] = useState(null) // { rowId, field }
  const [editValue, setEditValue] = useState('')
  const [savingRow, setSavingRow] = useState(null)
  const [deletingRow, setDeletingRow] = useState(null)
  const [addingRow, setAddingRow] = useState(false)
  const [newRow, setNewRow] = useState({})

  async function fetchRows() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/admin/' + tableName)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to fetch')
      }
      const data = await res.json()
      setRows(Array.isArray(data) ? data : data.rows || data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
    setEditingCell(null)
    setAddingRow(false)
    setNewRow({})
  }, [tableName])

  function startEdit(rowId, field, currentValue) {
    setEditingCell({ rowId, field })
    setEditValue(currentValue != null ? String(currentValue) : '')
  }

  function cancelEdit() {
    setEditingCell(null)
    setEditValue('')
  }

  async function saveEdit(rowId, field) {
    setSavingRow(rowId)
    try {
      const res = await apiFetch('/api/admin/' + tableName + '/' + rowId, {
        method: 'PUT',
        body: { [field]: editValue },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Save failed')
      }
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: editValue } : r))
      )
      setEditingCell(null)
      setEditValue('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingRow(null)
    }
  }

  async function deleteRow(rowId) {
    if (!window.confirm('Delete row ' + rowId + '?')) return
    setDeletingRow(rowId)
    try {
      const res = await apiFetch('/api/admin/' + tableName + '/' + rowId, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Delete failed')
      }
      setRows((prev) => prev.filter((r) => r.id !== rowId))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingRow(null)
    }
  }

  function startAddRow() {
    const empty = {}
    columns.forEach((col) => {
      if (col.field !== 'id') empty[col.field] = ''
    })
    setNewRow(empty)
    setAddingRow(true)
  }

  async function saveNewRow() {
    setSavingRow('new')
    setError('')
    try {
      const endpoint = tableName === 'streams'
        ? '/api/admin/streams/create'
        : '/api/admin/' + tableName
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: newRow,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Create failed')
      }
      setAddingRow(false)
      setNewRow({})
      fetchRows()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingRow(null)
    }
  }

  function handleEditKeyDown(e, rowId, field) {
    if (e.key === 'Enter') {
      saveEdit(rowId, field)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  function renderCellValue(value, field) {
    if (value == null || value === '') return <span className="cell-empty">--</span>
    const str = String(value)
    if ((field === 'color' || field === 'bias_color') && str.startsWith('#')) {
      return (
        <span className="cell-color">
          <span className="color-swatch" style={{ backgroundColor: str }} />
          {str}
        </span>
      )
    }
    if (field === 'icon_url' && str.startsWith('http')) {
      return <img src={str} alt="" className="cell-icon" />
    }
    if (str.length > 60) return str.slice(0, 57) + '...'
    return str
  }

  return (
    <div className="data-table-container">
      <div className="data-table-toolbar">
        <button onClick={fetchRows} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button onClick={startAddRow} disabled={addingRow}>
          + Add Row
        </button>
        <span className="row-count">{rows.length} rows</span>
      </div>

      {error && <div className="table-error">{error}<button className="dismiss-btn" onClick={() => setError('')}>&times;</button></div>}

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.field}>{col.label || col.field}</th>
              ))}
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingRow && (
              <tr className="adding-row">
                {columns.map((col) => (
                  <td key={col.field}>
                    {col.field === 'id' ? (
                      <span className="cell-empty">auto</span>
                    ) : (
                      <input
                        type="text"
                        className="cell-edit-input"
                        value={newRow[col.field] || ''}
                        onChange={(e) => setNewRow({ ...newRow, [col.field]: e.target.value })}
                        placeholder={col.field}
                      />
                    )}
                  </td>
                ))}
                <td className="actions-col">
                  <button className="btn-save" onClick={saveNewRow} disabled={savingRow === 'new'}>
                    {savingRow === 'new' ? '...' : 'Save'}
                  </button>
                  <button className="btn-cancel" onClick={() => { setAddingRow(false); setNewRow({}) }}>
                    Cancel
                  </button>
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => {
                  const isEditing = editingCell && editingCell.rowId === row.id && editingCell.field === col.field
                  return (
                    <td
                      key={col.field}
                      className={col.field === 'id' ? 'id-col' : 'editable-cell'}
                      onClick={() => {
                        if (col.field !== 'id' && !isEditing) {
                          startEdit(row.id, col.field, row[col.field])
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          className="cell-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, row.id, col.field)}
                          onBlur={() => cancelEdit()}
                          autoFocus
                        />
                      ) : (
                        renderCellValue(row[col.field], col.field)
                      )}
                    </td>
                  )
                })}
                <td className="actions-col">
                  {editingCell && editingCell.rowId === row.id ? (
                    <>
                      <button
                        className="btn-save"
                        onMouseDown={(e) => { e.preventDefault(); saveEdit(row.id, editingCell.field) }}
                        disabled={savingRow === row.id}
                      >
                        {savingRow === row.id ? '...' : 'Save'}
                      </button>
                      <button className="btn-cancel" onMouseDown={(e) => { e.preventDefault(); cancelEdit() }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-delete"
                      onClick={() => deleteRow(row.id)}
                      disabled={deletingRow === row.id}
                    >
                      {deletingRow === row.id ? '...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length + 1} className="empty-row">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
