import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BaseCrudApi, createQueryKeys, ApiError } from '@/lib/api/base-crud-api';

// Generic CRUD hooks configuration
interface CrudHooksConfig {
  resource: string;
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  errorMessages?: {
    create?: string;
    update?: string;
    delete?: string;
    fetch?: string;
  };
}

// Generic CRUD hooks factory
export function createCrudHooks<TEntity, TCreateRequest, TUpdateRequest>(
  api: BaseCrudApi<TEntity, TCreateRequest, TUpdateRequest>,
  config: CrudHooksConfig
) {
  const queryKeys = createQueryKeys(config.resource);

  // Default messages
  const defaultMessages = {
    success: {
      create: `${config.resource} created successfully!`,
      update: `${config.resource} updated successfully!`,
      delete: `${config.resource} deleted successfully!`,
    },
    error: {
      create: `Failed to create ${config.resource}. Please try again.`,
      update: `Failed to update ${config.resource}. Please try again.`,
      delete: `Failed to delete ${config.resource}. Please try again.`,
      fetch: `Failed to fetch ${config.resource}. Please try again.`,
    },
  };

  const messages = {
    success: { ...defaultMessages.success, ...config.successMessages },
    error: { ...defaultMessages.error, ...config.errorMessages },
  };

  // Hook to get all entities
  const useGetAll = (options?: Omit<UseQueryOptions<TEntity[], ApiError>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
      queryKey: queryKeys.lists(),
      queryFn: () => api.getAll(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      ...options,
      onError: (error) => {
        console.error(`Failed to fetch ${config.resource}:`, error);
        toast.error(messages.error.fetch);
        options?.onError?.(error);
      },
    });
  };

  // Hook to get single entity by ID
  const useGetById = (
    id: string,
    options?: Omit<UseQueryOptions<TEntity, ApiError>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => api.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      ...options,
      onError: (error) => {
        console.error(`Failed to fetch ${config.resource} ${id}:`, error);
        toast.error(messages.error.fetch);
        options?.onError?.(error);
      },
    });
  };

  // Hook to create entity
  const useCreate = (options?: UseMutationOptions<TEntity, ApiError, TCreateRequest>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: TCreateRequest) => api.create(data),
      onSuccess: (newEntity, variables) => {
        // Update the cache with the new entity
        queryClient.setQueryData<TEntity[]>(queryKeys.lists(), (oldData) => [
          ...(oldData || []),
          newEntity,
        ]);

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });

        toast.success(messages.success.create);
        options?.onSuccess?.(newEntity, variables, undefined);
      },
      onError: (error, variables) => {
        console.error(`Failed to create ${config.resource}:`, error);
        toast.error(messages.error.create);
        options?.onError?.(error, variables, undefined);
      },
      ...options,
    });
  };

  // Hook to update entity
  const useUpdate = (options?: UseMutationOptions<TEntity, ApiError, { id: string; data: TUpdateRequest }>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdateRequest }) => api.update(id, data),
      onSuccess: (updatedEntity, variables) => {
        // Update the list cache
        queryClient.setQueryData<TEntity[]>(queryKeys.lists(), (oldData) =>
          oldData?.map((item: any) =>
            item.id === variables.id ? updatedEntity : item
          ) || []
        );

        // Update the detail cache
        queryClient.setQueryData(queryKeys.detail(variables.id), updatedEntity);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.details() });

        toast.success(messages.success.update);
        options?.onSuccess?.(updatedEntity, variables, undefined);
      },
      onError: (error, variables) => {
        console.error(`Failed to update ${config.resource}:`, error);
        toast.error(messages.error.update);
        options?.onError?.(error, variables, undefined);
      },
      ...options,
    });
  };

  // Hook to patch entity (partial update)
  const usePatch = (options?: UseMutationOptions<TEntity, ApiError, { id: string; data: Partial<TUpdateRequest> }>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TUpdateRequest> }) => api.patch(id, data),
      onSuccess: (updatedEntity, variables) => {
        // Update caches similar to update
        queryClient.setQueryData<TEntity[]>(queryKeys.lists(), (oldData) =>
          oldData?.map((item: any) =>
            item.id === variables.id ? updatedEntity : item
          ) || []
        );

        queryClient.setQueryData(queryKeys.detail(variables.id), updatedEntity);
        queryClient.invalidateQueries({ queryKey: queryKeys.details() });

        toast.success(messages.success.update);
        options?.onSuccess?.(updatedEntity, variables, undefined);
      },
      onError: (error, variables) => {
        console.error(`Failed to patch ${config.resource}:`, error);
        toast.error(messages.error.update);
        options?.onError?.(error, variables, undefined);
      },
      ...options,
    });
  };

  // Hook to delete entity
  const useDelete = (options?: UseMutationOptions<void, ApiError, string>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: (_, deletedId) => {
        // Remove from list cache
        queryClient.setQueryData<TEntity[]>(queryKeys.lists(), (oldData) =>
          oldData?.filter((item: any) => item.id !== deletedId) || []
        );

        // Remove from detail cache
        queryClient.removeQueries({ queryKey: queryKeys.detail(deletedId) });

        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });

        toast.success(messages.success.delete);
        options?.onSuccess?.(undefined, deletedId, undefined);
      },
      onError: (error, variables) => {
        console.error(`Failed to delete ${config.resource}:`, error);
        toast.error(messages.error.delete);
        options?.onError?.(error, variables, undefined);
      },
      ...options,
    });
  };

  // Return all hooks
  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    usePatch,
    useDelete,
    queryKeys,
  };
}
