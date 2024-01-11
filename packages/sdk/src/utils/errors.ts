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

export { WorkflowError, ValidationError };
