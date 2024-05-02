import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { AlertOctagon, CheckCircle, Info } from 'react-feather';
import { cn } from '../utils/style.utils.ts';

const alertVariants = cva(
  'flex items-center gap-x-5 rounded-lg border p-5 font-medium',
  {
    variants: {
      variant: {
        success: 'border-green-600 bg-green-100 text-green-700',
        info: 'border-blue-500 bg-blue-100 text-blue-600 ',
        error: 'border-danger-foreground bg-danger text-danger-foreground',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  }
);

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
        alertVariants({ variant }),
        fullWidth ? 'w-full' : '',
        className
      )}
    >
      {variant === 'success' ? (
        <CheckCircle size="24" />
      ) : variant === 'error' ? (
        <AlertOctagon size="24" />
      ) : (
        <Info size="24" />
      )}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
