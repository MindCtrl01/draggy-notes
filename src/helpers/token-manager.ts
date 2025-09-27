import { AuthUser } from "@/services/api";

export class TokenManager {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private static readonly LOGIN_HISTORY_KEY = 'draggy_login_history';
  
    static getToken(): string | null {
      return localStorage.getItem(this.TOKEN_KEY);
    }
  
    static setToken(token: string): void {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  
    static getRefreshToken(): string | null {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
  
    static setRefreshToken(token: string): void {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  
    static clearTokens(): void {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    static markUserHasLoggedIn(): void {
      localStorage.setItem(this.LOGIN_HISTORY_KEY, 'true');
    }

    static hasUserEverLoggedIn(): boolean {
      return localStorage.getItem(this.LOGIN_HISTORY_KEY) === 'true';
    }
  
    // Get current user from token (without API call)
  static getCurrentUserFromToken(): AuthUser | null {
    const token = TokenManager.getToken();
    
    if (!token || TokenManager.isTokenExpired(token)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.userId,
        username: payload.username || payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        isActive: payload.isActive !== false,
        isDelete: payload.isDelete || false,
        roles: payload.roles || [],
      };
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
    // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }
}