import { isAddress } from 'ethers';
import { number, string } from 'yup';

const isAddressTest = (value: string) => isAddress(value);
const isUndefined = (value: unknown) => value === undefined;

export const positiveNumberSchema = () => number().min(0);
export const positiveStrictIntegerSchema = () => number().integer().positive();

export const orderHashSchema = () =>
  string()
    .matches(
      /^0x[a-fA-F0-9]{64}$/,
      'Invalid input: The string must be a 64-character hexadecimal string prefixed with 0x.'
    )
    .required('Input is required');

export const addressSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address',
      '${path} should be an ethereum address',
      (value) => isUndefined(value) || isAddressTest(value)
    );
