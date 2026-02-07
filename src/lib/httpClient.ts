import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {SignerConfig} from "./models.ts";
import {generateSalt, signRequest} from "./crypto.ts";

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export interface RequestOptions<T = any> extends AxiosRequestConfig<T> {
    base?: 'auth' | 'api' | 'apiV1';    // NEW: which base to use
    withAuth?: boolean;                  // default true
    retry?: number;                      // default 2
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
    requestId?: string;
}

export class ApiError<T = any> extends Error {
    public status?: number;
    public code?: string;
    public details?: T;
    public requestId?: string;
    constructor(message: string, opts: { status?: number; code?: string; details?: T; requestId?: string } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = opts.status;
        this.code = opts.code;
        this.details = opts.details;
        this.requestId = opts.requestId;
    }
}

export async function buildSignedHeaders(
    publicId: string,
    username: string, // e.g. '/v1/users/permissions'
    role: string,     // e.g. 'USER'
    cfg: SignerConfig
) {
    const salt = generateSalt(cfg.saltBytes ?? 16, cfg.saltFormat ?? 'base64') as string;
    const timestampMilliseconds = Date.now().toString();
    const signature = await signRequest({ publicId, username, role, salt }, cfg.secret, 'base64');

    return {
        'salt': salt,
        'X-Timestamp': timestampMilliseconds,
        'hash': signature,
    } as Record<string, string>;
}

// @ts-ignore
const PREFIX = import.meta.env.VITE_SECURE_LOCAL_STORAGE_PREFIX;

// ===== Token management =====
const TOKEN_STORAGE_KEY = 'auth_token';
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
    inMemoryToken = token;
    try {
        if (token) localStorage.setItem(`${PREFIX}${TOKEN_STORAGE_KEY}`, token);
        else localStorage.removeItem(`${PREFIX}${TOKEN_STORAGE_KEY}`);
    } catch (_) {}
}

export function getAuthToken(): string | null {
    if (inMemoryToken) return inMemoryToken;
    try {
        inMemoryToken = localStorage.getItem(`${PREFIX}${TOKEN_STORAGE_KEY}`);
    } catch (_) {}
    return inMemoryToken;
}

export function clearAuthToken() { setAuthToken(null); }

export function setAppInfo(key: string, data: string | null) {
    try {
        if (data) localStorage.setItem(`${PREFIX}${key}`, data);
        else localStorage.removeItem(`${PREFIX}${key}`);
    } catch (_) {}
}

// @ts-ignore
export function getAppInfo(key: string): string | null {
    try {
        return localStorage.getItem(`${PREFIX}${key}`);
    } catch (_) {}
}

export function clearAppInfo(key: string) { setAppInfo(key, null); }
export function clearAllAppInfo() { localStorage.clear(); }

// ===== Base URL config =====
// @ts-ignore
const AUTH_BASE_URL  = import.meta.env.VITE_AUTH_BASE_URL  || import.meta.env.VITE_API_BASE_URL || 'https://example.com';
// @ts-ignore
const API_BASE_URL   = import.meta.env.VITE_API_BASE_URL   || 'https://example.com';
// @ts-ignore
const USER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || API_BASE_URL; // default reuse API

const BASE_MAP = {
    auth: AUTH_BASE_URL,
    api: API_BASE_URL,
    apiV1: USER_API_BASE_URL,
} as const;

type BaseKey = keyof typeof BASE_MAP;

// ===== Axios instance factory with caching =====
const instanceCache = new Map<string, AxiosInstance>();

function createAxios(baseURL: string): AxiosInstance {
    const inst = axios.create({
        baseURL,
        timeout: 15_000,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        withCredentials: false,
    });

    // Request interceptor
    inst.interceptors.request.use((config: InternalAxiosRequestConfig & { withAuth?: boolean; retry?: number }) => {
        const cfg = { ...config };
        console.log(cfg);
        const withAuth = cfg.withAuth !== undefined ? cfg.withAuth : true;
        if (withAuth) {
            const token = getAuthToken();
            if (token && !cfg.headers?.Authorization) {
                cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` } as any;
            }
        }
        const requestId = cryptoRandomId();
        (cfg.headers as any) = { ...(cfg.headers || {}), 'X-Request-Id': requestId };
        (cfg as any).requestId = requestId;
        // @ts-ignore
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            // @ts-ignore
            console.debug('[HTTP] →', cfg.method?.toUpperCase(), cfg.baseURL + cfg.url, cfg.params || '', cfg.data || '');
        }
        return cfg;
    });

    // Response interceptor
    inst.interceptors.response.use(
        (response: AxiosResponse) => {
            // @ts-ignore
            // if (import.meta.env.DEV) {
            //     // eslint-disable-next-line no-console
            //     console.debug('[HTTP] ←', response.status, response.config?.url);
            // }

            const shouldLogHttpErrors = (
                // @ts-ignore
                (import.meta.env.DEV) && (import.meta.env.VITE_LOG_HTTP_ERRORS !== 'off')
                // @ts-ignore
            ) || (import.meta.env.VITE_LOG_HTTP_ERRORS === 'on');

            if (shouldLogHttpErrors) {
                console.error('[HTTP] ×', response.status, response.config?.url, response.data);
            }
            return response;
        },
        async (error: AxiosError) => {
            const cfg = error.config as (AxiosRequestConfig & { retryCount?: number; requestId?: string; retry?: number }) | undefined;
            const method = (cfg?.method || 'get').toLowerCase() as HttpMethod;
            const isIdempotent = method === 'get' || method === 'head' || method === 'options';
            const networkError = !error.response;

            if (cfg && isIdempotent && (networkError || error.code === 'ECONNABORTED')) {
                const maxRetries = typeof cfg.retry === 'number' ? cfg.retry : 2;
                cfg.retryCount = (cfg.retryCount || 0) + 1;
                if (cfg.retryCount <= maxRetries) {
                    const backoffMs = Math.min(1000 * 2 ** (cfg.retryCount - 1), 4000);
                    await delay(backoffMs);
                    return inst(cfg);
                }
            }

            const status = error.response?.status;
            const requestId = (error.response?.headers?.['x-request-id'] as string) || (cfg as any)?.requestId;
            const data: any = error.response?.data;

            if (status === 401) {
                clearAuthToken();
                if (typeof window !== 'undefined') {
                    const detail = {
                        at: Date.now(),
                        status,
                        requestId,
                        url: cfg?.url,
                        method: (cfg?.method || 'get').toUpperCase(),
                        reason: (data?.error || data?.message || 'unauthorized') as string,
                    };
                    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail }));
                }
            }

            const message = deriveErrorMessage(error, data) || 'Unknown error occurred';
            const apiError = new ApiError(message, { status, code: error.code, details: data, requestId });
            // @ts-ignore
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.error('[HTTP] ×', status, error.config?.url, apiError);
            }
            return Promise.reject(apiError);
        }
    );

    return inst;
}

function getInstanceFor(base: BaseKey): AxiosInstance {
    const url = BASE_MAP[base];
    console.log("base ", base, " url ", url);
    const existing = instanceCache.get(url);
    console.log("existing ", existing);
    if (existing) return existing;
    const inst = createAxios(url);
    instanceCache.set(url, inst);
    return inst;
}

// ===== Public request wrapper that routes by base =====
export async function request<T = unknown, B = unknown>(method: HttpMethod, url: string, options: RequestOptions<B> = {}): Promise<ApiResponse<T>> {
    const { base = 'api', withAuth = true, retry = 2, ...config } = options;
    const client = getInstanceFor(base);
    console.log("base ", base, " url ", url, " Method: ", method, " client: ", client);
    const response = await client.request<T, AxiosResponse<T>, B>({ method, url, ...config, withAuth, retry } as any);
    return {
        data: response.data,
        status: response.status,
        headers: (response.headers || {}) as Record<string, string>,
        requestId: (response.headers?.['x-request-id'] as string) || (response.config as any)?.requestId,
    };
}

export const httpGet = <T = unknown>(url: string, options?: RequestOptions) => request<T>('get', url, options);
export const httpDelete = <T = unknown>(url: string, options?: RequestOptions) => request<T>('delete', url, options);
export const httpPost = <T = unknown, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) => request<T, B>('post', url, { ...options, data: body });
export const httpPut =  <T = unknown, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) => request<T, B>('put',  url, { ...options, data: body });
export const httpPatch =<T = unknown, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) => request<T, B>('patch',url, { ...options, data: body });

// ===== Utils =====
function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

function cryptoRandomId(): string {
    try {
        const a = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {
        return Math.random().toString(36).slice(2);
    }
}

function deriveErrorMessage(error: AxiosError, data: any): string {
    try {
        if (data && typeof data === 'object') {
            if (typeof data.message === 'string') return data.message;
            if (typeof data.error === 'string') return data.error;
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                return data.errors.map((e: any) => e.message || String(e)).join(', ');
            }
        }
        if (error.response) return `HTTP Error ${error.response.status}: ${error.response.statusText || 'Unknown Error'}`;
        if (error.code === 'ECONNABORTED') return 'Request timed out';
        if (!error.response) return 'Network error - please check your connection';
        return error.message || 'Unknown error occurred';
    } catch (e) {
        console.error('Error parsing error message:', e);
        return 'An unexpected error occurred';
    }
}

export default { getInstanceFor };