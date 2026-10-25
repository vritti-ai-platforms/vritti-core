import type { UseQueryOptions, UseSuspenseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export type Options<T> = Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>;
export type SuspenseOptions<T> = Omit<UseSuspenseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>;
