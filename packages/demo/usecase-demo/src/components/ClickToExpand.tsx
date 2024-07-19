import React, { useState } from 'react';
import { ChevronDown, Info } from 'react-feather';
import { cn } from '@/utils/style.utils';

export function ClickToExpand({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className={cn(
        'group flex gap-4 rounded-2xl border border-grey-600 bg-grey-700 p-4',
        className,
        { expanded }
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <Info />
      <div className="grid grow">
        <div className="flex w-full items-center gap-2">
          <div className="flex-1 text-left font-bold">{title}</div>
          <ChevronDown className="duration-200 group-[.expanded]:rotate-180" />
        </div>
        <div className="grid grid-rows-[0fr] duration-200 group-[.expanded]:mt-2 group-[.expanded]:grid-rows-[1fr]">
          <div className="overflow-hidden pr-10 text-left text-sm">
            {children}
          </div>
        </div>
      </div>
    </button>
  );
}
