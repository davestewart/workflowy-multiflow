export const storage = {
  set (name, value) {
    localStorage.setItem(name, JSON.stringify(value))
  },

  get (name, defaultValue) {
    const value = localStorage.getItem(name)
    return typeof value === 'string'
      ? JSON.parse(value)
      : defaultValue
  },
}
