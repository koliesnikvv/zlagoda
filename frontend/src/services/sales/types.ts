import { TQuery } from '../../shared/api/types'
import { Sale } from '../../types'

export type TSalesFilters = {
  start_date?: string
  end_date?: string
  id_employee?: string
  today_only?: boolean
  sort?: string
  order?: 'ASC' | 'DESC'
}

export type TGetSalesApi = TQuery<TGetSalesPayload, TGetSalesResponse>
type TGetSalesPayload = TSalesFilters
type TGetSalesResponse = Sale[]

export type TDeleteSaleApi = TQuery<TDeleteSalePayload, TDeleteSaleResponse>
type TDeleteSalePayload = { id: number }
type TDeleteSaleResponse = void

export type TPostSaleApi = TQuery<TPostSalePayload, TPostSaleResponse>
type TPostSalePayload = {
  card_number?: string | null
  items: { UPC: string; product_number: number }[]
}
type TPostSaleResponse = {
  message: string
  check_number: string
  total: number
  vat: number
}

export type TCheckDetailsItem = {
  upc: string
  product_name: string
  product_number: number
  selling_price: number
}

export type TCheckDetails = {
  check_number: string
  id_employee: string
  cashier_surname: string
  card_number: string | null
  print_date: string
  sum_total: number
  vat: number
  items: TCheckDetailsItem[]
}
