import { apiPrivate } from '../../shared/api'
import { TResponse } from '../../shared/api/types'
import * as T from './types'

export class UsersService {
  static async getUsers(
    params?: T.TGetUsersParams,
  ): TResponse<T.TGetUsersApi['response']> {
    return apiPrivate.get('/users', { params })
  }

  static async getUserContact(
    idEmployee: number | string,
  ): TResponse<T.TUserContact> {
    return apiPrivate.get(`/users/${idEmployee}/contact`)
  }

  static async postUser(
    data: T.TPostUserApi['payload'],
  ): TResponse<T.TPostUserApi['response']> {
    return apiPrivate.post('/register', data)
  }

  static async putUser(
    data: T.TPutUserApi['payload'],
  ): TResponse<T.TPutUserApi['response']> {
    const { id, ...body } = data
    return apiPrivate.put(`/users/${id}`, body)
  }

  static async deleteUser(
    data: T.TDeleteUserApi['payload'],
  ): TResponse<T.TDeleteUserApi['response']> {
    return apiPrivate.delete(`/users/${data.id}`)
  }
}
