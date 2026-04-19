import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import * as T from './types'

export class SalesService {
  static async getSales(
    params?: T.TSalesFilters,
  ): TResponse<T.TGetSalesApi['response']> {
    return apiPrivate.get('/sales', { params })
  }

  static async getCheckDetails(
    checkNumber: string,
  ): TResponse<T.TCheckDetails> {
    return apiPrivate.get(`/sales/${checkNumber}`)
  }

  static async postSale(
    data: T.TPostSaleApi['payload'],
  ): TResponse<T.TPostSaleApi['response']> {
    return apiPrivate.post('/sales', data)
  }

  static async deleteSale(
    data: T.TDeleteSaleApi['payload'],
  ): TResponse<T.TDeleteSaleApi['response']> {
    return apiPrivate.delete(`/sales/${data.id}`)
  }
}
