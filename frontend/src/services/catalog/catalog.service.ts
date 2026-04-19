import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import * as T from './types'

export class CatalogService {
  static async getProducts(
    params?: { sort?: string; order?: 'ASC' | 'DESC'; category_number?: number },
  ): TResponse<T.TGetCatalogApi['response']> {
    return apiPrivate.get('/catalog', { params })
  }

  static async getCategories(
    params?: { sort?: string; order?: 'ASC' | 'DESC' },
  ): TResponse<T.TGetCategoriesApi['response']> {
    return apiPrivate.get('/categories', { params })
  }

  static async postProduct(
    data: T.TPostCatalogApi['payload'],
  ): TResponse<T.TPostCatalogApi['response']> {
    return apiPrivate.post('/catalog', data)
  }

  static async putProduct(
    data: T.TPutCatalogApi['payload'],
  ): TResponse<T.TPutCatalogApi['response']> {
    return apiPrivate.put(`/catalog/${data.id_product}`, data)
  }

  static async deleteProduct(
    data: T.TDeleteCatalogApi['payload'],
  ): TResponse<T.TDeleteCatalogApi['response']> {
    return apiPrivate.delete(`/catalog/${data.id_product}`)
  }

  static async postCategory(
    data: T.TPostCategoryApi['payload'],
  ): TResponse<T.TPostCategoryApi['response']> {
    return apiPrivate.post('/categories', data)
  }

  static async putCategory(
    data: T.TPutCategoryApi['payload'],
  ): TResponse<T.TPutCategoryApi['response']> {
    return apiPrivate.put(`/categories/${data.category_number}`, { category_name: data.category_name })
  }

  static async deleteCategory(
    data: T.TDeleteCategoryApi['payload'],
  ): TResponse<T.TDeleteCategoryApi['response']> {
    return apiPrivate.delete(`/categories/${data.category_number}`)
  }
}
