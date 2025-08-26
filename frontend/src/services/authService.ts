// PATH: frontend/src/services/authService.ts
import axios from "axios";
import { ENV } from "../env";

export type User = { id: string; email: string; profile?: { firstName?: string }; plan?: "free"|"premium" };
type LoginPayload = { email: string; password: string };
type TokenPair = { accessToken: string; refreshToken: string };

const ACCESS_KEY = "ecolojia_token";
const REFRESH_KEY = "ecolojia_refresh";
const USER_KEY = "ecolojia_user";

const authApi = axios.create({ baseURL: ENV.API_BASE, withCredentials: true });

const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const { data } = await authApi.post<{ user: User; tokens: TokenPair }>("/auth/login", payload);
    localStorage.setItem(ACCESS_KEY, data.tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },
  async register(payload: LoginPayload): Promise<User> {
    const { data } = await authApi.post<{ user: User; tokens: TokenPair }>("/auth/register", payload);
    localStorage.setItem(ACCESS_KEY, data.tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },
  async refresh(): Promise<string> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
    const { data } = await authApi.post<{ accessToken: string }>("/auth/refresh", { refreshToken });
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    return data.accessToken;
  },
  logout(){ localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); localStorage.removeItem(USER_KEY); },
  getAccessToken(){ return localStorage.getItem(ACCESS_KEY); },
  getUser(){ const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) as User : null; },
  isAuthenticated(){ return !!localStorage.getItem(ACCESS_KEY); },
  isPremium(){ return (authService.getUser()?.plan === "premium"); }
};

export default authService;
