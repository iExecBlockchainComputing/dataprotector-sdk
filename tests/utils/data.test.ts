import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import fsPromises from 'fs/promises';
import path from 'path';
import { extractDataSchema, createZipFromObject } from '../../dist/utils/data';
import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';

const uint8ArraysAreEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((val, i) => val === b[i]);
};

describe('extractDataSchema()', () => {
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
      foo: 1,
      bar: true,
      baz: {
        foo: {
          bar: {
            baz: {
              pngImage,
              svgImage,
            },
          },
        },
      },
    };
  });

  it('extracts the DataSchema', async () => {
    const dataSchema: any = await extractDataSchema(data);
    expect(dataSchema).toBeInstanceOf(Object);
    expect(dataSchema.foo).toBe('number');
    expect(dataSchema.bar).toBe('boolean');
    expect(dataSchema.baz.foo.bar.baz.pngImage).toBe('image/png');
    expect(dataSchema.baz.foo.bar.baz.svgImage).toBe('application/xml');
  });
  it('allow key names with alphanumeric chars plus "-" and "_"', async () => {
    const key =
      'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_';
    const dataSchema: any = await extractDataSchema({
      [key]: 'value',
    });
    expect(dataSchema).toBeInstanceOf(Object);
    expect(dataSchema[key]).toBe('string');
  });

  describe('throw when the data', () => {
    it('is an array', async () => {
      const invalidData: any = [0, 'one'];
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('is null', async () => {
      const invalidData: any = null;
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('is undefined', async () => {
      const invalidData: any = undefined;
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
  });

  describe('throw when the data keys', () => {
    it('contains an empty key', async () => {
      data[''] = 'this key is empty';
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported empty key')
      );
    });
    it('contains an unsupported character', async () => {
      await expect(
        extractDataSchema({
          money$: 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        extractDataSchema({
          '.': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        extractDataSchema({
          'foo bar': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        extractDataSchema({
          'foo\\bar': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        extractDataSchema({
          '\n': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the data values', () => {
    it('contains an array', async () => {
      data.invalid = ['foo', 'bar'];
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('contains null', async () => {
      data.invalid = null;
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('contains undefined', async () => {
      data.invalid = undefined;
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
    it('contains undetectable mime type', async () => {
      data.invalid = Buffer.from([0x01, 0x01, 0x01, 0x01]);
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Failed to detect mime type')
      );
    });
  });
});

describe('createZipFromObject()', () => {
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

  it('allow key names with alphanumeric chars plus "-" and "_"', async () => {
    const key =
      'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_';
    const zipFile: any = await createZipFromObject({
      [key]: 'value',
    });
    expect(zipFile).toBeInstanceOf(Uint8Array);
    const fileType = await fileTypeFromBuffer(zipFile);
    expect(fileType?.mime).toBe('application/zip');
  });

  describe('throw when the data', () => {
    it('is an array', async () => {
      const invalidData: any = [0, 'one'];
      await expect(createZipFromObject(invalidData)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('is null', async () => {
      const invalidData: any = null;
      await expect(createZipFromObject(invalidData)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('is undefined', async () => {
      const invalidData: any = undefined;
      await expect(createZipFromObject(invalidData)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
  });

  describe('throw when the data keys', () => {
    it('contains an empty key', async () => {
      data[''] = 'this key is empty';
      await expect(createZipFromObject(data)).rejects.toThrow(
        Error('Unsupported empty key')
      );
    });
    it('contains an unsupported character', async () => {
      await expect(
        createZipFromObject({
          money$: 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        createZipFromObject({
          '.': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        createZipFromObject({
          'foo bar': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        createZipFromObject({
          'foo\\bar': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
      await expect(
        createZipFromObject({
          '\n': 'this key include an unsupported char',
        })
      ).rejects.toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the data values', () => {
    it('contains an array', async () => {
      data.invalid = ['foo', 'bar'];
      await expect(createZipFromObject(data)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('contains null', async () => {
      data.invalid = null;
      await expect(createZipFromObject(data)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('contains undefined', async () => {
      data.invalid = undefined;
      await expect(createZipFromObject(data)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
    it('contains float number', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: 1.1 })
      ).rejects.toThrow(Error('Unsupported number value'));
    });
    it('contains non finite number', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: Infinity })
      ).rejects.toThrow(Error('Unsupported number value'));
    });
    it('contains integer out of safe integer bound', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: Number.MAX_SAFE_INTEGER + 1 })
      ).rejects.toThrow(Error('Unsupported number value'));
    });
  });
});
