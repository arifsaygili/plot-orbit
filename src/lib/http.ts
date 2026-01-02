/**
 * HTTP utility wrapper for API calls
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}

/**
 * Make a POST request to the API
 */
export async function post<T = unknown>(
  url: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error || "Bir hata oluştu",
        errorCode: data.code,
        details: data.details,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data as T,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Bağlantı hatası. Lütfen tekrar deneyin.",
    };
  }
}

/**
 * Make a GET request to the API
 */
export async function get<T = unknown>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error || "Bir hata oluştu",
        errorCode: data.code,
        details: data.details,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data as T,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Bağlantı hatası. Lütfen tekrar deneyin.",
    };
  }
}
