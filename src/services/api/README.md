# API Services Documentation

This directory contains the API service layer with JWT authentication support.

## 🏗️ Architecture

### Base CRUD API (`base-crud-api.ts`)
- Generic CRUD operations (GET, POST, PUT, DELETE)
- JWT token management with automatic refresh
- Error handling with custom ApiError class
- TypeScript generics for type safety

### Authentication API (`auth-api.ts`)
- Login/Register functionality
- Token management
- User profile operations
- Password reset functionality

## 🔐 JWT Authentication

### Automatic Token Management
- Tokens are automatically stored in localStorage
- Expired tokens are automatically refreshed
- 401 responses trigger automatic logout

### Token Storage
- Access Token: `auth_token`
- Refresh Token: `refresh_token`

## 📖 Usage Examples

### Basic CRUD Operations

```typescript
import { BaseCrudApi } from '@/services/api';

// Define your entity types
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// Create API instance
const userApi = new BaseCrudApi<User, CreateUserRequest, UpdateUserRequest>('users');

// Use CRUD operations
const users = await userApi.getAll();
const user = await userApi.getById('123');
const newUser = await userApi.create({ name: 'John', email: 'john@example.com' });
const updatedUser = await userApi.update('123', { name: 'Jane' });
await userApi.delete('123');

// Custom endpoints
const searchResults = await userApi.customRequest<User[]>('/search?q=john');
```

### Authentication

```typescript
import { authApi } from '@/services/api';

// Login
try {
  const response = await authApi.login({
    email: 'user@example.com',
    password: 'password123'
  });
  console.log('Logged in:', response.user);
} catch (error) {
  console.error('Login failed:', error);
}

// Register
try {
  const response = await authApi.register({
    email: 'newuser@example.com',
    password: 'password123',
    name: 'New User'
  });
  console.log('Registered:', response.user);
} catch (error) {
  console.error('Registration failed:', error);
}

// Get current user
const user = await authApi.getCurrentUser();

// Logout
await authApi.logout();

// Check authentication status
const isAuth = authApi.isAuthenticated();
```

### Using React Hooks

```typescript
import { useAuth } from '@/hooks';

function LoginComponent() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          {/* Login form */}
        </div>
      )}
    </div>
  );
}
```

## 🛠️ Configuration

Update your API configuration in `src/services/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-api-domain.com/api',
  TIMEOUT: 10000,
} as const;
```

## 🔧 Error Handling

The API uses a custom `ApiError` class that includes:
- HTTP status code
- Error message
- Optional error code
- Optional additional details

```typescript
try {
  const user = await userApi.getById('123');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
  }
}
```

## 🔄 Token Refresh

Tokens are automatically refreshed when:
- An API request is made with an expired token
- The refresh happens transparently in the background
- If refresh fails, the user is automatically logged out

## 🎯 Best Practices

1. **Use TypeScript**: Define proper types for your entities and requests
2. **Handle Errors**: Always wrap API calls in try-catch blocks
3. **Use Hooks**: Prefer React hooks for authentication state management
4. **Token Security**: Tokens are stored in localStorage (consider more secure storage for sensitive apps)
5. **Error Feedback**: Provide user feedback for authentication errors

## 📝 API Endpoints Expected

Your backend should implement these endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### CRUD Resources
- `GET /{resource}` - List all entities
- `GET /{resource}/{id}` - Get entity by ID
- `POST /{resource}` - Create new entity
- `PUT /{resource}/{id}` - Update entity
- `DELETE /{resource}/{id}` - Delete entity