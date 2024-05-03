import {
  ErrorBoundary as RollbarErrorBoundary,
  Provider as RollbarProvider,
} from '@rollbar/react';
import React from 'react';

export function ConditionalRollbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // const isRollbarActive = true;
  const isRollbarActive =
    import.meta.env.MODE === 'production' &&
    !!import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN;

  const rollbarConfig = {
    accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN,
    environment: import.meta.env.MODE,
  };

  return isRollbarActive ? (
    <RollbarProvider config={rollbarConfig}>
      <RollbarErrorBoundary>{children}</RollbarErrorBoundary>
    </RollbarProvider>
  ) : (
    children
  );
}
