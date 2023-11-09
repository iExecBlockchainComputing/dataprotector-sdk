import { describe, it, expect } from '@jest/globals';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  addressSchema,
  addressOrEnsSchema,
  addressOrEnsOrAnySchema,
  positiveIntegerStringSchema,
  positiveStrictIntegerStringSchema,
  grantedAccessSchema,
  secretsSchema,
  positiveNumberSchema,
  validateOrders,
} from '../../../src/utils/validators.js';
import {
  EMPTY_ORDER_BOOK,
  MOCK_APP_ORDER,
  MOCK_DATASET_ORDER,
  MOCK_WORKERPOOL_ORDER,
  getRandomAddress,
  getRequiredFieldMessage,
} from '../../test-utils.js';

const CANNOT_BE_NULL_ERROR = new ValidationError('this cannot be null');
const IS_REQUIRED_ERROR = new ValidationError(getRequiredFieldMessage());

describe('addressSchema()', () => {
  describe('validateSync()', () => {
    const address = getRandomAddress();
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
    const address = getRandomAddress();
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
    const address = getRandomAddress();
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

describe('grantedAccessSchema()', () => {
  describe('validateSync()', () => {
    const grantedAccess: any = {
      dataset: getRandomAddress(),
      datasetprice: 0,
      volume: 1,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      apprestrict: getRandomAddress(),
      workerpoolrestrict: getRandomAddress(),
      requesterrestrict: getRandomAddress(),
      salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
    };

    it('accepts undefined (is not required by default)', () => {
      const res = grantedAccessSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });

    it('stringifies numbers and lowercase addresses', () => {
      const res = grantedAccessSchema().validateSync(grantedAccess);
      expect(res).toStrictEqual({
        dataset: grantedAccess.dataset.toLowerCase(),
        datasetprice: grantedAccess.datasetprice.toString(),
        volume: grantedAccess.volume.toString(),
        tag: grantedAccess.tag,
        apprestrict: grantedAccess.apprestrict.toLowerCase(),
        workerpoolrestrict: grantedAccess.workerpoolrestrict.toLowerCase(),
        requesterrestrict: grantedAccess.requesterrestrict.toLowerCase(),
        salt: grantedAccess.salt,
        sign: grantedAccess.sign,
      });
    });
    it('strips unexpected keys', () => {
      const res: any = grantedAccessSchema().validateSync({
        ...grantedAccess,
        unexpected: 'foo',
      });
      expect(res.unexpected).toBeUndefined();
    });
    it('checks dataset is a required address', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          dataset: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('dataset')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          dataset: 'foo',
        })
      ).toThrow(new ValidationError('dataset should be an ethereum address'));
    });
    it('checks datasetprice is a required positive integer', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          datasetprice: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('datasetprice')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          datasetprice: 'foo',
        })
      ).toThrow(
        new ValidationError('datasetprice should be a positive integer')
      );
    });
    it('checks volume is a required strictly positive integer', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          volume: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('volume')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          volume: 'foo',
        })
      ).toThrow(
        new ValidationError('volume should be a strictly positive integer')
      );
    });
    it('checks tag is a string', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          tag: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('tag')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          tag: 42,
        })
      ).toThrow(new ValidationError('tag should be a string'));
    });
    it('checks apprestrict is a required address', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          apprestrict: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('apprestrict')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          apprestrict: 'foo',
        })
      ).toThrow(
        new ValidationError('apprestrict should be an ethereum address')
      );
    });
    it('checks workerpoolrestrict is a required address', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          workerpoolrestrict: undefined,
        })
      ).toThrow(
        new ValidationError(getRequiredFieldMessage('workerpoolrestrict'))
      );
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          workerpoolrestrict: 'foo',
        })
      ).toThrow(
        new ValidationError('workerpoolrestrict should be an ethereum address')
      );
    });
    it('checks requesterrestrict is a required address', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          requesterrestrict: undefined,
        })
      ).toThrow(
        new ValidationError(getRequiredFieldMessage('requesterrestrict'))
      );
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          requesterrestrict: 'foo',
        })
      ).toThrow(
        new ValidationError('requesterrestrict should be an ethereum address')
      );
    });
    it('checks salt is a string', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          salt: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('salt')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          salt: 42,
        })
      ).toThrow(new ValidationError('salt should be a string'));
    });
    it('checks sign is a string', () => {
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          sign: undefined,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('sign')));
      expect(() =>
        grantedAccessSchema().validateSync({
          ...grantedAccess,
          sign: 42,
        })
      ).toThrow(new ValidationError('sign should be a string'));
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          grantedAccessSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('positiveNumberSchema()', () => {
  describe('validateSync()', () => {
    it('should accept non-negative numbers', () => {
      const schema = positiveNumberSchema().label('testNumber');
      const validNumber = 77;
      const result = schema.validateSync(validNumber);
      expect(result).toBe(validNumber);
    });

    it('should accept 0', () => {
      const schema = positiveNumberSchema().label('testNumber');
      const zero = 0;
      const result = schema.validateSync(zero);
      expect(result).toBe(zero);
    });

    it('should not accept negative numbers', () => {
      const schema = positiveNumberSchema().label('testNumber');
      const negativeNumber = -77;
      expect(() => schema.validateSync(negativeNumber)).toThrow();
    });

    it('should not accept non-number values', () => {
      const schema = positiveNumberSchema().label('testNumber');
      const nonNumber = 'not a number';
      expect(() => schema.validateSync(nonNumber)).toThrow();
    });
  });
});

describe('validateRecord', () => {
  it('should validate a valid record', () => {
    const validRecord = {
      1: 'test',
      2: 'another string',
      3: 'another string',
    };
    expect(() =>
      secretsSchema().label('validRecord').validateSync(validRecord)
    ).not.toThrow();
  });

  it('should throw an error for non-number keys', () => {
    const recordWithInvalidKey = {
      '1': 'test',
      2: 123,
      3: 'another string',
    };
    const IS_NOT_VALID_RECORD =
      'recordWithInvalidKey must be an object with numeric keys and string values';
    expect(() =>
      secretsSchema()
        .label('recordWithInvalidKey')
        .validateSync(recordWithInvalidKey)
    ).toThrow(IS_NOT_VALID_RECORD);
  });

  it('should throw an error for a non-string values', () => {
    const IS_NOT_VALID_RECORD =
      'recordWithInvalidValue must be an object with numeric keys and string values';
    const recordWithInvalidValue = {
      1: 'test',
      2: true,
      3: 'another string',
    };
    expect(() =>
      secretsSchema()
        .label('recordWithInvalidValue')
        .validateSync(recordWithInvalidValue)
    ).toThrow(IS_NOT_VALID_RECORD);
  });
});

describe('validateOrders', () => {
  it('should validate a valid datasetOrderbook', () => {
    expect(() =>
      validateOrders().label('dataset').validateSync(MOCK_DATASET_ORDER.orders)
    ).not.toThrow();
  });

  it('should throw an error for empty datasetOrderbook', () => {
    const EMPTY_DATESET_ERROR = 'No dataset orders found';
    expect(() =>
      validateOrders().label('dataset').validateSync(EMPTY_ORDER_BOOK.orders)
    ).toThrow(EMPTY_DATESET_ERROR);
  });

  it('should validate a valid appOrderbook', () => {
    expect(() =>
      validateOrders().label('app').validateSync(MOCK_APP_ORDER.orders)
    ).not.toThrow();
  });

  it('should throw an error for empty appOrderbook', () => {
    const EMPTY_APP_ERROR = 'No app orders found';
    expect(() =>
      validateOrders().label('app').validateSync(EMPTY_ORDER_BOOK.orders)
    ).toThrow(EMPTY_APP_ERROR);
  });

  it('should validate a valid workerpoolOrderbook', () => {
    expect(() =>
      validateOrders()
        .label('workerpool')
        .validateSync(MOCK_WORKERPOOL_ORDER.orders)
    ).not.toThrow();
  });

  it('should throw an error for empty workerpoolOrderbook', () => {
    const EMPTY_WORKERPOOL_ERROR = 'No workerpool orders found';
    expect(() =>
      validateOrders().label('workerpool').validateSync(EMPTY_ORDER_BOOK.orders)
    ).toThrow(EMPTY_WORKERPOOL_ERROR);
  });
});
