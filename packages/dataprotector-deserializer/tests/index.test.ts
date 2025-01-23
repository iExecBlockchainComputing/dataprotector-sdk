import { writeFile } from 'fs/promises';
import {
  createZipFromObject as legacyCreateZipFromObject,
  extractDataSchema as legacyExtractDataSchema,
} from '@iexec/dataprotector/dist/utils/data.js'; // run `test:prepare` script before running this test file
import { describe, it, beforeAll, expect, beforeEach } from '@jest/globals';
import {
  createZipFromObject,
  extractDataSchema,
} from '../../sdk/dist/src/utils/data.js';
import { IExecDataProtectorDeserializer } from '../src/index.js';

describe('IExecDataProtectorDeserializer', () => {
  beforeEach(() => {
    // reset env
    delete process.env.IEXEC_IN;
    delete process.env.IEXEC_DATASET_FILENAME;
  });
  describe('constructor', () => {
    it('set default protectedDataPath with iexec envs', () => {
      process.env.IEXEC_IN = 'iexec_in';
      process.env.IEXEC_DATASET_FILENAME = 'dataset';
      const protectedDataDeserializer = new IExecDataProtectorDeserializer();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(protectedDataDeserializer['protectedDataPath']).toBe(
        'iexec_in/dataset'
      );
    });
    it('set default mode to "optimistic"', () => {
      const protectedDataDeserializer = new IExecDataProtectorDeserializer();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(protectedDataDeserializer['mode']).toBe('optimistic');
    });
  });
  describe('when used without protected data', () => {
    it('getValue() fails to load the data', async () => {
      // process.env.IEXEC_IN = 'iexec_in';
      const protectedDataDeserializer = new IExecDataProtectorDeserializer();
      await expect(
        protectedDataDeserializer.getValue('foo', 'string')
      ).rejects.toThrow(Error('Missing protected data'));
    });
  });
  describe('with a file that is not a protected data', () => {
    it('getValue() fails to load the data', async () => {
      const protectedDataDeserializer = new IExecDataProtectorDeserializer({
        protectedDataPath: 'tests/__inputs__/invalidProtectedData',
      });
      await expect(
        protectedDataDeserializer.getValue('foo', 'string')
      ).rejects.toThrow(Error('Failed to load protected data'));
    });
  });
  describe('with an invalid protected data file path', () => {
    it('getValue() fails to load the data', async () => {
      const protectedDataDeserializer = new IExecDataProtectorDeserializer({
        protectedDataPath: 'tests/__inputs__/do/not/exists',
      });
      await expect(
        protectedDataDeserializer.getValue('foo', 'string')
      ).rejects.toThrow(Error('Failed to load protected data'));
    });
  });
  describe('with a legacy protected data (@iexec/dataprotectector@0)', () => {
    const LEGACY_PROTECTED_DATA_PATH = 'tests/__inputs__/legacyProtectedData';
    const data = {
      booleanTrue: true,
      stringFoo: 'foo',
      number1234: 1234,
      binary: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      nested: {
        value: {
          boolean: false,
        },
      },
    };
    let schema: any;
    beforeAll(async () => {
      // create legacy protected data
      schema = await legacyExtractDataSchema(data);
      await writeFile(
        LEGACY_PROTECTED_DATA_PATH,
        await legacyCreateZipFromObject(data)
      );
    });
    it('getValue() deserializes nested values', async () => {
      const protectedDataDeserializer = new IExecDataProtectorDeserializer({
        protectedDataPath: LEGACY_PROTECTED_DATA_PATH,
      });
      expect(
        await protectedDataDeserializer.getValue(
          'nested.value.boolean',
          schema.nested.value.boolean
        )
      ).toBe(data.nested.value.boolean);
    });
    describe('in default "optimistic" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: LEGACY_PROTECTED_DATA_PATH,
        });
      });
      describe('getValue()', () => {
        it('deserializes "boolean" as boolean', async () => {
          expect(schema.booleanTrue).toBe('boolean');
          expect(
            await protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).toBe(data.booleanTrue);
        });
        it('deserializes "string" as string', async () => {
          expect(schema.stringFoo).toBe('string');
          expect(
            await protectedDataDeserializer.getValue(
              'stringFoo',
              schema.stringFoo
            )
          ).toBe(data.stringFoo);
        });
        it('deserializes "number" as number', async () => {
          expect(schema.number1234).toBe('number');
          expect(
            await protectedDataDeserializer.getValue(
              'number1234',
              schema.number1234
            )
          ).toBe(data.number1234);
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
    describe('in "legacy" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: LEGACY_PROTECTED_DATA_PATH,
          mode: 'legacy',
        });
      });
      describe('getValue()', () => {
        it('deserializes "boolean" as boolean', async () => {
          expect(schema.booleanTrue).toBe('boolean');
          expect(
            await protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).toBe(data.booleanTrue);
        });
        it('deserializes "string" as string', async () => {
          expect(schema.stringFoo).toBe('string');
          expect(
            await protectedDataDeserializer.getValue(
              'stringFoo',
              schema.stringFoo
            )
          ).toBe(data.stringFoo);
        });
        it('deserializes "number" as number', async () => {
          expect(schema.number1234).toBe('number');
          expect(
            await protectedDataDeserializer.getValue(
              'number1234',
              schema.number1234
            )
          ).toBe(data.number1234);
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
    describe('in "borsh" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: LEGACY_PROTECTED_DATA_PATH,
          mode: 'borsh',
        });
      });
      describe('getValue()', () => {
        it('does not support "boolean" schema', async () => {
          expect(schema.booleanTrue).toBe('boolean');
          await expect(
            protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).rejects.toThrow(
            Error('Unsupported schema "boolean" in "borsh" mode')
          );
        });
        it('fails to deserializes legacy "string"', async () => {
          expect(schema.stringFoo).toBe('string');
          await expect(
            protectedDataDeserializer.getValue('stringFoo', schema.stringFoo)
          ).rejects.toThrow(
            Error(
              'Failed to deserialize "stringFoo" as "string" in "borsh" mode'
            )
          );
        });
        it('does not support "number" schema', async () => {
          expect(schema.number1234).toBe('number');
          await expect(
            protectedDataDeserializer.getValue('number1234', schema.number1234)
          ).rejects.toThrow(
            Error('Unsupported schema "number" in "borsh" mode')
          );
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
  });
  describe('with a protected data (current)', () => {
    const BORSH_PROTECTED_DATA_PATH = 'tests/__inputs__/currentProtectedData';
    const data = {
      booleanTrue: true,
      stringFoo: 'foo',
      number1234: 1234,
      number1234Point56789: 1234.56789,
      bigint1234: BigInt(1234),
      binary: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      nested: {
        value: {
          boolean: false,
        },
      },
    };
    let schema: any;
    beforeAll(async () => {
      // create protected data
      schema = await extractDataSchema(data);
      await writeFile(
        BORSH_PROTECTED_DATA_PATH,
        await createZipFromObject(data)
      );
    });
    it('getValue() deserializes nested values', async () => {
      const protectedDataDeserializer = new IExecDataProtectorDeserializer({
        protectedDataPath: BORSH_PROTECTED_DATA_PATH,
      });
      expect(
        await protectedDataDeserializer.getValue(
          'nested.value.boolean',
          schema.nested.value.boolean
        )
      ).toBe(data.nested.value.boolean);
    });
    describe('in default "optimistic" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: BORSH_PROTECTED_DATA_PATH,
        });
      });
      describe('getValue()', () => {
        it('deserializes "bool" as boolean', async () => {
          expect(schema.booleanTrue).toBe('bool');
          expect(schema.booleanTrue).toBe('bool');
          expect(
            await protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).toBe(data.booleanTrue);
        });
        it('deserializes "string" as string', async () => {
          expect(schema.stringFoo).toBe('string');
          expect(
            await protectedDataDeserializer.getValue(
              'stringFoo',
              schema.stringFoo
            )
          ).toBe(data.stringFoo);
        });
        it('deserializes "i128" as bigint', async () => {
          expect(schema.bigint1234).toBe('i128');
          expect(
            await protectedDataDeserializer.getValue(
              'bigint1234',
              schema.bigint1234
            )
          ).toBe(BigInt(data.bigint1234));
        });
        it('deserializes "f64" as number', async () => {
          expect(schema.number1234Point56789).toBe('f64');
          expect(
            await protectedDataDeserializer.getValue(
              'number1234Point56789',
              schema.number1234Point56789
            )
          ).toBe(data.number1234Point56789);
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
    describe('in "borsh" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: BORSH_PROTECTED_DATA_PATH,
          mode: 'borsh',
        });
      });
      describe('getValue()', () => {
        it('deserializes "bool" as boolean', async () => {
          expect(schema.booleanTrue).toBe('bool');
          expect(
            await protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).toBe(data.booleanTrue);
        });
        it('deserializes "string" as string', async () => {
          expect(schema.stringFoo).toBe('string');
          expect(
            await protectedDataDeserializer.getValue(
              'stringFoo',
              schema.stringFoo
            )
          ).toBe(data.stringFoo);
        });
        it('deserializes "i128" as bigint', async () => {
          expect(schema.bigint1234).toBe('i128');
          expect(
            await protectedDataDeserializer.getValue(
              'bigint1234',
              schema.bigint1234
            )
          ).toBe(BigInt(data.bigint1234));
        });
        it('deserializes "f64" as number', async () => {
          expect(schema.number1234Point56789).toBe('f64');
          expect(
            await protectedDataDeserializer.getValue(
              'number1234Point56789',
              schema.number1234Point56789
            )
          ).toBe(data.number1234Point56789);
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
    describe('in "legacy" mode', () => {
      let protectedDataDeserializer: IExecDataProtectorDeserializer;
      beforeAll(async () => {
        protectedDataDeserializer = new IExecDataProtectorDeserializer({
          protectedDataPath: BORSH_PROTECTED_DATA_PATH,
          mode: 'legacy',
        });
      });
      describe('getValue()', () => {
        it('does not support "bool" schema', async () => {
          expect(schema.booleanTrue).toBe('bool');
          await expect(
            protectedDataDeserializer.getValue(
              'booleanTrue',
              schema.booleanTrue
            )
          ).rejects.toThrow(
            Error('Unsupported schema "bool" in "legacy" mode')
          );
        });
        it('deserializes borsh "string" with bad prefix char (leading 4 bytes string length encoding)', async () => {
          expect(schema.stringFoo).toBe('string');
          const deserialized = (await protectedDataDeserializer.getValue(
            'stringFoo',
            schema.stringFoo
          )) as any;
          expect(deserialized).toBe(
            Buffer.from([data.stringFoo.length, 0, 0, 0]).toString('utf-8') + // borsh string length
              data.stringFoo
          );
        });
        it('does not support "i128" schema', async () => {
          expect(schema.bigint1234).toBe('i128');
          await expect(
            protectedDataDeserializer.getValue('bigint1234', schema.bigint1234)
          ).rejects.toThrow(
            Error('Unsupported schema "i128" in "legacy" mode')
          );
        });
        it('does not support "f64" schema', async () => {
          expect(schema.number1234Point56789).toBe('f64');
          await expect(
            protectedDataDeserializer.getValue(
              'number1234Point56789',
              schema.number1234Point56789
            )
          ).rejects.toThrow(Error('Unsupported schema "f64" in "legacy" mode'));
        });
        it('deserializes "binary" as Uint8Array', async () => {
          expect(schema.binary).toBe('application/octet-stream');
          const deserialized = await protectedDataDeserializer.getValue(
            'binary',
            schema.binary
          );
          expect(deserialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toStrictEqual(data.binary);
        });
      });
    });
  });
});
