# 🚀 Generic CRUD API System

This document explains how to use the generic CRUD API system with React Query for any resource in your application.

## 📋 **System Overview**

The generic CRUD system consists of:

1. **`BaseCrudApi`** - Generic API service class
2. **`createCrudHooks`** - Generic React Query hooks factory
3. **Resource-specific implementations** - Customized for each resource (e.g., Notes)

## 🏗️ **Architecture**

```
Generic CRUD System
├── BaseCrudApi<TEntity, TCreateRequest, TUpdateRequest>
├── createCrudHooks() → Returns standard hooks
└── Resource-specific API → Extends BaseCrudApi
```

## 🎯 **Creating a New Resource API**

### **Step 1: Define Types**

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}
```

### **Step 2: Create API Service**

```typescript
// api/users-api.ts
import { BaseCrudApi } from '@/lib/api/base-crud-api';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

// API response type (what backend returns)
interface UserApiResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string; // Backend uses snake_case
  updated_at: string;
}

// Transform backend response to frontend type
function apiUserToUser(apiUser: UserApiResponse): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    avatar: apiUser.avatar,
    createdAt: new Date(apiUser.created_at),
    updatedAt: new Date(apiUser.updated_at),
  };
}

class UsersApi extends BaseCrudApi<User, CreateUserRequest, UpdateUserRequest> {
  constructor() {
    super('users'); // Creates endpoints: /users, /users/{id}
  }

  // Override methods to handle data transformation
  async getAll(): Promise<User[]> {
    const apiUsers = await super.customRequest<UserApiResponse[]>('');
    return apiUsers.map(apiUserToUser);
  }

  async getById(id: string): Promise<User> {
    const apiUser = await super.customRequest<UserApiResponse>(\`/\${id}\`);
    return apiUserToUser(apiUser);
  }

  async create(data: CreateUserRequest): Promise<User> {
    const apiUser = await super.customRequest<UserApiResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return apiUserToUser(apiUser);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const apiUser = await super.customRequest<UserApiResponse>(\`/\${id}\`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return apiUserToUser(apiUser);
  }

  // Custom methods specific to users
  async getUsersByRole(role: string): Promise<User[]> {
    const apiUsers = await super.customRequest<UserApiResponse[]>(\`/role/\${role}\`);
    return apiUsers.map(apiUserToUser);
  }

  async resetPassword(id: string): Promise<void> {
    await super.customRequest<void>(\`/\${id}/reset-password\`, {
      method: 'POST',
    });
  }
}

export const usersApi = new UsersApi();
```

### **Step 3: Create React Query Hooks**

```typescript
// hooks/use-users-api.ts
import { createCrudHooks } from '@/hooks/api/use-crud-api';
import { usersApi, CreateUserRequest, UpdateUserRequest } from '../api/users-api';
import { User } from '@/types/user';

// Create standard CRUD hooks
const {
  useGetAll: useGetAllUsers,
  useGetById: useGetUserById,
  useCreate: useCreateUser,
  useUpdate: useUpdateUser,
  useDelete: useDeleteUser,
  queryKeys: usersQueryKeys,
} = createCrudHooks(usersApi, {
  resource: 'user',
  successMessages: {
    create: 'User created successfully!',
    update: 'User updated successfully!',
    delete: 'User deleted successfully!',
  },
});

// Main hook with additional functionality
export const useUsersApi = () => {
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useGetAllUsers();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Helper functions
  const createUser = (userData: CreateUserRequest) => {
    return createUserMutation.mutate(userData);
  };

  const updateUser = (id: string, userData: UpdateUserRequest) => {
    return updateUserMutation.mutate({ id, data: userData });
  };

  const deleteUser = (id: string) => {
    return deleteUserMutation.mutate(id);
  };

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};

export { useGetAllUsers, useGetUserById, useCreateUser, useUpdateUser, useDeleteUser };
```

### **Step 4: Use in Components**

```typescript
// components/UsersList.tsx
import React from 'react';
import { useUsersApi } from '@/hooks/use-users-api';

export const UsersList = () => {
  const {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
  } = useUsersApi();

  const handleCreateUser = () => {
    createUser({
      name: 'John Doe',
      email: 'john@example.com',
    });
  };

  const handleUpdateUser = (id: string) => {
    updateUser(id, {
      name: 'Jane Doe',
    });
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <button onClick={handleCreateUser} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create User'}
      </button>

      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <button 
            onClick={() => handleUpdateUser(user.id)}
            disabled={isUpdating}
          >
            Update
          </button>
          <button 
            onClick={() => handleDeleteUser(user.id)}
            disabled={isDeleting}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 🎯 **Notes API Example (Current Implementation)**

### **API Service (`notes-crud-api.ts`)**

```typescript
class NotesApi extends BaseCrudApi<Note, CreateNoteRequest, UpdateNoteRequest> {
  constructor() {
    super('notes'); // Creates: GET /notes, POST /notes, PUT /notes/{id}, DELETE /notes/{id}
  }

  // Custom methods
  async duplicateNote(id: string): Promise<Note> {
    // POST /notes/{id}/duplicate
  }

  async searchNotes(query: string): Promise<Note[]> {
    // GET /notes/search?q={query}
  }

  async bulkDelete(ids: string[]): Promise<void> {
    // DELETE /notes/bulk-delete
  }
}
```

### **React Query Hooks (`use-notes-crud.ts`)**

```typescript
export const useNotesApi = () => {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useStandardCrudHooks();
  
  // Additional custom operations
  const duplicateNote = (id: string) => duplicateNoteMutation.mutate(id);
  const searchNotes = (query: string) => searchNotesMutation.mutate(query);
  const bulkDeleteNotes = (ids: string[]) => bulkDeleteMutation.mutate(ids);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    searchNotes,
    bulkDeleteNotes,
    // ... loading states and errors
  };
};
```

## 🔧 **Advanced Features**

### **1. Custom Query Options**

```typescript
// Custom query with specific options
const { data: users } = useGetAllUsers({
  staleTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  enabled: isAuthenticated,
});
```

### **2. Optimistic Updates**

```typescript
const updateUserMutation = useUpdateUser({
  onMutate: async ({ id, data }) => {
    // Optimistically update the cache
    const previousUsers = queryClient.getQueryData(usersQueryKeys.lists());
    
    queryClient.setQueryData(usersQueryKeys.lists(), (oldUsers: User[]) =>
      oldUsers?.map(user => 
        user.id === id ? { ...user, ...data } : user
      ) || []
    );

    return { previousUsers };
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(usersQueryKeys.lists(), context?.previousUsers);
  },
});
```

### **3. Pagination Support**

```typescript
// Add pagination to the base API
class PaginatedUsersApi extends BaseCrudApi<User, CreateUserRequest, UpdateUserRequest> {
  async getPaginated(page: number, limit: number): Promise<PaginatedResponse<User>> {
    return this.customRequest<PaginatedResponse<User>>(\`?page=\${page}&limit=\${limit}\`);
  }
}
```

### **4. Error Handling**

```typescript
const { error } = useGetAllUsers({
  onError: (error) => {
    if (error.status === 401) {
      // Redirect to login
      router.push('/login');
    } else if (error.status === 403) {
      // Show permission denied
      toast.error('You don\'t have permission to view users');
    }
  },
});
```

## 🚀 **Benefits**

### ✅ **Consistency**
- Standardized API patterns across all resources
- Consistent error handling and success messages
- Unified caching strategy

### ✅ **Type Safety**
- Full TypeScript support
- Generic types for compile-time safety
- Auto-completion for all operations

### ✅ **Performance**
- Automatic caching with React Query
- Optimistic updates for better UX
- Smart cache invalidation

### ✅ **Developer Experience**
- Less boilerplate code
- Easy to extend with custom methods
- Consistent patterns across the app

### ✅ **Maintainability**
- Centralized API logic
- Easy to update all resources at once
- Clear separation of concerns

This generic CRUD system provides a solid foundation for any API-driven application with React Query! 🎉
