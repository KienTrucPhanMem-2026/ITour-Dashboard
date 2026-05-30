import { apiClient } from "@/lib/api-client";
import { Discount, ApiResponse } from "@/types";

export interface DiscountDistributionRequest {
  discountId: string;
  targetType: 'ALL' | 'TIER' | 'CUSTOM';
  tierId?: string;
  customerIds?: string[];
}

export interface DiscountDistributionResponse {
  message: string;
  jobAccepted: boolean;
  discountId: string;
  targetType: string;
}

export const discountService = {
  getDiscounts: async (): Promise<ApiResponse<Discount[]>> => {
    return apiClient.get<Discount[]>("/discounts");
  },

  getDiscountById: async (id: string): Promise<ApiResponse<Discount>> => {
    return apiClient.get<Discount>(`/discounts/${id}`);
  },

  createDiscount: async (discount: Omit<Discount, "id"> & { id?: string }): Promise<ApiResponse<Discount>> => {
    const payload = {
      ...discount,
      id: discount.id || "DISC-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    };
    return apiClient.post<Discount>("/discounts", payload);
  },

  updateDiscount: async (id: string, discount: Partial<Discount>): Promise<ApiResponse<Discount>> => {
    return apiClient.put<Discount>(`/discounts/${id}`, discount);
  },

  deleteDiscount: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/discounts/${id}`);
  },

  getActiveDiscounts: async (): Promise<ApiResponse<Discount[]>> => {
    return apiClient.get<Discount[]>("/discounts/active");
  },

  /**
   * Tặng voucher hàng loạt cho khách hàng (gọi API async 202 Accepted).
   * Backend xử lý ngầm — không block UI.
   */
  distributeVouchers: async (
    request: DiscountDistributionRequest
  ): Promise<ApiResponse<DiscountDistributionResponse>> => {
    return apiClient.post<DiscountDistributionResponse>("/discounts/distribute", request);
  },
};

