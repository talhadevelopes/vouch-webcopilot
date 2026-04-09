import { createApiClient, createBrowserAuthStorage } from "@vouch/sdk";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const authStorage = createBrowserAuthStorage("vouch");
const client = createApiClient(API_URL, authStorage);

export const apiFetch = client.apiFetch;
export const setAuthTokens = authStorage.setTokens;
export const clearAuthTokens = authStorage.clearTokens;
