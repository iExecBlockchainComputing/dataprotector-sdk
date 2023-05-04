import { utils } from 'ethers';
import { ValidationError, string } from 'yup';

const { isAddress } = utils;

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};

const isUndefined = (value: any) => value === undefined;
const isAddressTest = (value: string) => isAddress(value);
const isEnsTest = (value: string) => value.endsWith('.eth') && value.length > 6;
const isAnyTest = (value: string) => value === 'any';

const isPositiveIntegerStringTest = (value: string) => /^\d+$/.test(value);

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
