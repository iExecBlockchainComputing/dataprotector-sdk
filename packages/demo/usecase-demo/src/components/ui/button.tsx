import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx';
import { cn } from '@/utils/style.utils.ts';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-30 text-sm font-medium ring-offset-background transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-grey-800 hover:text-white dark:hover:bg-grey-100 dark:hover:text-grey-800',
        outline:
          'border border-grey-50 bg-background hover:bg-grey-800 hover:text-white',
        text: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-[34px] px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      type = 'button',
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return asChild ? (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        children={children}
        {...props}
      />
    ) : (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/*{isLoading && <Loader size="16" className="animate-spin-slower mr-2" />}*/}
        {isLoading && <LoadingSpinner className="mr-2 animate-spin-slow" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
