import React from 'react';
import { BookOpen } from 'react-feather';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { cn } from '../utils/style.utils.ts';

export function DocLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isDevMode } = useDevModeStore();

  return (
    <div
      className={
        isDevMode
          ? cn(
              'visible flex items-start rounded bg-grey-700 px-4 py-3 font-mono text-sm font-normal tracking-tighter text-grey-100',
              className
            )
          : 'invisible h-0'
      }
    >
      <BookOpen size="20" className="mt-px inline-block" />
      <div className="ml-3">{children}</div>
    </div>
  );
}
