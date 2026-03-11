// Safe localStorage wrapper for environments where localStorage may be blocked.

const mem = {}

export function getItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return mem[key] !== undefined ? mem[key] : null
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    mem[key] = String(value)
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    delete mem[key]
  }
}
