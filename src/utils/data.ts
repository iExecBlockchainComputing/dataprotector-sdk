import { fileTypeFromBuffer, MimeType } from 'file-type';
import { supportedMimeTypes } from 'file-type/core'; // not exported in default browser export
import JSZip from 'jszip';
import {
  DataObject,
  DataSchema,
  GraphQLResponse,
  ProtectedData,
} from '../dataProtector/types.js';

const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;

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

const SUPPORTED_TYPES = ['boolean', 'number', 'string'];

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
      if (
        !SUPPORTED_TYPES.includes(value) &&
        !supportedMimeTypes.has(value as MimeType)
      ) {
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
        const fileType = await fileTypeFromBuffer(value);
        if (!fileType) {
          throw new Error('Failed to detect mime type');
        }
        schema[key] = fileType.mime;
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

export const transformGraphQLResponse = (response) => {
  const protectedDataArray = response.protectedDatas
    .map((protectedData) => {
      try {
        const schema = JSON.parse(protectedData.jsonSchema);
        return {
          name: protectedData.name,
          address: protectedData.id,
          owner: protectedData.owner.id,
          schema: schema,
          creationTimestamp: protectedData.creationTimestamp,
          checksum: protectedData.checksum,
          blockNumber: protectedData.blockNumber,
          multiaddr: protectedData.multiaddr,
          transactionHash: protectedData.transactionHash,
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
  return protectedDataArray;
};
