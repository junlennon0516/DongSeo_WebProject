const API_BASE_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'dongseo_access_token';
const USERNAME_KEY = 'dongseo_username';

export interface LoginResponse {
  accessToken: string;
  username: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function setAuthStorage(token: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * API 요청 시 Authorization 헤더에 넣을 값.
 * 로그인 상태가 아니면 빈 객체.
 */
export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error ?? `로그인 실패 (${res.status})`;
    throw new Error(msg);
  }

  if (!data.accessToken || !data.username) {
    throw new Error('로그인 응답 형식 오류');
  }

  return { accessToken: data.accessToken, username: data.username };
}
