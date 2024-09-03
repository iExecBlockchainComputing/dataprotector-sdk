import {
  ErrorBoundary as RollbarErrorBoundary,
  Provider as RollbarProvider,
} from '@rollbar/react';
import React from 'react';
import Rollbar from 'rollbar';

export function ConditionalRollbarWrapper({
  rollbar,
  rollbarConfig,
  children,
}: {
  rollbar?: Rollbar;
  rollbarConfig?: {
    accessToken: string;
    environment: 'development' | 'production';
  };
  children: React.ReactNode;
}) {
  return rollbar ? (
    <RollbarProvider config={rollbarConfig}>
      <RollbarErrorBoundary>{children}</RollbarErrorBoundary>
    </RollbarProvider>
  ) : (
    children
  );
}
