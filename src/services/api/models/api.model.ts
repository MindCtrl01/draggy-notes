export interface ApiResponse<T = any> {
    success: boolean;
    message: string | null;
    data?: T;
    errors?: string[] | null;
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