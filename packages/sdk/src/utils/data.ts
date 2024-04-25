import { serialize } from 'borsh';
import JSZip from 'jszip';
import { filetypeinfo } from 'magic-bytes.js';
import {
  DataObject,
  DataSchema,
  DataSchemaEntryType,
  MimeType,
  ScalarType,
} from '../lib/types/index.js';

const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;

const SUPPORTED_TYPES: ScalarType[] = ['bool', 'i128', 'f64', 'string'];

const MIN_I128 = BigInt('-170141183460469231731687303715884105728');
const MAX_I128 = BigInt('170141183460469231731687303715884105728');

const SUPPORTED_MIME_TYPES: MimeType[] = [
  'application/octet-stream', // fallback
  'application/pdf',
  'application/xml',
  'application/zip',
  // 'audio/x-flac', // not implemented
  'audio/midi',
  'audio/mpeg',
  // 'audio/ogg', // https://github.com/LarsKoelpin/magic-bytes/pull/38
  // 'audio/weba', // not implemented
  'audio/x-wav',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  // 'image/svg+xml', // not implemented
  'image/webp',
  'video/mp4',
  'video/mpeg',
  // 'video/ogg', // https://github.com/LarsKoelpin/magic-bytes/pull/38
  // 'video/quicktime', // https://github.com/LarsKoelpin/magic-bytes/pull/39
  // 'video/webm', // not implemented
  'video/x-msvideo',
];

const supportedDataEntryTypes = new Set<DataSchemaEntryType>([
  ...SUPPORTED_TYPES,
  ...SUPPORTED_MIME_TYPES,
]);

const ensureKeyIsValid = (key: string) => {
  if (key === '') {
    throw Error(`Unsupported empty key`);
  }
  if (!ALLOWED_KEY_NAMES_REGEXP.test(key)) {
    throw Error(`Unsupported special character in key`);
  }
};

export const ensureDataObjectIsValid = (data: DataObject) => {
  if (data === undefined) {
    throw Error(`Unsupported undefined data`);
  }
  if (data === null) {
    throw Error(`Unsupported null data`);
  }
  if (Array.isArray(data)) {
    throw Error(`Unsupported array data`);
  }
  for (const key in data) {
    ensureKeyIsValid(key);
    const value = data[key];
    const typeOfValue = typeof value;
    if (
      value instanceof Uint8Array ||
      value instanceof ArrayBuffer ||
      typeOfValue === 'boolean' ||
      typeOfValue === 'string' ||
      typeOfValue === 'bigint' ||
      typeOfValue === 'number'
    ) {
      // valid scalar
    } else if (typeOfValue === 'object') {
      // nested object
      const nestedDataObject = value as DataObject;
      ensureDataObjectIsValid(nestedDataObject);
    } else {
      throw Error(`Unsupported ${typeOfValue} data`);
    }
  }
};

export const ensureDataSchemaIsValid = (schema: DataSchema) => {
  if (schema === undefined) {
    throw Error(`Unsupported undefined schema`);
  }
  if (schema === null) {
    throw Error(`Unsupported null schema`);
  }
  if (Array.isArray(schema)) {
    throw Error(`Unsupported array schema`);
  }
  for (const key in schema) {
    ensureKeyIsValid(key);
    const value = schema[key];
    if (typeof value === 'object') {
      ensureDataSchemaIsValid(value);
    } else if (!supportedDataEntryTypes.has(value)) {
      throw Error(`Unsupported type "${value}" in schema`);
    }
  }
};

export const extractDataSchema = async (
  data: DataObject
): Promise<DataSchema> => {
  const schema: DataSchema = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const typeOfValue = typeof value;
      if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        let guessedTypes: Array<{
          mime?: string;
          extension?: string;
          typename: string;
        }> = [];
        if (value instanceof Uint8Array) {
          guessedTypes = filetypeinfo(value);
        } else {
          guessedTypes = filetypeinfo(new Uint8Array(value));
        }
        // use first supported mime type
        const [mime] = guessedTypes.reduce((acc, curr) => {
          if (supportedDataEntryTypes.has(curr.mime as any)) {
            return [...acc, curr.mime as MimeType];
          }
          return acc;
        }, []);
        // or fallback to 'application/octet-stream'
        schema[key] = mime || 'application/octet-stream';
      } else if (typeOfValue === 'boolean') {
        schema[key] = 'bool';
      } else if (typeOfValue === 'string') {
        schema[key] = 'string';
      } else if (typeOfValue === 'number') {
        schema[key] = 'f64';
      } else if (typeOfValue === 'bigint') {
        schema[key] = 'i128';
      } else if (typeOfValue === 'object') {
        const nestedDataObject = value as DataObject;
        const nestedSchema = await extractDataSchema(nestedDataObject);
        schema[key] = nestedSchema;
      }
    }
  }
  return schema;
};

export const createArrayBufferFromFile = async (
  file: File
): Promise<Uint8Array> => {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      fileReader.abort();
      reject(new DOMException('Error parsing input file.'));
    };
    fileReader.onload = () => {
      resolve(fileReader.result as Uint8Array);
    };
    fileReader.readAsArrayBuffer(file);
  });
};

export const createZipFromObject = (obj: unknown): Promise<Uint8Array> => {
  const zip = new JSZip();
  const promises: Array<Promise<void>> = [];

  const createFileOrDirectory = (
    key: string,
    value: unknown,
    path: string
  ): void => {
    const fullPath = path ? `${path}/${key}` : key;

    if (
      typeof value === 'object' &&
      !(value instanceof Uint8Array) &&
      !(value instanceof ArrayBuffer)
    ) {
      zip.folder(fullPath);
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        createFileOrDirectory(nestedKey, nestedValue, fullPath);
      }
    } else {
      let content: Uint8Array | ArrayBuffer;
      if (typeof value === 'bigint') {
        if (value > MAX_I128 || value < MIN_I128) {
          promises.push(
            Promise.reject(
              Error(`Unsupported integer value: out of i128 range`)
            )
          );
        }
        content = serialize('i128', value, true);
      } else if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          promises.push(
            Promise.reject(Error(`Unsupported number value: infinity`))
          );
        }
        // floats serializes as f64
        content = serialize('f64', value, true);
      } else if (typeof value === 'boolean') {
        content = serialize('bool', value, true);
      } else if (typeof value === 'string') {
        content = serialize('string', value, true);
      } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        content = value;
      } else {
        promises.push(Promise.reject(Error('Unexpected data format')));
      }
      promises.push(
        zip
          .file(fullPath, content)
          .generateAsync({ type: 'uint8array' })
          .then(() => {})
      );
    }
  };

  for (const [key, value] of Object.entries(obj)) {
    createFileOrDirectory(key, value, '');
  }

  return Promise.all(promises).then(() =>
    zip.generateAsync({ type: 'uint8array' })
  );
};

export const reverseSafeSchema = function (
  schema?: Array<Record<'id', string>>
) {
  if (!schema) {
    return {};
  }
  return schema.reduce((propsAndTypes, { id: propPathColonType }) => {
    // { id: 'nested.something:string' }
    const [key, value] = propPathColonType.split(':');
    // key = 'nested.something'
    // value = 'string'
    if (key.includes('.')) {
      const firstKey = key.split('.')[0];
      // firstKey = 'nested'
      const restOfKey = key.split('.').slice(1).join('.');
      // restOfKey = 'something'
      const withValue = `${restOfKey}:${value}`;
      // withValue = 'something:string'
      propsAndTypes[firstKey] = reverseSafeSchema([
        {
          id: withValue,
        },
      ]);
    } else {
      propsAndTypes[key] = value;
    }
    return propsAndTypes;
  }, {});
};

export const toHex = (value: number): string => {
  return '0x' + value.toString(16);
};
