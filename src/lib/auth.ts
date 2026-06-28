import { jwtDecode } from "jwt-decode";
import type { User } from "@/types";

const ACCESS_TOKEN_KEY = "ebooks_access_token";
const REFRESH_TOKEN_KEY = "ebooks_refresh_token";

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
  exp: number;
  iat: number;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = jwtDecode<JwtPayload>(token);
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      emailVerified: true,
      createdAt: new Date(payload.iat * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const payload = jwtDecode<JwtPayload>(token);
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "ADMIN";
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("ebooks_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("ebooks_device_id", deviceId);
  }
  return deviceId;
}
