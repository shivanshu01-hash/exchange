import type { ApiResponse } from "@exchange/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export interface ApiRequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  requireAuth?: boolean;
}

class ApiClient {
  private defaultOptions: ApiRequestOptions = {
    retries: 2,
    retryDelay: 1000,
    timeout: 10000,
    requireAuth: true,
  };

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async request<T = any>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const {
      retries = 2,
      retryDelay = 1000,
      timeout = 10000,
      requireAuth = true,
      ...fetchOptions
    } = mergedOptions;

    const token = requireAuth ? await this.getAuthToken() : null;
    const headers = new Headers(fetchOptions.headers);
    
    if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    
    if (token && requireAuth) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: ApiError | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${API_URL}${path}`, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data: any;
        
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = { message: responseText };
        }

        if (!response.ok) {
          const error: ApiError = new Error(
            data.error || data.message || `Request failed with status ${response.status}`
          );
          error.status = response.status;
          error.code = data.code;
          error.details = data.details;
          
          // Handle specific status codes
          if (response.status === 401) {
            // Token expired or invalid
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }
          }
          
          throw error;
        }

        // Handle ApiResponse wrapper
        if (data && typeof data === "object" && "success" in data) {
          const apiResponse = data as ApiResponse<T>;
          if (!apiResponse.success) {
            const error: ApiError = new Error(apiResponse.error || "API request failed");
            error.code = "API_ERROR";
            throw error;
          }
          return apiResponse.data as T;
        }

        return data as T;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        if (error.status === 401 || error.status === 403) {
          throw error; // Don't retry auth errors
        }
        
        if (error.status === 400) {
          throw error; // Don't retry bad requests
        }
        
        if (attempt < retries) {
          // Exponential backoff with jitter
          const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new Error("Request failed after all retries");
  }

  async get<T = any>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  // Specialized methods for trading operations
  async placeOrder(orderData: any) {
    return this.post("/api/orders", orderData);
  }

  async cancelOrder(orderId: string) {
    return this.delete(`/api/orders/${orderId}`);
  }

  async getMarket(marketId: string) {
    return this.get(`/api/markets/${marketId}`);
  }

  async getWallet() {
    return this.get("/api/wallet");
  }

  async getOpenOrders() {
    return this.get("/api/orders/open");
  }

  async getMatchedOrders() {
    return this.get("/api/orders/matched");
  }
}

export const apiClient = new ApiClient();

// Backward compatibility
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const client = new ApiClient();
  return client.request<T>(path, init);
}

// Error boundary utilities
export function isApiError(error: any): error is ApiError {
  return error && typeof error === "object" && "status" in error;
}

export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.message || `Error ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}

export function getErrorCode(error: any): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  return undefined;
}