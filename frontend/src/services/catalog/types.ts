import { TQuery } from '../../shared/api/types'

export interface CatalogProduct {
  id_product: number
  category_number: number
  category_name: string
  product_name: string
  manufacturer: string
  characteristics: string
}

export interface Category {
  category_number: number
  category_name: string
}

export type TGetCatalogApi = TQuery<{}, CatalogProduct[]>

export type TGetCategoriesApi = TQuery<{}, Category[]>

export type TPostCatalogApi = TQuery<
  {
    category_number: number
    product_name: string
    manufacturer: string
    characteristics: string
  },
  { id_product: number; message: string }
>

export type TPutCatalogApi = TQuery<
  {
    id_product: number
    category_number: number
    product_name: string
    manufacturer: string
    characteristics: string
  },
  { message: string }
>

export type TDeleteCatalogApi = TQuery<{ id_product: number }, { message: string }>

export type TPostCategoryApi = TQuery<{ category_name: string }, { category_number: number; category_name: string }>

export type TPutCategoryApi = TQuery<{ category_number: number; category_name: string }, { message: string }>

export type TDeleteCategoryApi = TQuery<{ category_number: number }, { message: string }>
