/**
 * fetchy is a utility for making HTTP requests with built-in error handling and retry logic.
 * It provides methods for common HTTP methods: GET, POST, PUT, and DELETE.
 * It can be used as a function for GET requests or as an object with method properties.
 *
 * Features:
 * - Automatically sets 'Content-Type' to 'application/json'.
 * - Supports custom response types: json, text, blob, arrayBuffer.
 * - Handles HTTP errors by throwing exceptions with error messages.
 * - Returns a Promise, allowing use of .then(), .catch(), and .finally().
 * - Supports TypeScript generics for type-safe responses and request bodies.
 * - Implements request timeout with AbortController.
 * - Implements retry logic with a default retry count of 1.
 *
 * Usage:
 * - `fetchy<T>(url, options)`: Sends a GET request (shorthand).
 * - `fetchy.get<T>(url, options)`: Sends a GET request.
 * - `fetchy.post<T, B>(url, body, options)`: Sends a POST request with a body.
 * - `fetchy.put<T, B>(url, body, options)`: Sends a PUT request with a body.
 * - `fetchy.delete<T>(url, options)`: Sends a DELETE request.
 *
 * Options:
 * - You can pass additional fetch options (headers, etc.) through the `options` parameter.
 * - Use `timeout` in `options` to set a custom timeout (default is 5000ms).
 * - Use `responseType` in `options` to specify the response type (default is "json").
 * - Use `retries` in `options` to set the number of retry attempts (default is 1).
 *
 * Example:
 * fetchy<UserData>('https://api.example.com/user')
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 *
 * // Or using the method syntax
 * fetchy.post<ResponseData, RequestBody>('https://api.example.com/user', { name: 'John' }, { retries: 2 })
 *   .then(data => console.log(data))
 *   .catch(error => console.error(error));
 *
 * Note:
 * - The type parameter T is optional. If not provided, the return type defaults to Promise<any>.
 * - For POST and PUT requests, you can specify both response (T) and body (B) types.
 * - The `options` parameter extends the standard RequestInit interface with additional properties.
 */

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
    timeout?: number;
    responseType?: "json" | "text" | "blob" | "arrayBuffer";
    retries?: number;
    retryDelay?: number;
}

interface ErrorResponse {
    message: string;
}

class Fetchy {
    private async parseResponse<T>(response: Response, options: FetchOptions): Promise<T> {
        switch (options.responseType || "json") {
            case "json":
                return response.json() as Promise<T>;
            case "text":
                return response.text() as Promise<T>;
            case "blob":
                return response.blob() as Promise<T>;
            case "arrayBuffer":
                return response.arrayBuffer() as Promise<T>;
            default:
                throw new Error(`Unsupported response type: ${options.responseType}`);
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
        const { timeout = 5000, retries = 1, retryDelay = 1000, ...fetchOptions } = options;

        const executeRequest = async (attemptsLeft: number): Promise<T> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        ...fetchOptions.headers,
                    },
                    signal: controller.signal,
                    ...fetchOptions,
                });

                if (!response.ok) {
                    let errorMessage = "An error occurred while fetching the data.";

                    if (options.responseType === "json") {
                        const error = (await response.json()) as ErrorResponse;
                        errorMessage = error.message || errorMessage;
                    }

                    throw new Error(errorMessage, {
                        cause: { response },
                    });
                }

                return this.parseResponse<T>(response, options);
            } catch (error) {
                if (attemptsLeft > 0) {
                    console.warn(`Request failed. Retrying... (${attemptsLeft} attempts left)`);
                    await this.delay(retryDelay);
                    return executeRequest(attemptsLeft - 1);
                }
                console.error("Failed to fetch data:", error);
                throw new Error("Failed to fetch data.", { cause: error });
            } finally {
                clearTimeout(timeoutId);
            }
        };

        return executeRequest(retries);
    }

    get<T>(url: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: "GET" });
    }

    post<T, B>(url: string, body: B, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    put<T, B>(url: string, body: B, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    delete<T>(url: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: "DELETE" });
    }
}

const fetchy = new Fetchy();

export default Object.assign((url: string, options?: FetchOptions) => fetchy.get(url, options), {
    get: <T>(url: string, options?: FetchOptions) => fetchy.get<T>(url, options),
    post: <T, B>(url: string, body: B, options?: FetchOptions) =>
        fetchy.post<T, B>(url, body, options),
    put: <T, B>(url: string, body: B, options?: FetchOptions) =>
        fetchy.put<T, B>(url, body, options),
    delete: <T>(url: string, options?: FetchOptions) => fetchy.delete<T>(url, options),
});
