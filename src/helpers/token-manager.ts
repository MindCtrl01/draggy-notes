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
        id: payload.id || payload.user_id || 0,
        uuid: payload.sub || payload.uuid,
        username: payload.username || payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        displayName: payload.displayName,
        photoUrl: payload.photoUrl,
        emailVerified: payload.emailVerified,
        lastSignInAt: payload.lastSignInAt ? new Date(payload.lastSignInAt) : undefined,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
        isActive: payload.isActive !== false,
        isDelete: payload.isDelete || false,
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