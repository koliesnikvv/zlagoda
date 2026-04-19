


import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import * as T from './types'


export class ProductsService {
  //Get products
  static async getProducts(
    params?: T.TGetProductsParams,
  ): TResponse<T.TGetProductsApi['response']> {
    return apiPrivate.get(`/products`, { params })
  }

  //DELETE products
  static async deleteProducts(
    data: T.TDeleteProductByUPCApi['payload']
  ): TResponse<T.TDeleteProductByUPCApi['response']> {
    return apiPrivate.delete(`/store-products/${data.upc}`)
  }

  //POST products
  static async postProducts(
    data: T.TPostProductApi['payload']
  ): TResponse<T.TPostProductApi['response']> {
    return apiPrivate.post(`/store-products`, data)
  }

  //PATCH products
  static async patchProducts(
    data: T.TPathProductApi['payload']
  ): TResponse<T.TPathProductApi['response']> {
    return apiPrivate.put(`/store-products/${data.UPC}`, data)
  }
}
