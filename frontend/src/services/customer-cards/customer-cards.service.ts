import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import * as T from './types'

export class CustomerCardsService {
  static async getCards(
    params?: T.TGetCardsParams,
  ): TResponse<T.TGetCardsApi['response']> {
    return apiPrivate.get('/customer-cards', { params })
  }

  static async getCard(cardNumber: string): TResponse<T.TCustomerCard> {
    return apiPrivate.get(`/customer-cards/${cardNumber}`)
  }

  static async postCard(
    data: T.TPostCardApi['payload'],
  ): TResponse<T.TPostCardApi['response']> {
    return apiPrivate.post('/customer-cards', data)
  }

  static async putCard(
    data: T.TPutCardApi['payload'],
  ): TResponse<T.TPutCardApi['response']> {
    const { card_number, ...body } = data
    return apiPrivate.put(`/customer-cards/${card_number}`, body)
  }

  static async deleteCard(
    data: T.TDeleteCardApi['payload'],
  ): TResponse<T.TDeleteCardApi['response']> {
    return apiPrivate.delete(`/customer-cards/${data.card_number}`)
  }

static async getLoyalCustomers(manufacturer: string): TResponse<T.TCustomerCard[]> {
  return apiPrivate.get(`/customer-cards/loyal-analytics`, {
    params: { manufacturer }
  });
}
}
