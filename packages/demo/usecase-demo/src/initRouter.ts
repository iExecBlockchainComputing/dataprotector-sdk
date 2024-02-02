import { QueryClient } from '@tanstack/react-query';
import { Router, NotFoundRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root.tsx';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

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
    notFoundRoute,
  });
}
