/**
 * Fetchy is a utility class for making HTTP requests with built-in error handling.
 * It provides methods for common HTTP methods: GET, POST, PUT, and DELETE.
 *
 * Features:
 * - Automatically sets 'Content-Type' to 'application/json'.
 * - Automatically parses JSON response.
 * - Supports optional cache control using the `shouldCache` option.
 * - Handles HTTP errors by throwing exceptions with error messages.
 * - Returns a Promise, allowing use of .then(), .catch(), and .finally().
 * - Supports TypeScript generics for type-safe responses and request bodies.
 *
 * Usage:
 * - `Fetchy.get<T>(url, options)`: Sends a GET request.
 * - `Fetchy.post<T, B>(url, body, options)`: Sends a POST request with a JSON body.
 * - `Fetchy.put<T, B>(url, body, options)`: Sends a PUT request with a JSON body.
 * - `Fetchy.delete<T>(url, options)`: Sends a DELETE request.
 *
 * Options:
 * - You can pass additional fetch options (headers, etc.) through the `options` parameter.
 * - Use `shouldCache: false` in `options` to disable caching.
 *
 * Example:
 * Fetchy.get<UserData>('https://api.example.com/user')
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error))
 *   .finally(() => console.log('Request completed'));
 *
 * Note:
 * - The type parameter T is optional. If not provided, the return type defaults to Promise<any>.
 * - You can use these methods without specifying types: Fetchy.get(url)
 */

interface FetchOptions extends RequestInit {
    shouldCache?: boolean;
    headers?: Record<string, string>;
}

interface ErrorResponse {
    message: string;
}

class Fetchy {
    private static async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
        const { shouldCache = true, ...fetchOptions } = options;

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...fetchOptions.headers,
            },
            ...(shouldCache ? {} : { cache: "no-cache" }),
            ...fetchOptions,
        });

        if (!response.ok) {
            const error = (await response.json()) as ErrorResponse;
            throw new Error(error.message || "An error occurred while fetching the data.");
        }

        return response.json() as Promise<T>;
    }

    static get<T>(url: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: "GET" });
    }

    static post<T, B = unknown>(url: string, body: B, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    static put<T, B = unknown>(url: string, body: B, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    static delete<T>(url: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: "DELETE" });
    }
}

export default Fetchy;
