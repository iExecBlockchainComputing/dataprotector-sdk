import { readFile } from 'fs/promises';
import { join } from 'path';
import { deserialize } from 'borsh';
import JSZip from 'jszip';

type BooleanSchemaFilter<T> = T extends 'bool' | 'boolean' ? boolean : never;
type NumberSchemaFilter<T> = T extends 'f64' | 'number' ? number : never;
type BigintSchemaFilter<T> = T extends 'i128' ? bigint : never;
type StringSchemaFilter<T> = T extends 'string' ? string : never;
type BinarySchemaFilter<T> = T extends
  | 'bool'
  | 'boolean'
  | 'f64'
  | 'number'
  | 'i128'
  | 'string'
  ? never
  : Uint8Array;

type Mode = 'optimistic' | 'legacy' | 'borsh';

/**
 * Helper class to deserialize a protected data in trusted dapp
 *
 * Usage:
 *
 * ```js
 * const dataprotectorDeserializer = new IExecDataProtectorDeserializer();
 *
 * const value1 = await dataprotectorDeserializer.getValue("path.to.value1", "bool");
 * const value2 = await dataprotectorDeserializer.getValue("path.to.value2", "string");
 * ```
 *
 * Options:
 *
 * - `mode`: specify the deserialization mode (default `"optimistic"`)
 *   - `"borsh"` for current protected data
 *   - `"legacy"` for protected data created with `@iexec/dataprotector@0`
 *   - `"optimistic"` try both
 * - `protectedDataPath`: overrides the dataset path, by default use the standard dataset path provided in the iExec worker runtime
 */
class IExecDataProtectorDeserializer {
  private protectedDataPath?: string;

  private mode: Mode;

  private zipPromise?: Promise<JSZip>;

  constructor(options?: { mode?: Mode; protectedDataPath?: string }) {
    this.mode = options?.mode || 'optimistic';
    if (options?.protectedDataPath) {
      this.protectedDataPath = options?.protectedDataPath;
    } else if (process.env.IEXEC_DATASET_FILENAME && process.env.IEXEC_IN) {
      this.protectedDataPath = join(
        process.env.IEXEC_IN,
        process.env.IEXEC_DATASET_FILENAME
      );
    }

    if (this.protectedDataPath) {
      this.zipPromise = readFile(this.protectedDataPath).then((buffer) => {
        return new JSZip().loadAsync(buffer);
      });
      this.zipPromise.catch(() => {
        /* prevents unhandled promise rejection */
      });
    }
  }

  /**
   * Deserializes the value at a given `path` with the value `schema`
   *
   * Params:
   *
   * - `path`: path to the desired value in the data object
   * - `schema`: schema of the desired data (see list )
   *
   * | schema | deserializes to |
   * | ---|---|
   * | `"bool"` | `boolean` |
   * | `"f64"` | `number` |
   * | `"i128"` | `bigint` |
   * | `"string"` | `string` |
   * | `"boolean"` (legacy schema) | `boolean` |
   * | `"number"` (legacy schema) | `number` |
   * | any other value | `Uint8Array` |
   *
   * Usage:
   *
   * ```js
   * const value = await dataprotectorDeserializer.getValue("path.to.string.value", "string");
   * ```
   */
  async getValue<T extends string>(
    path: string,
    schema: T
  ): Promise<
    | BooleanSchemaFilter<T>
    | NumberSchemaFilter<T>
    | BigintSchemaFilter<T>
    | StringSchemaFilter<T>
    | BinarySchemaFilter<T>
  > {
    if (this.zipPromise === undefined) {
      throw Error('Missing protected data');
    }
    const zip = await this.zipPromise.catch(() => {
      throw Error('Failed to load protected data');
    });
    const serialized = await zip
      .file(path.split('.').join('/'))
      ?.async('uint8array');
    if (!serialized) {
      throw Error(`Failed to load path ${path}`);
    }
    switch (schema) {
      case 'bool':
      case 'i128':
      case 'f64':
        if (this.mode === 'legacy') {
          throw Error(`Unsupported schema "${schema}" in "${this.mode}" mode`);
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return deserialize(schema, serialized) as any;
        } catch (e) {
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      case 'string':
        try {
          if (this.mode === 'legacy') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Buffer.from(serialized).toString('utf8') as any;
          }
          try {
            // try borsh deserialization first
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return deserialize(schema, serialized) as any;
          } catch (e) {
            if (this.mode === 'optimistic') {
              // fallback to legacy
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return Buffer.from(serialized).toString('utf8') as any;
            }
            throw e;
          }
        } catch (e) {
          // avoid sensitive information leakage in error
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      case 'number':
        if (this.mode === 'borsh') {
          throw Error(`Unsupported schema "${schema}" in "${this.mode}" mode`);
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return Number(Buffer.from(serialized).toString()) as any;
        } catch (e) {
          // avoid sensitive information leakage in error
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      case 'boolean':
        if (this.mode === 'borsh') {
          throw Error(`Unsupported schema "${schema}" in "${this.mode}" mode`);
        }
        try {
          // legacy serialization spec for 'boolean' matches borsh spec 'bool'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return deserialize('bool', serialized) as any;
        } catch (e) {
          // avoid sensitive information leakage in error
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      default:
        // everything else should be binary data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return serialized as any;
    }
  }
}

export { IExecDataProtectorDeserializer };
