import { Info, CheckCircle, AlertTriangle } from 'react-feather';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast.tsx';
import { useToast } from './use-toast.ts';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-x-5">
              {variant === 'success' ? (
                <CheckCircle size="24" />
              ) : variant === 'danger' ? (
                <AlertTriangle size="24" />
              ) : (
                <Info size="24" />
              )}
              <div className="grid gap-2">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
