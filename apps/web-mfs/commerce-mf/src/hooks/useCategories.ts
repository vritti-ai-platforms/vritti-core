import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../schemas';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services';

type UseCategoriesOptions = Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>;

// Fetches all categories for an org+bu
export function useCategories(businessUnitId: string, options?: UseCategoriesOptions) {
  return useQuery<Category[], Error>({
    queryKey: ['commerce', 'categories', businessUnitId],
    queryFn: () => getCategories(businessUnitId),
    enabled: !!businessUnitId,
    ...options,
  });
}

type UseCreateCategoryOptions = Omit<
  UseMutationOptions<Category, Error, CreateCategoryInput & { businessUnitId: string }>,
  'mutationFn'
>;

// Creates a new category and invalidates the list
export function useCreateCategory(options?: UseCreateCategoryOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'categories'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateCategoryParams {
  id: string;
  data: UpdateCategoryInput;
}

type UseUpdateCategoryOptions = Omit<
  UseMutationOptions<unknown, Error, UpdateCategoryParams>,
  'mutationFn'
>;

// Updates a category and invalidates the list
export function useUpdateCategory(options?: UseUpdateCategoryOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateCategoryParams) => updateCategory(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'categories'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

type UseDeleteCategoryOptions = Omit<UseMutationOptions<unknown, Error, string>, 'mutationFn'>;

// Deletes a category and invalidates the list
export function useDeleteCategory(options?: UseDeleteCategoryOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'categories'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
