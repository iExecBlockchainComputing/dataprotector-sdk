import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';
import { DataObject, DataSchema } from '../dataProtector/types.js';

const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;

export const ensureKeyIsValid = (key: string) => {
  if (key === '') {
    throw Error(`Unsupported empty key`);
  }
  if (!ALLOWED_KEY_NAMES_REGEXP.test(key)) {
    throw Error(`Unsupported special character in key`);
  }
};

export const extractDataSchema = async (
  data: DataObject
): Promise<DataSchema> => {
  const schema: DataSchema = {};
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
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const valueOfKey = data[key];
      const typeOfValue = typeof valueOfKey;
      if (
        typeOfValue === 'boolean' ||
        typeOfValue === 'number' ||
        typeOfValue === 'string'
      ) {
        schema[key] = typeOfValue;
      } else if (typeOfValue === 'object') {
        if (valueOfKey instanceof Uint8Array) {
          const fileType = await fileTypeFromBuffer(valueOfKey);
          if (!fileType) {
            throw new Error('Failed to detect mime type');
          }
          schema[key] = fileType.mime;
        } else {
          const nestedDataObject = valueOfKey as DataObject;
          const nestedSchema = await extractDataSchema(nestedDataObject);
          schema[key] = nestedSchema;
        }
      } else {
        throw Error(`Unsupported ${typeOfValue} data`);
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
      value !== null &&
      !(value instanceof Array) &&
      !(value instanceof Buffer) &&
      !(value instanceof ArrayBuffer) &&
      !(value instanceof Uint8Array)
    ) {
      zip.folder(fullPath);
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        createFileOrDirectory(nestedKey, nestedValue, fullPath);
      }
    } else {
      let content;
      if (typeof value === 'number') {
        content = value.toString();
      } else if (typeof value === 'boolean') {
        value ? (value = '1') : (value = '0');
      } else {
        content = value as Uint8Array | string | ArrayBuffer | Buffer;
      }
      promises.push(
        zip
          .file(fullPath, content)
          .generateAsync({ type: 'uint8array' }) as Promise<any>
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
