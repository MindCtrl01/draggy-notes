import { AuthUser } from "@/services/api";

export interface SessionData {
  userInfo: AuthUser;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'draggy_session';
  private static readonly LOGIN_HISTORY_KEY = 'draggy_login_history';

  /**
   * Save session data with user info and token
   */
  static saveSession(userInfo: AuthUser, token: string): void {
    const sessionData: SessionData = {
      userInfo,
      token,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.markUserHasLoggedIn();
  }

  /**
   * Get current session data
   */
  static getSession(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const parsed = JSON.parse(sessionData) as SessionData;
      
      // Check if session is expired
      if (this.isSessionExpired(parsed)) {
        this.clearSession();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse session data:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Get current user info from session
   */
  static getCurrentUser(): AuthUser | null {
    const session = this.getSession();
    return session?.userInfo || null;
  }

  /**
   * Get token from session
   */
  static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Clear session data (logout)
   */
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Check if session is expired
   */
  private static isSessionExpired(session: SessionData): boolean {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return now >= expiresAt;
  }

  /**
   * Mark that user has logged in (for login history tracking)
   */
  static markUserHasLoggedIn(): void {
    localStorage.setItem(this.LOGIN_HISTORY_KEY, 'true');
  }

  /**
   * Check if user has ever logged in
   */
  static hasUserEverLoggedIn(): boolean {
    return localStorage.getItem(this.LOGIN_HISTORY_KEY) === 'true';
  }

  /**
   * Update token in existing session
   */
  static updateToken(token: string): void {
    const session = this.getSession();
    if (session) {
      session.token = token;
      session.expiresAt = new Date(Date.now() + 3600000).toISOString(); // Refresh expiration
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  /**
   * Update user info in existing session
   */
  static updateUserInfo(userInfo: AuthUser): void {
    const session = this.getSession();
    if (session) {
      session.userInfo = userInfo;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  /**
   * Get session expiration time
   */
  static getSessionExpiration(): Date | null {
    const session = this.getSession();
    return session ? new Date(session.expiresAt) : null;
  }

  /**
   * Check if session will expire soon (within 5 minutes)
   */
  static isSessionExpiringSoon(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return expiresAt <= fiveMinutesFromNow;
  }
}
