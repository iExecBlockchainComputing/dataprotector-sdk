import React from 'react';
import { BookOpen } from 'react-feather';
import { cn } from '../utils/style.utils.ts';

export function DocLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded bg-grey-700 px-4 py-3 font-mono text-sm font-normal tracking-tighter text-grey-100',
        className
      )}
    >
      <BookOpen size="20" className="mr-2.5 inline-block" />
      {children}
    </div>
  );
}
