import { CheckCircle, Info } from 'react-feather';
import { ReactNode } from 'react';
import { cn } from '../utils/style.utils.ts';

export function Alert({
  children,
  className,
  variant,
  fullWidth = false,
}: {
  children: ReactNode;
  className?: string;
  variant: 'error' | 'success';
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-x-5 rounded-md border p-5 font-medium',
        variant === 'success'
          ? 'border-green-300 bg-success text-success-foreground'
          : 'border-orange-300 bg-danger text-danger-foreground',
        fullWidth ? 'w-full' : '',
        className
      )}
    >
      <div>
        {variant === 'success' ? <CheckCircle size="20" /> : <Info size="20" />}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
