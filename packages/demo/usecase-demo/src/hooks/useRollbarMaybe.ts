import { useRollbar } from '@rollbar/react';

export function useRollbarMaybe() {
  const isRollbarActive =
    import.meta.env.MODE === 'production' &&
    !!import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN;

  const rollbar = isRollbarActive
    ? useRollbar()
    : {
        error: () => {},
      };

  return rollbar;
}
