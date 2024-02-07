import { QueryClient } from '@tanstack/react-query';
import { Router } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

export function initRouter(queryClient: QueryClient) {
  return new Router({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
    // Since we're using React Query, we don't want loader calls to ever be stale
    // This will ensure that the loader is always called when the route is preloaded or visited
    defaultPreloadStaleTime: 0,
  });
}
