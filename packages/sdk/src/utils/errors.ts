import { ValidationError } from 'yup';
import { ApiCallError } from 'iexec/errors';

export const grantAccessErrorMessage = 'Failed to grant access';
export const consumeProtectedDataErrorMessage =
  'Failed to consume protected data';
export const processProtectedDataErrorMessage =
  'Failed to process protected data';

export class WorkflowError extends Error {
  isProtocolError: boolean;

  constructor({
    message,
    errorCause,
    isProtocolError = false,
  }: {
    message: string;
    errorCause: Error;
    isProtocolError?: boolean;
  }) {
    super(message, { cause: errorCause });
    this.name = this.constructor.name;
    this.isProtocolError = isProtocolError;
  }
}

export function handleIfProtocolError(error: Error) {
  if (error instanceof ApiCallError) {
    throw new WorkflowError({
      message:
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help.",
      errorCause: error,
      isProtocolError: true,
    });
  }
}

export class ErrorWithData extends Error {
  data: Record<string, any>;

  originalError?: Error;

  constructor(
    message: string,
    data: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    if (originalError) {
      this.originalError = originalError;
    }
  }
}

export { ValidationError };
