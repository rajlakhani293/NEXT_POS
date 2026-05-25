import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { setUnauthorized, setServerError, setPermissionError } from '../redux/sessionSlice'; 
import { prepareHeadersWithToken } from './apiUtils';
import { showToast } from '../toast';

interface BackendError {
  success: boolean;
  message?: string;
  data?: any;
}

const actualBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL, 
  prepareHeaders: prepareHeadersWithToken,
});

export const createBaseQueryWithInterceptor = (
  reducerPath: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  return async (args, api, extraOptions) => {
    
    let modifiedArgs = args;

    if (typeof args === 'string') {
      modifiedArgs = `${reducerPath}/${args}`;
    } else if (args && typeof args === 'object' && 'url' in args) {
      modifiedArgs = { ...args, url: `${reducerPath}/${args.url}` };
    }

    const result = await actualBaseQuery(modifiedArgs, api, extraOptions);

    const data = (result.data || result.error?.data) as BackendError;
    const isSuccessInBody = data?.success !== false;

    if (result.error || !isSuccessInBody) {
      const errorData = result.error || { status: 400, data };
      const status =
        typeof errorData.status === 'number' ? errorData.status : 400;
      const message = data?.message;

      if (status === 401) {
        api.dispatch(setUnauthorized(true));
      } else if (status === 403) {
        api.dispatch(
          setPermissionError({
            isError: true,
            message: message || 'You do not have permission to perform this action.',
          }),
        );
      } else if (message) {
        showToast.error(message);
      }

      if (status >= 500) {
        api.dispatch(
          setServerError({
            isError: true,
            code: status,
            message: message || 'Something went wrong on the server.',
          }),
        );
      }

      if (!isSuccessInBody && !result.error) {
        return { error: errorData as FetchBaseQueryError };
      }
    }

    return result;
  };
};
