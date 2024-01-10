import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/style.utils.ts';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // default = primary
        // Instead of "hover:bg-grey-800 dark:hover:bg-grey-100" probably better to define a button-primary-bg-hover?
        default:
          'bg-primary text-primary-foreground hover:bg-grey-800 hover:text-white dark:hover:bg-grey-100 dark:hover:text-grey-800',
        // secondary ~= outline
        secondary:
          'border border-button bg-background hover:bg-grey-800 hover:text-white',
        // text ~= ghost
        text: 'hover:bg-accent hover:text-accent-foreground',
        // destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // outline: 'border border-button bg-background hover:bg-accent hover:text-accent-foreground',
        // ghost: 'hover:bg-accent hover:text-accent-foreground',
        // link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-3', // h-11 = 44px
        sm: 'h-[34px] px-4 py-2',
        // lg: "h-11 rounded-md px-8",
        // icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, type = 'button', ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
