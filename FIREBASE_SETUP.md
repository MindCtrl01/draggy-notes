# Firebase Authentication Setup

This project now uses Firebase Authentication as the OAuth provider. Follow these steps to set up Firebase for your project.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "draggy-notes")
4. Enable Google Analytics (optional)
5. Create the project

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click on it and enable
   - **Google**: Click on it, enable, and configure with your Google OAuth credentials

## 3. Get Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "draggy-notes-web")
6. Copy the Firebase configuration object

## 4. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5231/api
VITE_APP_TITLE=Draggy Notes
VITE_DEBUG_MODE=true

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Emulator (for development)
VITE_USE_FIREBASE_EMULATOR=false
```

Replace the placeholder values with your actual Firebase configuration values.

## 5. Configure Google OAuth (Optional)

If you want to use Google sign-in:

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains:
   - `localhost` (for development)
   - Your production domain
4. Configure OAuth consent screen in Google Cloud Console if needed

## 6. Firebase Emulator (Development)

For local development, you can use Firebase emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize emulators: `firebase init emulators`
4. Start emulators: `firebase emulators:start`
5. Set `VITE_USE_FIREBASE_EMULATOR=true` in your `.env` file

## 7. Usage

The Firebase authentication is now integrated into your app. You can use:

- `signInWithEmail(email, password)` - Email/password sign-in
- `signUpWithEmail(email, password, displayName?)` - Email/password sign-up
- `signInWithGoogle()` - Google OAuth sign-in
- `logout()` - Sign out
- `forgotPassword(email)` - Send password reset email
- `resetPassword(code, newPassword)` - Reset password with code

## 8. Security Rules

Make sure to configure Firebase Security Rules for Firestore if you plan to use it:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

- **CORS errors**: Make sure your domain is added to authorized domains in Firebase Console
- **Invalid API key**: Double-check your Firebase configuration values
- **Google sign-in not working**: Ensure Google provider is enabled and OAuth consent screen is configured
- **Emulator connection issues**: Make sure Firebase emulators are running and `VITE_USE_FIREBASE_EMULATOR=true`
