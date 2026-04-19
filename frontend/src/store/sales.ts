import { create } from 'zustand'
import { Sale } from '../types'
import { SalesService } from '../services'
import { TSalesFilters } from '../services/sales/types'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'

export type TSalesStore = {
  sales: Sale[]
  loadSales: (filters?: TSalesFilters) => Promise<void>
  deleteSale: (id: number) => Promise<void>
  clear: () => void
}

export const useSalesStore = create<TSalesStore>()(set => ({
  sales: [],
  loadSales: async (filters?: TSalesFilters) => {
    try {
      const data = await SalesService.getSales(filters)
      set({ sales: data.data })
    } catch (error) {
      toast.error('Помилка завантаження продажів')
      console.error('[useSalesStore]: loadSales error:', error)
    }
  },
  deleteSale: async (id: number) => {
    try {
      await SalesService.deleteSale({ id })
      set(state => ({ sales: state.sales.filter(s => s.id !== id) }))
      toast.success('Чек видалено')
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const errData = error.response.data
        toast.error(errData.detail || 'Помилка видалення')
        return
      }
      toast.error('Помилка видалення')
      console.error('[useSalesStore]: deleteSale error:', error)
    }
  },
  clear: () => set({ sales: [] }),
}))
