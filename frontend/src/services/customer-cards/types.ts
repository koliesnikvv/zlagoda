import { TQuery } from '../../shared/api/types'

export type TCustomerCard = {
  card_number: string
  cust_surname: string
  cust_name: string
  cust_patronymic: string | null
  phone_number: string
  city: string | null
  street: string | null
  zip_code: string | null
  percent: number
}

export type TCustomerCardFormData = {
  card_number: string
  cust_surname: string
  cust_name: string
  cust_patronymic: string
  phone_number: string
  city: string
  street: string
  zip_code: string
  percent: number | string
}

export type TGetCardsParams = {
  percent?: number
  surname?: string
  sort?: string
  order?: 'ASC' | 'DESC'
}

export type TGetCardsApi = TQuery<TGetCardsParams, TCustomerCard[]>

export type TPostCardPayload = {
  card_number: string
  cust_surname: string
  cust_name: string
  cust_patronymic?: string | null
  phone_number: string
  city?: string | null
  street?: string | null
  zip_code?: string | null
  percent: number
}
export type TPostCardApi = TQuery<TPostCardPayload, { message: string }>

export type TPutCardPayload = {
  card_number: string
  cust_surname: string
  cust_name: string
  cust_patronymic?: string | null
  phone_number: string
  city?: string | null
  street?: string | null
  zip_code?: string | null
  percent: number
}
export type TPutCardApi = TQuery<TPutCardPayload, { message: string }>

export type TDeleteCardApi = TQuery<{ card_number: string }, { message: string }>

export type TResponse<T> = Promise<{
  data: T;
  status: number;
}>;

export type TLoyalCustomer = {
  cust_surname: string;
  cust_name: string;
  card_number: string;
  percent: number;
};