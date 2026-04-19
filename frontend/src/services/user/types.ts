import { TQuery } from "../../shared/api/types"
import { TUser } from "../../types"


export type TGetUserMeApi = TQuery<TGetUserMePayload, TGetUserMeResponse>
type TGetUserMePayload = {
}
type TGetUserMeResponse = TUser
