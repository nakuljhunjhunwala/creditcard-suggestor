import axios, { type AxiosInstance, AxiosError } from 'axios';
import type {
    ApiResponse,
    Session,
    JobStatus,
    Transaction,
    PaginatedResponse,
    CreditCardRecommendation,
    RecommendationResponse,
    SpendingAnalysis,
    UploadResponse,
    ApiError,
} from '../types';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                const apiError: ApiError = {
                    message: error.message,
                    status: error.response?.status || 500,
                    code: (error.response?.data as any)?.code,
                };

                if (error.response?.data && typeof error.response.data === 'object') {
                    apiError.message = (error.response.data as any).message || error.message;
                }

                return Promise.reject(apiError);
            }
        );
    }

    // Session Management
    async createSession(): Promise<Session> {
        const response = await this.client.post<ApiResponse<Session>>('/sessions');
        return response.data.data!;
    }

    async getSessionStatus(sessionToken: string): Promise<Session> {
        const response = await this.client.get<ApiResponse<Session>>(`/sessions/${sessionToken}/status`);
        return response.data.data!;
    }

    async getJobStatus(sessionToken: string): Promise<JobStatus> {
        const response = await this.client.get<ApiResponse<JobStatus>>(`/sessions/${sessionToken}/job-status`);
        return response.data.data!;
    }

    async extendSession(sessionToken: string, hours: number = 24): Promise<void> {
        await this.client.post(`/sessions/${sessionToken}/extend`, { hours });
    }

    async deleteSession(sessionToken: string): Promise<void> {
        await this.client.delete(`/sessions/${sessionToken}`);
    }

    // File Upload
    async uploadPDF(sessionToken: string, file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await this.client.post<ApiResponse<UploadResponse>>(
            `/sessions/${sessionToken}/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress,
            }
        );

        return response.data.data!;
    }

    // Transactions
    async getTransactions(
        sessionToken: string,
        page: number = 1,
        limit: number = 50
    ): Promise<PaginatedResponse<Transaction>> {
        const response = await this.client.get<any>(
            `/sessions/${sessionToken}/transactions`,
            { params: { page, limit } }
        );

        // Map the API response to expected format
        return {
            items: response.data.data.transactions || [],
            pagination: response.data.data.pagination || {
                page: 1,
                limit: 50,
                totalCount: 0,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
            }
        };
    }

    // Enhanced Recommendations
    async getRecommendations(
        sessionToken: string,
        options?: {
            creditScore?: string;
            maxAnnualFee?: number;
            preferredNetwork?: string;
            includeBusinessCards?: boolean;
        }
    ): Promise<RecommendationResponse> {
        const params = new URLSearchParams();
        if (options?.creditScore) params.append('creditScore', options.creditScore);
        if (options?.maxAnnualFee) params.append('maxAnnualFee', options.maxAnnualFee.toString());
        if (options?.preferredNetwork) params.append('preferredNetwork', options.preferredNetwork);
        if (options?.includeBusinessCards) params.append('includeBusinessCards', options.includeBusinessCards.toString());

        const response = await this.client.get<ApiResponse<RecommendationResponse>>(
            `/sessions/${sessionToken}/recommendations${params.toString() ? '?' + params.toString() : ''}`
        );
        return response.data.data!;
    }

    // Legacy method for backward compatibility
    async getRecommendationsList(sessionToken: string): Promise<CreditCardRecommendation[]> {
        const response = await this.getRecommendations(sessionToken);
        return response.recommendations || [];
    }

    // Analysis
    async getSpendingAnalysis(sessionToken: string): Promise<SpendingAnalysis> {
        const response = await this.client.get<any>(
            `/sessions/${sessionToken}/analysis`
        );
        return response.data.data || {};
    }

    // Health Check
    async healthCheck(): Promise<{ status: string }> {
        const response = await this.client.get<ApiResponse<{ status: string }>>('/health');
        return response.data.data!;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
