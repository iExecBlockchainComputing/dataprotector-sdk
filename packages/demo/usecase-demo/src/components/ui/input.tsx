import * as React from 'react';
import { cn } from '@/utils/style.utils.ts';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  appendText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, appendText, ...props }, ref) => {
    if (appendText) {
      return (
        <div className="relative inline-block">
          <input
            type={type}
            className={cn(
              'border-input placeholder:text-muted-foreground flex h-9 w-full rounded-xl border bg-background pl-4 pr-12 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            ref={ref}
            {...props}
          />
          <span className="text-sm cursor-auto absolute right-3 h-full flex items-center top-0">
            {appendText}
          </span>
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          'border-input placeholder:text-muted-foreground flex h-9 w-full rounded-xl border bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
