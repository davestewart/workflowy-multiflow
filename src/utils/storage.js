export const storage = {
  set (key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },

  get (key, defaultValue) {
    const value = localStorage.getItem(key)
    return typeof value === 'string'
      ? JSON.parse(value)
      : defaultValue
  },
}
