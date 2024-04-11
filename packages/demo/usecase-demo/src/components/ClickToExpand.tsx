import { useState } from 'react';
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
    <div
      className={cn(
        'bg-grey-700 p-4 rounded-2xl border flex gap-4 border-grey-600 group',
        className,
        { expanded: expanded }
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <Info />
      <div className="grid grow">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 text-left font-bold">{title}</div>
          <ChevronDown className="duration-200 group-[.expanded]:rotate-180" />
        </div>
        <div className="grid grid-rows-[0fr] group-[.expanded]:mt-2 duration-200 group-[.expanded]:grid-rows-[1fr]">
          <div className="overflow-hidden text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
