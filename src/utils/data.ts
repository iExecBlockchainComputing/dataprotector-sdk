import JSZip from 'jszip';
import { filetypeinfo } from 'magic-bytes.js';
import {
  DataObject,
  DataSchema,
  DataSchemaEntryType,
  GraphQLResponse,
  ProtectedData,
  MimeType,
  ScalarType,
} from '../dataProtector/types.js';

const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;

const SUPPORTED_TYPES: ScalarType[] = ['boolean', 'number', 'string'];

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
      typeOfValue === 'boolean' ||
      typeOfValue === 'string' ||
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
      if (value instanceof Uint8Array) {
        const guessedTypes = filetypeinfo(value);
        // use first supported mime type
        const [mime] = guessedTypes.reduce((acc, curr) => {
          if (supportedDataEntryTypes.has(curr.mime as any)) {
            return [...acc, curr.mime as MimeType];
          }
          return acc;
        }, []);
        // or fallback to 'application/octet-stream'
        schema[key] = mime || 'application/octet-stream';
      } else if (
        typeOfValue === 'boolean' ||
        typeOfValue === 'number' ||
        typeOfValue === 'string'
      ) {
        schema[key] = typeOfValue;
      } else if (typeOfValue === 'object') {
        const nestedDataObject = value as DataObject;
        const nestedSchema = await extractDataSchema(nestedDataObject);
        schema[key] = nestedSchema;
      }
    }
  }
  return schema;
};

export const createZipFromObject = (obj: unknown): Promise<Uint8Array> => {
  const zip = new JSZip();
  const promises: Promise<void>[] = [];

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
      let content: string | Uint8Array | ArrayBuffer | any;
      if (typeof value === 'number') {
        // only safe integers are supported to avoid precision loss
        if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
          promises.push(
            Promise.reject(Error(`Unsupported non safe integer number`))
          );
        }
        content = value.toString();
      } else if (typeof value === 'boolean') {
        content = value ? new Uint8Array([1]) : new Uint8Array([0]);
      } else {
        content = value;
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
  schema: Array<Record<'id', string>>
) {
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

export const transformGraphQLResponse = (
  response: GraphQLResponse
): ProtectedData[] => {
  return response.protectedDatas
    .map((protectedData) => {
      try {
        const schema = reverseSafeSchema(protectedData.schema);
        return {
          name: protectedData.name,
          address: protectedData.id,
          owner: protectedData.owner.id,
          schema,
          creationTimestamp: parseInt(protectedData.creationTimestamp),
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
};
