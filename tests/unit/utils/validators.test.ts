import { describe, it, expect } from '@jest/globals';
import {
  addressSchema,
  addressOrEnsSchema,
  addressOrEnsOrAnySchema,
  positiveIntegerStringSchema,
  positiveStrictIntegerStringSchema,
} from '../../../dist/utils/validators';
import { Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getRequiredFieldMessage } from '../../e2e/IExecDataProtector/test-utils';

const CANNOT_BE_NULL_ERROR = new ValidationError('this cannot be null');
const IS_REQUIRED_ERROR = new ValidationError(getRequiredFieldMessage());

describe('addressSchema()', () => {
  describe('validateSync()', () => {
    const address = Wallet.createRandom().address;
    const EXPECTED_ERROR = new ValidationError(
      'this should be an ethereum address'
    );

    it('transforms to lowercase', () => {
      const res = addressSchema().validateSync(address);
      expect(res).toBe(address.toLowerCase());
    });
    it('accepts undefined (is not required by default)', () => {
      const res = addressSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts case insensitive ethereum address', () => {
      expect(addressSchema().validateSync(address)).toBeDefined();
      expect(addressSchema().validateSync(address.toUpperCase())).toBeDefined();
      expect(addressSchema().validateSync(address.toLowerCase())).toBeDefined();
    });
    it('does not accept null', () => {
      expect(() => addressSchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => addressSchema().validateSync('')).toThrow(EXPECTED_ERROR);
    });
    it('does not accept non address string', () => {
      expect(() => addressSchema().validateSync('test')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          addressSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('addressOrEnsSchema()', () => {
  describe('validateSync()', () => {
    const address = Wallet.createRandom().address;
    const EXPECTED_ERROR = new ValidationError(
      'this should be an ethereum address or a ENS name'
    );

    it('transforms to lowercase', () => {
      const res = addressOrEnsSchema().validateSync(address);
      expect(res).toBe(address.toLowerCase());
    });
    it('accepts undefined (is not required by default)', () => {
      const res = addressOrEnsSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts case insensitive ethereum address', () => {
      expect(addressOrEnsSchema().validateSync(address)).toBeDefined();
      expect(
        addressOrEnsSchema().validateSync(address.toUpperCase())
      ).toBeDefined();
      expect(
        addressOrEnsSchema().validateSync(address.toLowerCase())
      ).toBeDefined();
    });
    it('accepts string ending with ".eth"', () => {
      expect(addressOrEnsSchema().validateSync('FOO.eth')).toBe('foo.eth');
    });
    it('does not accept null', () => {
      expect(() => addressOrEnsSchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => addressOrEnsSchema().validateSync('')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept non address string', () => {
      expect(() => addressOrEnsSchema().validateSync('test')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept ENS name with label < 3 char', () => {
      expect(() => addressOrEnsSchema().validateSync('ab.eth')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          addressOrEnsSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('addressOrEnsOrAnySchema()', () => {
  describe('validateSync()', () => {
    const address = Wallet.createRandom().address;
    const ANY_KEYWORD = 'any';
    const EXPECTED_ERROR = new ValidationError(
      'this should be an ethereum address, a ENS name, or "any"'
    );

    it('transforms to lowercase', () => {
      const res = addressOrEnsOrAnySchema().validateSync(address);
      expect(res).toBe(address.toLowerCase());
    });
    it('accepts undefined (is not required by default)', () => {
      const res = addressOrEnsOrAnySchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts case insensitive ethereum address', () => {
      expect(addressOrEnsOrAnySchema().validateSync(address)).toBeDefined();
      expect(
        addressOrEnsOrAnySchema().validateSync(address.toUpperCase())
      ).toBeDefined();
      expect(
        addressOrEnsOrAnySchema().validateSync(address.toLowerCase())
      ).toBeDefined();
    });
    it('accepts string ending with ".eth"', () => {
      expect(addressOrEnsOrAnySchema().validateSync('FOO.eth')).toBe('foo.eth');
    });
    it('accepts case sensitive "any"', () => {
      expect(addressOrEnsOrAnySchema().validateSync(ANY_KEYWORD)).toBe(
        ANY_KEYWORD
      );
      expect(() =>
        addressOrEnsOrAnySchema().validateSync(ANY_KEYWORD.toUpperCase())
      ).toThrow(EXPECTED_ERROR);
    });
    it('does not accept null', () => {
      expect(() => addressOrEnsOrAnySchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept ENS name with label < 3 char', () => {
      expect(() => addressOrEnsOrAnySchema().validateSync('ab.eth')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => addressOrEnsOrAnySchema().validateSync('')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept non address string', () => {
      expect(() => addressOrEnsOrAnySchema().validateSync('test')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          addressOrEnsOrAnySchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('positiveIntegerStringSchema()', () => {
  describe('validateSync()', () => {
    const EXPECTED_ERROR = new ValidationError(
      'this should be a positive integer'
    );
    it('transforms to string', () => {
      const res = positiveIntegerStringSchema().validateSync(1);
      expect(typeof res).toBe('string');
    });
    it('accepts undefined (is not required by default)', () => {
      const res = positiveIntegerStringSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts positive integer', () => {
      const res = positiveIntegerStringSchema().validateSync(1);
      expect(res).toBe('1');
    });
    it('accepts zero', () => {
      const res = positiveIntegerStringSchema().validateSync(0);
      expect(res).toBe('0');
    });
    it('accepts string integers', () => {
      const res = positiveIntegerStringSchema().validateSync('123456789');
      expect(res).toBe('123456789');
    });
    it('accepts "0"', () => {
      const res = positiveIntegerStringSchema().validateSync('0');
      expect(res).toBe('0');
    });
    it('does not accept null', () => {
      expect(() => positiveIntegerStringSchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => positiveIntegerStringSchema().validateSync('')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept negative values', () => {
      expect(() => positiveIntegerStringSchema().validateSync(-1)).toThrow(
        EXPECTED_ERROR
      );
      expect(() => positiveIntegerStringSchema().validateSync('-1')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept float values', () => {
      expect(() => positiveIntegerStringSchema().validateSync(1.1)).toThrow(
        EXPECTED_ERROR
      );
      expect(() => positiveIntegerStringSchema().validateSync('1.1')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          positiveIntegerStringSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('positiveStrictIntegerStringSchema()', () => {
  describe('validateSync()', () => {
    const EXPECTED_ERROR = new ValidationError(
      'this should be a strictly positive integer'
    );
    it('transforms to string', () => {
      const res = positiveStrictIntegerStringSchema().validateSync(1);
      expect(typeof res).toBe('string');
    });
    it('accepts undefined (is not required by default)', () => {
      const res = positiveStrictIntegerStringSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts positive integer', () => {
      const res = positiveStrictIntegerStringSchema().validateSync(1);
      expect(res).toBe('1');
    });
    it('accepts string integers', () => {
      const res = positiveStrictIntegerStringSchema().validateSync('123456789');
      expect(res).toBe('123456789');
    });
    it('does not accept null', () => {
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync(null)
      ).toThrow(CANNOT_BE_NULL_ERROR);
    });
    it('does not accept empty string', () => {
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync('')
      ).toThrow(EXPECTED_ERROR);
    });
    it('does not accept zero', () => {
      expect(() => positiveStrictIntegerStringSchema().validateSync(0)).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept "0"', () => {
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync('0')
      ).toThrow(EXPECTED_ERROR);
    });
    it('does not accept negative values', () => {
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync(-1)
      ).toThrow(EXPECTED_ERROR);
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync('-1')
      ).toThrow(EXPECTED_ERROR);
    });
    it('does not accept float values', () => {
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync(1.1)
      ).toThrow(EXPECTED_ERROR);
      expect(() =>
        positiveStrictIntegerStringSchema().validateSync('1.1')
      ).toThrow(EXPECTED_ERROR);
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          positiveStrictIntegerStringSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});
