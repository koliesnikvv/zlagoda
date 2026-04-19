import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'


import { LocalStorage } from '../../shared'
import { TokenService } from '../../services/token'
import { UserService } from '../../services'
import { TUser } from '../../types'


export type TUserStore = {
    user: TUser | null
    setUser: (user: TUser) => void
    onLogin: (email: string, password: string) => Promise<void>
    onLogout: () => Promise<void>
    clear: () => void
}

export const useUserStore = create<TUserStore>()(
    persist(
        set => ({
            user: null,
            setUser: user => set({ user }),
            onLogin: async (email, password) => {
                try {
                    const data = await TokenService.postLogin({ email, password })
                    TokenService.setToken(data.data.token)

                    const user = await UserService.getUserMe()

                    console.log('[useUserStore]: user:', user)

                    set({ user: user.data })

                } catch (error) {
                    console.error('[useUserStore]: error:', error)
                }
            },
            onLogout: async () => {
                try {
                    TokenService.clearTokens()
                    set({ user: null })
                } catch (error) {
                    console.error('[useUserStore]: logout error:', error)
                }
            },
            clear: () => set({ user: null }),
        }),
        {
            name: 'user-storage',
            partialize: state => ({
                user: state.user,
            }),
            storage: createJSONStorage(() => LocalStorage),
        },
    ),
)
