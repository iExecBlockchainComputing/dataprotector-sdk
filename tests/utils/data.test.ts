import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import fsPromises from 'fs/promises';
import path from 'path';
import { extractDataSchema } from '../../dist/utils/data';

describe('extractDataSchema()', () => {
  let data: any;
  let pngImage: any;
  let svgImage: any;

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

  describe('throw when', () => {
    it('the data contains an empty key', async () => {
      data[''] = 'this key is empty';
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported empty key')
      );
    });
    it('the data contains an unsupported character in a key', async () => {
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
    it('the data is an array', async () => {
      const invalidData: any = [0, 'one'];
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('the data is null', async () => {
      const invalidData: any = null;
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('the data is undefined', async () => {
      const invalidData: any = undefined;
      await expect(extractDataSchema(invalidData)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
    it('the data contains an array', async () => {
      data.invalid = ['foo', 'bar'];
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported array data')
      );
    });
    it('the data contains null', async () => {
      data.invalid = null;
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported null data')
      );
    });
    it('the data contains undefined', async () => {
      data.invalid = undefined;
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Unsupported undefined data')
      );
    });
    it('the data contains undetectable mime type', async () => {
      data.invalid = Buffer.from([0x01, 0x01, 0x01, 0x01]);
      await expect(extractDataSchema(data)).rejects.toThrow(
        Error('Failed to detect mime type')
      );
    });
  });
});
