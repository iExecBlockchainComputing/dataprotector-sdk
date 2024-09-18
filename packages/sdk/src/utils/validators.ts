import { isAddress } from 'ethers';
import { IExec } from 'iexec';
import { ValidationError, array, boolean, number, object, string } from 'yup';

export const isValidProvider = async (iexec: IExec) => {
  const client = await iexec.config.resolveContractsClient();
  if (!client.signer) {
    throw new Error(
      'Unauthorized method. Please log in with your wallet, you must set a valid provider with a signer.'
    );
  }
};

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};

const isUndefined = (value: unknown) => value === undefined;
const isAddressTest = (value: string) => isAddress(value);
export const isEnsTest = (value: string) =>
  value.endsWith('.eth') && value.length > 6;

const isPositiveIntegerStringTest = (value: string) => /^\d+$/.test(value);
const isZeroStringTest = (value: string) => value === '0';

export const booleanSchema = () =>
  boolean().strict().typeError('${path} should be a boolean');

export const stringSchema = () =>
  string().strict().typeError('${path} should be a string');

export const urlSchema = () =>
  string().matches(/^http[s]?:\/\//, '${path} should be a url');

export const taskIdSchema = () =>
  string().matches(
    /^0x[a-fA-F0-9]{64}$/,
    '${path} must be a valid iExec task ID'
  );

export const addressSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address',
      '${path} should be an ethereum address',
      (value) => isUndefined(value) || isAddressTest(value)
    );

export const addressOrEnsSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address-or-ens',
      '${path} should be an ethereum address or a ENS name',
      (value) => isUndefined(value) || isAddressTest(value) || isEnsTest(value)
    );

export const positiveIntegerStringSchema = () =>
  string().test(
    'is-positive-int',
    '${path} should be a positive integer',
    (value) => isUndefined(value) || isPositiveIntegerStringTest(value)
  );

export const positiveNumberSchema = () =>
  number().integer().min(0).typeError('${path} must be a non-negative number');

export const numberBetweenSchema = (min: number, max: number) =>
  number()
    .integer()
    .min(min)
    .max(max)
    .typeError(`$\{path} must be a number between ${min} and ${max}`);

export const positiveStrictIntegerStringSchema = () =>
  string().test(
    'is-positive-strict-int',
    '${path} should be a strictly positive integer',
    (value) =>
      isUndefined(value) ||
      (!isZeroStringTest(value) && isPositiveIntegerStringTest(value))
  );

export const grantedAccessSchema = () =>
  object({
    dataset: addressSchema().required(),
    datasetprice: positiveIntegerStringSchema().required(),
    volume: positiveStrictIntegerStringSchema().required(),
    tag: stringSchema().required(),
    apprestrict: addressSchema().required(),
    workerpoolrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
    salt: stringSchema().required(),
    sign: stringSchema().required(),
  })
    .noUnknown()
    .default(undefined);

export const urlArraySchema = () => array().of(urlSchema());

export const secretsSchema = () =>
  object().test(
    'is-valid-secret',
    ({ label }) =>
      `${label} must be an object with numeric keys and string values`,
    (value) => {
      for (const key in value) {
        const val = value[key];
        if (typeof Number(key) !== 'number' || typeof val !== 'string') {
          return false;
        }
      }
      return true;
    }
  );

export const validateOnStatusUpdateCallback = <T>(
  value: unknown = () => {}
) => {
  if (typeof value != 'function') {
    throw new ValidationError('onStatusUpdate should be a function');
  }
  return value as T;
};
