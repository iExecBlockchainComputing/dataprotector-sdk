import { filetypeinfo } from 'magic-bytes.js';
import JSZip from 'jszip';
import {
  DataObject,
  DataSchema,
  DataSchemaEntryType,
  GraphQLResponse,
  ProtectedData,
  MimeType,
} from '../dataProtector/types.js';

const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;

const SUPPORTED_TYPES = ['boolean', 'number', 'string'];

const SUPPORTED_MIME_TYPES: MimeType[] = [
  'application/gzip',
  'application/java-archive',
  'application/msword',
  'application/octet-stream',
  'application/pdf',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/x-bzip2',
  'application/x-photoshop',
  'application/x-shockwave-flash',
  'application/xml',
  'application/zip',
  'audio/midi',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/x-aiff',
  'audio/x-wav',
  'image/apng',
  'image/bmp',
  'image/gif',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
  'image/x-icon',
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'video/x-msvideo',
];

const supportedDataEntryTypes = new Set([
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
    } else {
      if (!supportedDataEntryTypes.has(value)) {
        throw Error(`Unsupported type "${value}" in schema`);
      }
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
        // use first type with mime
        const mime = guessedTypes.find((type) => type.mime)?.mime;
        if (!mime) {
          // TODO we may want to fallback to 'application/octet-stream'
          throw new Error('Failed to detect mime type');
        }
        schema[key] = mime as DataSchemaEntryType;
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

    if (typeof value === 'object' && !(value instanceof Uint8Array)) {
      zip.folder(fullPath);
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        createFileOrDirectory(nestedKey, nestedValue, fullPath);
      }
    } else {
      let content: string | Uint8Array;
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
      } else if (typeof value === 'string' || value instanceof Uint8Array) {
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

export const transformGraphQLResponse = (
  response: GraphQLResponse
): ProtectedData[] => {
  const protectedDataArray = response.protectedDatas
    .map((protectedData) => {
      try {
        const schema = JSON.parse(protectedData.jsonSchema);
        return {
          name: protectedData.name,
          address: protectedData.id,
          owner: protectedData.owner.id,
          schema: schema,
          creationTimestamp: parseInt(protectedData.creationTimestamp),
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
  return protectedDataArray;
};
