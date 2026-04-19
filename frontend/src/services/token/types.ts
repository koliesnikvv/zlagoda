import { TQuery } from "../../shared/api/types"


export type TGetAccessApi = TQuery<TGetUserMePayload, TGetUserMeResponse>
type TGetUserMePayload = {
  email: string
  password: string
}
type TGetUserMeResponse = {
  token: string
}

export type TGetRefreshApi = TQuery<TGetRefreshPayload, TGetRefreshResponse>
type TGetRefreshPayload = {
  refresh_token: string
}
type TGetRefreshResponse = {
  access_token: string
  refresh_token: string
}
