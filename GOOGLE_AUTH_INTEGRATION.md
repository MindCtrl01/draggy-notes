# Google Authentication Integration

This document describes the Firebase Google Authentication integration that has been added to the Draggy Notes application.

## Overview

The application now supports Google OAuth authentication using Firebase Authentication, allowing users to sign in or register using their Google accounts.

## Features Implemented

### 1. Firebase Configuration
- **File**: `src/config/firebase.ts`
- Initializes Firebase app with configuration from `vite.config.ts`
- Sets up Firebase Authentication
- Supports Firebase Auth emulator for development

### 2. Firebase Authentication Service
- **File**: `src/services/auth/firebase-auth.ts`
- Provides methods for Google OAuth authentication
- Handles user data conversion between Firebase and app formats
- Includes error handling and user-friendly error messages

### 3. Enhanced Authentication Hook
- **File**: `src/hooks/auth/use-auth.ts`
- Added `signInWithGoogle()` method
- Integrated Firebase auth state listener
- Maintains compatibility with existing backend authentication

### 4. Updated Login Modal
- **File**: `src/components/auth/LoginModal.tsx`
- Added Google sign-in button with Google icon
- Includes proper styling and loading states
- Handles both login and registration modes with Google OAuth

### 5. Updated Auth Context
- **File**: `src/components/common/contexts/AuthContext.tsx`
- Added `signInWithGoogle` method to context interface

## Usage

### For Users
1. Click on the login/register modal
2. Choose either:
   - Fill out the form for email/password authentication
   - Click "Sign in/up with Google" button for Google OAuth

### For Developers
```typescript
// Using the auth hook
const { signInWithGoogle } = useAuth();

const handleGoogleSignIn = async () => {
  try {
    await signInWithGoogle();
    // User is now authenticated
  } catch (error) {
    // Handle authentication error
    console.error('Google sign-in failed:', error);
  }
};
```

## Dependencies Added

- `firebase` - Firebase SDK for authentication
- `react-icons` - For Google icon (FcGoogle)

## Configuration

The Firebase configuration is already set up in `vite.config.ts`:

```typescript
define: {
  'process.env.VITE_FIREBASE_API_KEY': JSON.stringify("your-api-key"),
  'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify("your-domain"),
  'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify("your-project-id"),
  // ... other Firebase config
}
```

## Firebase Console Setup Required

To enable Google authentication:

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add your domains to authorized domains:
   - `localhost` (for development)
   - Your production domain

## Error Handling

The integration includes comprehensive error handling for common scenarios:
- User cancels Google sign-in popup
- Network errors
- Invalid credentials
- Account disabled
- Rate limiting

## Backend Integration

The Google authentication creates an `AuthUser` object that's compatible with the existing backend API. The Firebase ID token can be used for backend authentication if needed.

## Security Notes

- Firebase handles the OAuth flow securely
- User tokens are managed by Firebase Authentication
- No sensitive credentials are stored in the frontend
- Supports Firebase Security Rules for additional protection
