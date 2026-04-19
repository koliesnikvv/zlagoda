


import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import { LocalStorage } from '../../shared/lib'
import { TGetAccessApi } from './types'

const TOKEN_KEY = 'token'

export class TokenService {
  //Post login
  static async postLogin(
    data: TGetAccessApi['payload'],
  ): TResponse<TGetAccessApi['response']> {
    return apiPrivate.post(`/login`, data)
  }


  static async setToken(token: string) {
    LocalStorage.setItem(TOKEN_KEY, token)
  }

  static clearTokens() {
    LocalStorage.setItem(TOKEN_KEY, '')
  }

  static getToken(): string | null {
    return LocalStorage.getItem(TOKEN_KEY)
  }
}
