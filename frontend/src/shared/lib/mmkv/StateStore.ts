
export const LocalStorage = {
  getItem: (key: string): string | null => {
    const value = localStorage.getItem(key)
    return value ?? null
  },

  setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value)
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key)
  },
}
