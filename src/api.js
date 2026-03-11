import { getItem, removeItem } from './storage.js'

const API_BASE = 'https://api.beholder.news'

export function apiFetch(path, opts = {}) {
  const token = getItem('admin_token')
  const headers = { ...opts.headers }

  if (token) {
    headers['X-Admin-Token'] = token
  }

  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    opts = { ...opts, body: JSON.stringify(opts.body) }
  }

  const url = API_BASE + path

  return fetch(url, { ...opts, headers }).then((r) => {
    if (r.status === 401) {
      removeItem('admin_token')
      window.location.reload()
      return Promise.reject(new Error('Unauthorized'))
    }
    return r
  })
}

export default apiFetch
