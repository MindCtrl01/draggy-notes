export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
  
export interface PaginatedResponse<T> {
data: T[];
pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
}

export class ApiError extends Error {
constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
) {
    super(message);
    this.name = 'ApiError';
}
}