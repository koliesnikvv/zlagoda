import { apiPrivate } from '../../shared/api'
import { TCustomerCard, TResponse } from "./types";



export const AnalyticsService = {

  async getLoyalCustomers(manufacturer: string): TResponse<TCustomerCard[]> {
    return apiPrivate.get(`/customer-cards/loyal-analytics`, {
      params: { manufacturer }
    });
  }
};