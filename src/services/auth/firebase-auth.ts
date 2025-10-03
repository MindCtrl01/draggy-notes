import { 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthUser } from '@/services/api/models/auth.model';

export interface FirebaseAuthResult {
  user: AuthUser;
  token?: string;
}

export class FirebaseAuthService {
  private googleProvider: GoogleAuthProvider;
  private facebookProvider: FacebookAuthProvider;
  private appleProvider: OAuthProvider;

  constructor() {
    // Configure Google provider
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');

    // Configure Facebook provider
    this.facebookProvider = new FacebookAuthProvider();
    this.facebookProvider.addScope('email');

    // Configure Apple provider
    this.appleProvider = new OAuthProvider('apple.com');
    this.appleProvider.addScope('email');
    this.appleProvider.addScope('name');
  }

  // Convert Firebase User to AuthUser format
  private convertFirebaseUserToAuthUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      id: Date.now(), // Use timestamp as numeric ID
      uuid: firebaseUser.uid,
      username: firebaseUser.displayName || '',
      email: firebaseUser.email || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      displayName: firebaseUser.displayName || '',
      photoUrl: firebaseUser.photoURL || '',
      emailVerified: firebaseUser.emailVerified,
      lastSignInAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date(),
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      isActive: true,
      isDelete: false,
    };
  }


  // Sign in with Google
  async signInWithGoogle(): Promise<FirebaseAuthResult> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = this.convertFirebaseUserToAuthUser(result.user);
      const token = await result.user.getIdToken();
      
      return { user, token };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<FirebaseAuthResult> {
    try {
      const result = await signInWithPopup(auth, this.facebookProvider);
      const user = this.convertFirebaseUserToAuthUser(result.user);
      const token = await result.user.getIdToken();
      
      return { user, token };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with Apple
  async signInWithApple(): Promise<FirebaseAuthResult> {
    try {
      const result = await signInWithPopup(auth, this.appleProvider);
      const user = this.convertFirebaseUserToAuthUser(result.user);
      const token = await result.user.getIdToken();
      
      return { user, token };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }


  // Listen to authentication state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const authUser = this.convertFirebaseUserToAuthUser(firebaseUser);
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    const firebaseUser = auth.currentUser;
    return firebaseUser ? this.convertFirebaseUserToAuthUser(firebaseUser) : null;
  }

  // Error message helper
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by browser';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support or enable this method in Firebase Console.';
      case 'auth/invalid-credential':
        return 'Invalid credentials provided';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials';
      default:
        return `Authentication failed: ${errorCode}. Please try again`;
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
