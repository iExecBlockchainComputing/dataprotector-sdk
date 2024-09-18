import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import Rollbar from 'rollbar';

export function initQueryClient({ rollbar }: { rollbar: Rollbar | undefined }) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
      },
    },
    // https://tanstack.com/query/latest/docs/reference/QueryCache
    queryCache: new QueryCache({
      onError: (err: Error, query) => {
        console.error(`[${query.queryKey[0]}] ERROR`, err);
        if (err.cause) {
          console.error(`[${query.queryKey[0]}] ERROR cause`, err.cause);
        }
        rollbar?.error(
          `Query ${query.queryKey[0]} ERROR ${(err.cause as Error)?.message || err.message}`,
          err.cause || err
        );
      },
    }),
    // https://tanstack.com/query/latest/docs/reference/MutationCache
    mutationCache: new MutationCache({
      onError: (err: Error, _variables, _context, mutation) => {
        let mutationKey = mutation.options.mutationKey;
        if (!mutationKey?.[0]) {
          console.warn(
            'Please consider adding a mutationKey to your mutations'
          );
          mutationKey = ['Unknown mutation'];
        }
        console.error(`[${mutationKey}] ERROR`, err);
        if (err.cause) {
          console.error(`[${mutationKey}] ERROR cause`, err.cause);
        }
        rollbar?.error(
          `Mutation ${mutationKey} ERROR ${(err.cause as Error)?.message || err.message}`,
          err.cause || err
        );
      },
    }),
  });
}
