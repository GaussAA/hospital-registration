export interface ApiResponse<T> {
  code: number;
  data: T | null;
  message: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Generic paginated API response wrapper */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
