import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { StoreProduct } from '../types'
import { LocalStorage } from '../shared'
import { ProductsService, CatalogService, CatalogProduct, Category } from '../services'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'

type SortParams = { sort?: string; order?: 'ASC' | 'DESC' }
type CatalogParams = SortParams & { category_number?: number }
type StoreParams = SortParams & { promo?: boolean; category_number?: number }

export type TProductsStore = {
    storeProducts: StoreProduct[]
    catalogProducts: CatalogProduct[]
    categories: Category[]
    loadStore: (params?: StoreParams) => Promise<void>
    loadCatalog: (params?: CatalogParams) => Promise<void>
    loadCategories: (params?: SortParams) => Promise<void>
    deleteProduct: (upc: string) => Promise<void>
    clear: () => void
}

export const useProductStore = create<TProductsStore>()(
    persist(
        set => ({
            storeProducts: [],
            catalogProducts: [],
            categories: [],
            loadStore: async (params?: StoreParams) => {
                try {
                    const data = await ProductsService.getProducts(params)
                    set({ storeProducts: data.data })
                } catch (error) {
                    toast.error("Помилка завантаження товарів на складі");
                    console.error('[useProductStore]: loadStore error:', error)
                }
            },
            loadCatalog: async (params?: CatalogParams) => {
                try {
                    const data = await CatalogService.getProducts(params)
                    set({ catalogProducts: data.data })
                } catch (error) {
                    toast.error("Помилка завантаження каталогу товарів");
                    console.error('[useProductStore]: loadCatalog error:', error)
                }
            },
            loadCategories: async (params?: SortParams) => {
                try {
                    const data = await CatalogService.getCategories(params)
                    set({ categories: data.data })
                } catch (error) {
                    toast.error("Помилка завантаження категорій");
                    console.error('[useProductStore]: loadCategories error:', error)
                }
            },
            deleteProduct: async (upc: string) => {
                try {
                    await ProductsService.deleteProducts({ upc })
                    set(state => ({
                        storeProducts: state.storeProducts.filter(p => p.upc !== upc)
                    }))
                    toast.success("Товар вилучено зі складу");
                } catch (error) {
                    if (isAxiosError(error) && error.response) {
                        const errData = error.response.data
                        toast.error(errData.detail || "Помилка видалення");
                    }
                    console.error('[useProductStore]: deleteProduct error:', error)
                }
            },
            clear: () => set({ storeProducts: [], catalogProducts: [], categories: [] }),
        }),
        {
            name: 'product-storage',
            partialize: state => ({
                storeProducts: state.storeProducts,
                catalogProducts: state.catalogProducts,
                categories: state.categories,
            }),
            storage: createJSONStorage(() => LocalStorage),
        },
    ),
)
