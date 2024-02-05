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

/**
 * Helper class to deserialize a protected data in trusted dapp
 */
class IExecProtectedDataConsumer {
  private zipPromise: Promise<JSZip>;

  private mode: 'optimistic' | 'legacy' | 'borsh';

  constructor(
    protectedDataPath: string = join(
      process.env.IEXEC_IN,
      process.env.IEXEC_IN
    ),
    mode: 'optimistic' | 'legacy' | 'borsh' = 'optimistic'
  ) {
    this.mode = mode;
    this.zipPromise = readFile(protectedDataPath).then((buffer) => {
      return new JSZip().loadAsync(buffer);
    });
    this.zipPromise.catch(() => {
      /* prevents unhandled promise rejection */
    });
  }

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
          return deserialize(schema, serialized) as any;
        } catch (e) {
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      case 'string':
        try {
          if (this.mode === 'legacy') {
            return Buffer.from(serialized).toString('utf8') as any;
          }
          try {
            // try borsh deserialization first
            return deserialize(schema, serialized) as any;
          } catch (e) {
            if (this.mode === 'optimistic') {
              // fallback to legacy
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
          return deserialize('bool', serialized) as any;
        } catch (e) {
          // avoid sensitive information leakage in error
          throw Error(
            `Failed to deserialize "${path}" as "${schema}" in "${this.mode}" mode`
          );
        }
      default:
        // everything else should be binary data
        return serialized as any;
    }
  }
}

export { IExecProtectedDataConsumer };
