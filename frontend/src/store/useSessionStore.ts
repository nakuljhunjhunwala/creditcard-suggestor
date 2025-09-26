import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '../services/api';
import type {
    Session,
    JobStatus,
    Transaction,
    CreditCardRecommendation,
    SpendingAnalysis,
    ApiError,
    PaginatedResponse,
} from '../types';

interface SessionState {
    // Current session data
    session: Session | null;
    jobStatus: JobStatus | null;
    transactions: Transaction[];
    recommendations: CreditCardRecommendation[];
    analysis: SpendingAnalysis | null;

    // UI state
    isLoading: boolean;
    error: ApiError | null;
    uploadProgress: number;
    isPolling: boolean;
    pollingTimeoutId: number | null;

    // Pagination
    currentPage: number;
    totalPages: number;
    hasMoreTransactions: boolean;

    // Actions
    createSession: () => Promise<void>;
    uploadFile: (file: File) => Promise<void>;
    fetchSessionStatus: (sessionToken: string) => Promise<void>;
    fetchJobStatus: (sessionToken: string) => Promise<void>;
    pollJobStatus: () => Promise<void>;
    stopPolling: () => void;
    fetchTransactions: (page?: number) => Promise<void>;
    fetchRecommendations: () => Promise<void>;
    fetchAnalysis: () => Promise<void>;
    setError: (error: ApiError | null) => void;
    clearError: () => void;
    reset: () => void;
}

export const useSessionStore = create<SessionState>()(
    devtools(
        (set, get) => ({
            // Initial state
            session: null,
            jobStatus: null,
            transactions: [],
            recommendations: [],
            analysis: null,
            isLoading: false,
            error: null,
            uploadProgress: 0,
            isPolling: false,
            pollingTimeoutId: null,
            currentPage: 1,
            totalPages: 1,
            hasMoreTransactions: false,

            // Create a new session
            createSession: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const session = await apiClient.createSession();
                    set({ session, isLoading: false });
                } catch (error) {
                    set({ error: error as ApiError, isLoading: false });
                }
            },

            // Upload PDF file
            uploadFile: async (file: File) => {
                const { session } = get();
                if (!session) {
                    set({ error: { message: 'No active session', status: 400 } });
                    return;
                }

                try {
                    set({ isLoading: true, error: null, uploadProgress: 0 });

                    await apiClient.uploadPDF(
                        session.sessionToken,
                        file,
                        (progressEvent) => {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            set({ uploadProgress: progress });
                        }
                    );

                    // Update session with new status
                    const updatedSession = await apiClient.getSessionStatus(session.sessionToken);
                    set({
                        session: updatedSession,
                        isLoading: false,
                        uploadProgress: 100
                    });

                    // Start polling for job status
                    get().pollJobStatus();
                } catch (error) {
                    set({ error: error as ApiError, isLoading: false, uploadProgress: 0 });
                }
            },

            // Fetch session status
            fetchSessionStatus: async (sessionToken: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const session = await apiClient.getSessionStatus(sessionToken);
                    set({ session, isLoading: false });
                } catch (error) {
                    set({ error: error as ApiError, isLoading: false });
                }
            },

            // Fetch job status
            fetchJobStatus: async (sessionToken: string) => {
                try {
                    const jobStatus = await apiClient.getJobStatus(sessionToken);
                    set({ jobStatus });
                } catch (error) {
                    set({ error: error as ApiError });
                }
            },

            // Poll job status for real-time updates
            pollJobStatus: async () => {
                const { session, isPolling, pollingTimeoutId } = get();
                if (!session || isPolling) return;

                try {
                    set({ isPolling: true });

                    const [sessionStatus, jobStatus] = await Promise.all([
                        apiClient.getSessionStatus(session.sessionToken),
                        apiClient.getJobStatus(session.sessionToken),
                    ]);

                    set({ session: sessionStatus, jobStatus, isPolling: false });

                    // Check if we should continue polling based on job status
                    const activeJob = jobStatus.activeJob;
                    const shouldContinuePolling = activeJob &&
                        ['queued', 'processing'].includes(activeJob.status) &&
                        !['completed', 'failed'].includes(activeJob.status);

                    console.log('Polling check:', {
                        activeJob: activeJob?.status,
                        shouldContinuePolling,
                        timestamp: new Date().toISOString()
                    });

                    if (shouldContinuePolling) {
                        const timeoutId = setTimeout(() => {
                            const currentState = get();
                            if (!currentState.isPolling && currentState.pollingTimeoutId) {
                                currentState.pollJobStatus();
                            }
                        }, 5000); // Poll every 5 seconds

                        set({ pollingTimeoutId: timeoutId });
                    } else {
                        // Clear any existing timeout and stop polling
                        if (pollingTimeoutId) {
                            clearTimeout(pollingTimeoutId);
                            set({ pollingTimeoutId: null });
                        }
                        console.log('Polling stopped - job status:', activeJob?.status);
                    }

                    // If completed, fetch results
                    if (activeJob?.status === 'completed') {
                        await Promise.all([
                            get().fetchTransactions(),
                            get().fetchRecommendations(),
                            get().fetchAnalysis(),
                        ]);
                    }
                } catch (error) {
                    set({ error: error as ApiError, isPolling: false });
                    // Clear timeout on error
                    const { pollingTimeoutId } = get();
                    if (pollingTimeoutId) {
                        clearTimeout(pollingTimeoutId);
                        set({ pollingTimeoutId: null });
                    }
                    console.log('Polling stopped due to error:', error);
                }
            },

            // Stop polling manually
            stopPolling: () => {
                const { pollingTimeoutId } = get();
                if (pollingTimeoutId) {
                    clearTimeout(pollingTimeoutId);
                    set({ pollingTimeoutId: null, isPolling: false });
                    console.log('Polling manually stopped');
                }
            },

            // Fetch transactions with pagination
            fetchTransactions: async (page: number = 1) => {
                const { session } = get();
                if (!session) return;

                try {
                    set({ isLoading: page === 1, error: null });

                    const response: PaginatedResponse<Transaction> = await apiClient.getTransactions(
                        session.sessionToken,
                        page,
                        50
                    );

                    set({
                        transactions: page === 1
                            ? response.items
                            : [...get().transactions, ...response.items],
                        currentPage: response.pagination.page,
                        totalPages: response.pagination.totalPages,
                        hasMoreTransactions: response.pagination.hasNext,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ error: error as ApiError, isLoading: false });
                }
            },

            // Fetch credit card recommendations
            fetchRecommendations: async () => {
                const { session } = get();
                if (!session) return;

                try {
                    const response = await apiClient.getRecommendations(session.sessionToken);
                    set({ recommendations: response.recommendations });
                } catch (error) {
                    set({ error: error as ApiError });
                }
            },

            // Fetch spending analysis
            fetchAnalysis: async () => {
                const { session } = get();
                if (!session) return;

                try {
                    const analysis = await apiClient.getSpendingAnalysis(session.sessionToken);
                    set({ analysis });
                } catch (error) {
                    set({ error: error as ApiError });
                }
            },

            // Set error
            setError: (error: ApiError | null) => {
                set({ error });
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            },

            // Reset store to initial state
            reset: () => {
                // Clear any active polling timeout
                const { pollingTimeoutId } = get();
                if (pollingTimeoutId) {
                    clearTimeout(pollingTimeoutId);
                }

                set({
                    session: null,
                    jobStatus: null,
                    transactions: [],
                    recommendations: [],
                    analysis: null,
                    isLoading: false,
                    error: null,
                    uploadProgress: 0,
                    isPolling: false,
                    pollingTimeoutId: null,
                    currentPage: 1,
                    totalPages: 1,
                    hasMoreTransactions: false,
                });
            },
        }),
        {
            name: 'session-store',
        }
    )
);
