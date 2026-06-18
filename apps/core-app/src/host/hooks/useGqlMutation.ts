import type { DocumentNode, OperationVariables, TypedDocumentNode } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback, useRef } from 'react';
import { getToastAdapter } from '../config/toast';

// Toast copy for a GraphQL mutation. The axios interceptor auto-fires loading/success/error
// toasts for REST mutations; Apollo bypasses that interceptor, so this wrapper reproduces the
// same behaviour through the SAME registered ToastAdapter (see config/toast.ts). All three
// messages are opt-in — omit one to skip that toast.
export interface GqlMutationToast {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export type UseGqlMutationOptions<TData, TVariables extends OperationVariables> = useMutation.Options<
  TData,
  TVariables
> & { toast?: GqlMutationToast };

// Thin wrapper around Apollo's useMutation that fires loading/success/error toasts through the
// app's shared toast adapter, mirroring the axios interceptor. Returns the standard
// `[mutate, result]` tuple — callers use it exactly like useMutation. Toast copy is passed via
// `toast`; any `onCompleted`/`onError` you also pass still run (the toast fires first). The
// loading toast is upgraded in place to the success/error toast (same id) so it never stacks.
export function useGqlMutation<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UseGqlMutationOptions<TData, TVariables>,
) {
  const { toast, onCompleted, onError, ...rest } = options ?? {};
  // Holds the in-flight loading toast id so the resolved success/error toast replaces it.
  const loadingToastId = useRef<string | undefined>(undefined);

  const [mutate, result] = useMutation<TData, TVariables>(mutation, {
    ...rest,
    onCompleted: (data, clientOptions) => {
      if (toast?.successMessage) {
        getToastAdapter()?.success(toast.successMessage, { id: loadingToastId.current });
      }
      loadingToastId.current = undefined;
      onCompleted?.(data, clientOptions);
    },
    onError: (error, clientOptions) => {
      const message = toast?.errorMessage ?? error.message;
      if (message) getToastAdapter()?.error(message, { id: loadingToastId.current });
      loadingToastId.current = undefined;
      onError?.(error, clientOptions);
    },
  });

  // Fire the loading toast synchronously when the caller triggers the mutation.
  const mutateWithToast = useCallback<typeof mutate>(
    (...args) => {
      if (toast?.loadingMessage) {
        loadingToastId.current = getToastAdapter()?.loading(toast.loadingMessage);
      }
      return mutate(...args);
    },
    [mutate, toast?.loadingMessage],
  );

  return [mutateWithToast, result] as const;
}
