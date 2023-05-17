import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import fsPromises from 'fs/promises';
import path from 'path';
import {
  ensureDataObjectIsValid,
  ensureDataSchemaIsValid,
  extractDataSchema,
  createZipFromObject,
  transformGraphQLResponse,
} from '../../../dist/utils/data';
import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';
import { GraphQLResponse } from '../../../dist/dataProtector/types';

const uint8ArraysAreEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((val, i) => val === b[i]);
};

let data: any;
let pngImage: Uint8Array;
let svgImage: Uint8Array;

beforeAll(async () => {
  // load some real data
  pngImage = await fsPromises.readFile(
    path.join(process.cwd(), 'tests', '_test_inputs_', 'unicorn.png')
  );
  svgImage = await fsPromises.readFile(
    path.join(process.cwd(), 'tests', '_test_inputs_', 'rlc.svg')
  );
});

beforeEach(async () => {
  // create a data for the test
  data = {
    numberZero: 0,
    numberOne: 1,
    numberMinusOne: -1,
    booleanTrue: true,
    booleanFalse: false,
    string: 'hello world!',
    nested: {
      object: {
        with: {
          binary: {
            data: {
              pngImage,
              svgImage,
            },
          },
        },
      },
    },
  };
});

describe('ensureDataObjectIsValid()', () => {
  it('allow any key names with alphanumeric chars plus "-" and "_"', async () => {
    expect(
      ensureDataObjectIsValid({
        ...data,
        'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_':
          'value',
      })
    ).toBeUndefined();
  });

  describe('throw when the data', () => {
    it('is an array', async () => {
      const invalidData: any = [0, 'one'];
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported array data')
      );
    });
    it('is null', async () => {
      const invalidData: any = null;
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported null data')
      );
    });
    it('is undefined', async () => {
      const invalidData: any = undefined;
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported undefined data')
      );
    });
  });

  describe('throw when the data keys', () => {
    it('contains an empty key', async () => {
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '': 'this key is empty',
        })
      ).toThrow(Error('Unsupported empty key'));
    });
    it('contains an unsupported character', async () => {
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          money$: 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '.': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          'foo bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          'foo\\bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '\n': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the data values', () => {
    it('contains an array', async () => {
      data.invalid = ['foo', 'bar'];
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported array data')
      );
    });
    it('contains null', async () => {
      data.invalid = null;
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported null data')
      );
    });
    it('contains undefined', async () => {
      data.invalid = undefined;
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported undefined data')
      );
    });
  });
});

describe('extractDataSchema()', () => {
  it('extracts the DataSchema', async () => {
    const dataSchema: any = await extractDataSchema(data);
    expect(dataSchema).toBeInstanceOf(Object);
    expect(dataSchema.numberZero).toBe('number');
    expect(dataSchema.numberOne).toBe('number');
    expect(dataSchema.numberMinusOne).toBe('number');
    expect(dataSchema.booleanTrue).toBe('boolean');
    expect(dataSchema.booleanFalse).toBe('boolean');
    expect(dataSchema.string).toBe('string');
    expect(dataSchema.nested.object.with.binary.data.pngImage).toBe(
      'image/png'
    );
    expect(dataSchema.nested.object.with.binary.data.svgImage).toBe(
      'application/xml'
    );
  });

  it('throw when the function fails to detect mime type', async () => {
    data.invalid = Buffer.from([0x01, 0x01, 0x01, 0x01]);
    await expect(extractDataSchema(data)).rejects.toThrow(
      Error('Failed to detect mime type')
    );
  });
});

describe('createZipFromObject()', () => {
  it('creates a zip file', async () => {
    const zipFile: any = await createZipFromObject(data);
    expect(zipFile).toBeInstanceOf(Uint8Array);
    const fileType = await fileTypeFromBuffer(zipFile);
    expect(fileType?.mime).toBe('application/zip');
  });

  it('puts each leave in a dedicated file and each sub-object in a dedicated folder', async () => {
    const zipFile: any = await createZipFromObject(data);
    const zip = await new JSZip().loadAsync(zipFile);
    expect(Object.keys(zip.files)).toStrictEqual([
      'numberZero',
      'numberOne',
      'numberMinusOne',
      'booleanTrue',
      'booleanFalse',
      'string',
      'nested/',
      'nested/object/',
      'nested/object/with/',
      'nested/object/with/binary/',
      'nested/object/with/binary/data/',
      'nested/object/with/binary/data/pngImage',
      'nested/object/with/binary/data/svgImage',
    ]);
  });

  it('serializes boolean `false` as single byte file with value 0', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('booleanFalse')?.async('uint8array');
    expect(uint8ArraysAreEqual(content, new Uint8Array([0]))).toBe(true);
  });

  it('serializes boolean `true` as single byte file with value 1', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('booleanTrue')?.async('uint8array');
    expect(uint8ArraysAreEqual(content, new Uint8Array([1]))).toBe(true);
  });

  it('serializes string as utf8 encoded file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('string')?.async('uint8array');
    expect(uint8ArraysAreEqual(content, Buffer.from(data.string, 'utf8'))).toBe(
      true
    );
  });

  it('serializes number as utf8 encoded file with stringified value', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const numberZeroContent = await zip.file('numberZero')?.async('uint8array');
    expect(
      uint8ArraysAreEqual(
        numberZeroContent,
        Buffer.from(data.numberZero.toString(), 'utf8')
      )
    ).toBe(true);
    const numberOneContent = await zip.file('numberOne')?.async('uint8array');
    expect(
      uint8ArraysAreEqual(
        numberOneContent,
        Buffer.from(data.numberOne.toString(), 'utf8')
      )
    ).toBe(true);
    const numberMinusOneContent = await zip
      .file('numberMinusOne')
      ?.async('uint8array');
    expect(
      uint8ArraysAreEqual(
        numberMinusOneContent,
        Buffer.from(data.numberMinusOne.toString(), 'utf8')
      )
    ).toBe(true);
  });

  it('serializes binary data as binary file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const pngImageContent = await zip
      .file('nested/object/with/binary/data/pngImage')
      ?.async('uint8array');
    expect(uint8ArraysAreEqual(pngImageContent, pngImage)).toBe(true);
    const svgImageContent = await zip
      .file('nested/object/with/binary/data/svgImage')
      ?.async('uint8array');
    expect(uint8ArraysAreEqual(svgImageContent, svgImage)).toBe(true);
  });

  describe('throw when the data values', () => {
    it('contains float number', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: 1.1 })
      ).rejects.toThrow(Error('Unsupported non safe integer number'));
    });
    it('contains non finite number', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: Infinity })
      ).rejects.toThrow(Error('Unsupported non safe integer number'));
    });
    it('contains integer out of safe integer bound', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: Number.MAX_SAFE_INTEGER + 1 })
      ).rejects.toThrow(Error('Unsupported non safe integer number'));
    });
  });
});

describe('ensureDataSchemaIsValid()', () => {
  let schema: any;
  beforeEach(() => {
    schema = {
      numberZero: 'number',
      booleanTrue: 'boolean',
      string: 'string',
      nested: {
        object: {
          with: {
            binary: {
              data: {
                pngImage: 'image/png',
                svgImage: 'application/xml',
              },
            },
          },
        },
      },
    };
  });

  it('allow any key names with alphanumeric chars plus "-" and "_"', async () => {
    expect(
      ensureDataSchemaIsValid({
        ...schema,
        'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_':
          'string',
      })
    ).toBeUndefined();
  });

  describe('throw when a nested type is not supported', () => {
    const invalidSchema: any = { foo: { bar: { baz: 42 } } };
    expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
      Error('Unsupported type "42" in schema')
    );
  });

  describe('throw when the schema', () => {
    it('is an array', async () => {
      const invalidSchema: any = [0, 'one'];
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported array schema')
      );
    });
    it('is null', async () => {
      const invalidSchema: any = null;
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported null schema')
      );
    });
    it('is undefined', async () => {
      const invalidSchema: any = undefined;
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported undefined schema')
      );
    });
  });

  describe('throw when the schema keys', () => {
    it('contains an empty key', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '': 'this key is empty',
        })
      ).toThrow(Error('Unsupported empty key'));
    });
    it('contains an unsupported character', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          money$: 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '.': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          'foo bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          'foo\\bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '\n': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the schema type', () => {
    it('contains null', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          nullType: null,
        })
      ).toThrow(Error('Unsupported null schema'));
    });
    it('contains undefined', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          undefinedType: undefined,
        })
      ).toThrow(Error('Unsupported type "undefined" in schema'));
    });
    it('contains array', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          arrayOfTypes: ['boolean', 'string'],
        })
      ).toThrow(Error('Unsupported array schema'));
    });
    it('contains unknown type', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          unknownType: 'foo',
        })
      ).toThrow(Error('Unsupported type "foo" in schema'));
    });
  });
});

describe('transformGraphQLResponse', () => {
  it('should correctly transform the response', () => {
    const mockResponse: GraphQLResponse = {
      protectedDatas: [
        {
          id: '0x123',
          name: 'Test Name',
          owner: { id: '456' },
          jsonSchema: JSON.stringify({ key: 'value' }),
          creationTimestamp: 1620586908,
        },
      ],
    };

    const expectedResult = [
      {
        name: 'Test Name',
        address: '0x123',
        owner: '456',
        schema: { key: 'value' },
        creationTimestamp: 1620586908,
      },
    ];

    expect(transformGraphQLResponse(mockResponse)).toEqual(expectedResult);
  });

  it('should return an empty array when input is invalid', () => {
    const mockResponse: any = {
      protectedDatas: [
        {
          id: '0x123',
          name: 'Test Name',
          owner: { id: '456' },
          jsonSchema: 'invalid JSON string', // This will force JSON.parse to throw an error
          creationTimestamp: 1620586908,
        },
      ],
    };

    expect(transformGraphQLResponse(mockResponse)).toEqual([]);
  });
});
