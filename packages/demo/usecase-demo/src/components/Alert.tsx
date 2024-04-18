import { ReactNode } from 'react';
import { AlertOctagon, CheckCircle, Info } from 'react-feather';
import { cn } from '../utils/style.utils.ts';

export function Alert({
  children,
  className,
  variant,
  fullWidth = false,
}: {
  children: ReactNode;
  className?: string;
  variant: 'error' | 'success' | 'info';
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-x-5 rounded-lg border p-5 font-medium',
        variant === 'success'
          ? 'border-green-300 bg-success text-success-foreground'
          : variant === 'info'
            ? 'border-blue-300 bg-blue-50 text-blue-400'
            : 'border-[#9A1D1D] bg-[#FBCFCF] text-[#9A1D1D]',
        fullWidth ? 'w-full' : '',
        className
      )}
    >
      <div>
        {variant === 'success' ? (
          <CheckCircle size="24" />
        ) : variant === 'error' ? (
          <AlertOctagon size="24" />
        ) : (
          <Info size="24" />
        )}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
