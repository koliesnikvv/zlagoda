import { TQuery } from "../../shared/api/types"
import { StoreProduct } from "../../types"

export type TPostProductData = {
    UPC?: string,
    id_product: number,
    selling_price: number,
    products_number: number,
    promotional_product: boolean,
}


export type TGetProductsParams = {
  sort?: string
  order?: 'ASC' | 'DESC'
  promo?: boolean
  category_number?: number
}

export type TGetProductsApi = TQuery<TGetProductsParams, TGetProductsResponse>
type TGetProductsResponse = StoreProduct[]


export type TDeleteProductByUPCApi = TQuery<TDeleteProductByUPCPayload, TDeleteProductByUPCResponse>
type TDeleteProductByUPCPayload = {
    upc: string
}
type TDeleteProductByUPCResponse = void


export type TPostProductApi = TQuery<TPostProductPayload, TPostProductResponse>
type TPostProductPayload = TPostProductData
type TPostProductResponse = void


export type TPathProductApi = TQuery<TPathProductPayload, TPathProductResponse>
type TPathProductPayload = TPostProductData
type TPathProductResponse = void
