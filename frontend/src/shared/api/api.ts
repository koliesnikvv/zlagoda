
import axios, { InternalAxiosRequestConfig } from 'axios'
import { TokenService } from '../../services/token'






const privateInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})


const langConfig = (config: InternalAxiosRequestConfig<unknown>) => {
  return config
}

privateInstance.interceptors.request.use(
  async config => {
    const token = TokenService.getToken()

    if (token && config.headers) {
      config.headers.Authorization = 'Bearer ' + token
    }

    return langConfig(config)
  },
  error => {
    return Promise.reject(error)
  },
)

privateInstance.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    if (
      axios.isAxiosError(error) &&
      error?.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true

      console.log('[TOKEN-REFRESH]: 401')

      // const refreshToken = TokenService.getRefreshToken()

      // console.log('[TOKEN-REFRESH]:', refreshToken)

      // if (refreshToken) {
      //   try {
      //     const newToken = await TokenService.postRefresh({
      //       refresh_token: refreshToken,
      //     })

      //     console.log('[TOKEN-REFRESH]: response', newToken)

      //     TokenService.setToken(newToken.data)

      //     return privateInstance(originalRequest)
      //   } catch {
      //     TokenService.clearTokens()
      //     useUserStore.getState().clear()
      //   }
      // } else {
      //   TokenService.clearTokens()
      //   useUserStore.getState().clear()
      // }
    }

    return Promise.reject(error)
  },
)

export const apiPrivate = privateInstance
