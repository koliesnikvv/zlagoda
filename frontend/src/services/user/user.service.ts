


import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import { TGetUserMeApi } from './types'


export class UserService {
  //Get user me
  static async getUserMe(
  ): TResponse<TGetUserMeApi['response']> {
    return apiPrivate.get(`/me`)
  }

}
