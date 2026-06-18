/**
 * Unified API response types.
 */
export interface ApiResponseData<T> {
  code: number;
  data: T | null;
  message: string;
}

/**
 * Create a success response.
 */
export function success<T>(
  data: T,
  message: string = "ok"
): ApiResponseData<T> {
  return { code: 0, data, message };
}

/**
 * Create a failure response.
 */
export function fail(code: number, message: string): ApiResponseData<null> {
  return { code, data: null, message };
}
