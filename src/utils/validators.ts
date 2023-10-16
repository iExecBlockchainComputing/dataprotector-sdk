import { utils } from 'ethers';
import { ValidationError, number, object, string, array, mixed } from 'yup';

const { isAddress } = utils;

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};

const isUndefined = (value: any) => value === undefined;
const isAddressTest = (value: string) => isAddress(value);
const isEnsTest = (value: string) => value.endsWith('.eth') && value.length > 6;
const isAnyTest = (value: string) => value === 'any';

const isPositiveIntegerStringTest = (value: string) => /^\d+$/.test(value);
const isZeroStringTest = (value: string) => value === '0';

export const stringSchema = () =>
  string().strict().typeError('${path} should be a string');

export const urlSchema = () => string().url('${path} should be a url');

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

export const addressOrEnsOrAnySchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address-or-ens-or-any',
      '${path} should be an ethereum address, a ENS name, or "any"',
      (value, { originalValue }) =>
        isUndefined(value) ||
        isAnyTest(originalValue) ||
        isAddressTest(value) ||
        isEnsTest(value)
    );

export const positiveIntegerStringSchema = () =>
  string().test(
    'is-positive-int',
    '${path} should be a positive integer',
    (value) => isUndefined(value) || isPositiveIntegerStringTest(value)
  );

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

export const positiveNumberSchema = () =>
  number().integer().min(0).typeError('${path} must be a non-negative number');

export const urlArraySchema = () => array().of(urlSchema());

export const validateOrders = (orders: any[], type: string) => {
  if (!orders || orders.length === 0) {
    throw new Error(`No ${type} orders found`);
  }
};

const recordSchema = object().test((value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  for (const key in value) {
    const val = value[key];
    if (typeof Number(key) !== 'number' || typeof val !== 'string') {
      return false;
    }
  }
  return true;
});

export const validateRecord = (label, record) => {
  try {
    return recordSchema.validateSync(record);
  } catch (error) {
    throw new ValidationError(
      `${label} is not a valid record, record must be a <number, string>`
    );
  }
};
