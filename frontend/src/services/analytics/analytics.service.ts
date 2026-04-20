import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'

export type TCategorySalesRow = {
  category_number: number
  category_name: string
  checks_count: number
  total_units: number
  total_revenue: number
}

export type TLoyalCustomerRow = {
  card_number: string
  cust_surname: string
  cust_name: string
  cust_patronymic: string | null
  percent: number
}

export class AnalyticsService {
  static async getCategorySales(
    startDate: string,
    endDate: string,
  ): TResponse<TCategorySalesRow[]> {
    return apiPrivate.get('/analytics/category-sales', {
      params: { start_date: startDate, end_date: endDate },
    })
  }

  static async getCustomersBoughtAll(
    categoryNumber: number,
  ): TResponse<TLoyalCustomerRow[]> {
    return apiPrivate.get('/analytics/customers-bought-all', {
      params: { category_number: categoryNumber },
    })
  }
}
