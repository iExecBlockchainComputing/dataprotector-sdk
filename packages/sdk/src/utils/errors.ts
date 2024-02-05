import { ValidationError } from 'yup';

class WorkflowError extends Error {
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    if (originalError) {
      this.originalError = originalError;
    }
  }
}

class ErrorWithData extends Error {
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

export { WorkflowError, ErrorWithData, ValidationError };
