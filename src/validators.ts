import { ValidationError } from 'yup';

const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};
export { throwIfMissing };
