import { TQuery } from '../../shared/api/types'
import { TUser, UserFormData, EditingUser } from '../../types'

export type TGetUsersParams = {
  role?: string
  surname?: string
  sort?: string
  order?: 'ASC' | 'DESC'
}

export type TGetUsersApi = TQuery<TGetUsersParams, TUser[]>

export type TPostUserApi = TQuery<UserFormData & { date_of_start: string }, void>

export type TPutUserApi = TQuery<Omit<EditingUser, 'id_employee'> & { id: number }, void>

export type TDeleteUserApi = TQuery<{ id: number }, void>

export type TUserContact = {
  phone_number: string
  city: string
  street: string
  zip_code: string
}
